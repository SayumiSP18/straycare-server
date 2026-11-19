import { Request, Response } from "express";
import { z } from "zod";
import { GoogleGenAI } from "@google/genai";
import { Animal, AnimalStatus } from "../models/animal_model";

const chatSchema = z.object({
  message: z.string().trim().min(1, "Message is required").max(1000),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(2000),
      })
    )
    .max(10)
    .optional(),
});

const getAiClient = (): GoogleGenAI | null => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const isRetryableAiError = (err: unknown): boolean => {
  const text = JSON.stringify(err ?? "").toLowerCase();
  return (
    text.includes("503") ||
    text.includes("unavailable") ||
    text.includes("high demand") ||
    text.includes("429") ||
    text.includes("resource_exhausted")
  );
};

export const chatWithBot = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = chatSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parsed.error.issues.map((i) => i.message),
      });
      return;
    }

    const ai = getAiClient();
    if (!ai) {
      res.status(503).json({
        success: false,
        message: "AI service is not configured yet (missing GEMINI_API_KEY)",
      });
      return;
    }

    const animals = await Animal.find({
      status: { $in: [AnimalStatus.AVAILABLE, AnimalStatus.PENDING] },
    })
      .limit(15)
      .lean();

    const petSummary =
      animals.length > 0
        ? animals
            .map((a) => {
              const doc = a as unknown as Record<string, unknown>;
              const loc =
                typeof doc.location === "string" && doc.location
                  ? doc.location
                  : typeof doc.city === "string" && doc.city
                    ? doc.city
                    : "Sri Lanka";
              return `- ${String(doc.name ?? "Unnamed")} (${String(doc.species ?? "PET")}) at ${loc} [${String(doc.status ?? "AVAILABLE")}]`;
            })
            .join("\n")
        : "No animals currently listed as available.";

    const systemInstruction = `
You are the StrayCare AI Assistant for a community stray animal rescue and adoption platform in Sri Lanka.
Help users with:
1. Reporting stray dogs or cats (condition: HEALTHY, INJURED, URGENT; location; photo).
2. Finding pets available for adoption and explaining the adoption request & approval flow.
3. Basic first-aid/care guidance while waiting for a rescuer or vet (always advise seeing a licensed veterinarian for injuries/illness).
4. Citizen vs Rescuer registration (Rescuer accounts require admin approval).

Current animals in the system:
${petSummary}

Keep answers clear, friendly, concise, and helpful.
`.trim();

    const formattedHistory = (parsed.data.history ?? []).map((item) => ({
      role: item.role === "assistant" ? "model" : "user",
      parts: [{ text: item.content }],
    }));

    const contents = [
      ...formattedHistory,
      { role: "user", parts: [{ text: parsed.data.message }] },
    ];

    const primaryModel = process.env.GEMINI_MODEL || "gemini-3.8-flash";
    const modelsToTry = [primaryModel, "gemini-2.5-flash"];

    let responseText = "";
    let lastError: unknown;

    for (const model of modelsToTry) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const response = await ai.models.generateContent({
            model,
            contents,
            config: {
              systemInstruction,
            },
          });
          responseText = response.text?.trim() || "";
          if (responseText) break;
        } catch (err) {
          lastError = err;
          if (isRetryableAiError(err) && attempt === 0) {
            await sleep(700);
            continue;
          }
          break;
        }
      }
      if (responseText) break;
    }

    if (!responseText) {
      throw lastError ?? new Error("Empty response from AI model");
    }

    res.status(200).json({
      success: true,
      message: "AI reply generated",
      data: { reply: responseText },
    });
  } catch (error) {
    console.error("ChatWithBot error:", error);
    const statusCode = isRetryableAiError(error) ? 503 : 500;
    const msg = isRetryableAiError(error)
      ? "The AI service is busy right now. Please try again in a moment."
      : "Could not process AI request";
    res.status(statusCode).json({ success: false, message: msg });
  }
};