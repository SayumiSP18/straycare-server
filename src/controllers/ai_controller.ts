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

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      config: {
        systemInstruction,
        temperature: 0.5,
      },
    });

    const reply = response.text?.trim() || "Sorry, I couldn't generate a response right now.";

    res.status(200).json({
      success: true,
      message: "AI reply generated",
      data: { reply },
    });
  } catch (error) {
    console.error("ChatWithBot error:", error);
    res.status(500).json({ success: false, message: "Could not process AI request" });
  }
};