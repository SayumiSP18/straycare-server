import jwt, { SignOptions } from "jsonwebtoken";
import { randomUUID } from "crypto";
import { UserRole } from "../models/user_model";

export interface TokenPayload {
  id: string;
  role: UserRole;
}

// Read secrets inside functions so dotenv has already loaded them
const getSecret = (name: "JWT_SECRET" | "JWT_REFRESH_SECRET"): string => {
  const secret = process.env[name];
  if (!secret) throw new Error(`${name} is not defined in .env`);
  return secret;
};

export const signAccessToken = (payload: TokenPayload): string =>
  jwt.sign(payload, getSecret("JWT_SECRET"), {
    expiresIn: (process.env.JWT_ACCESS_EXPIRES || "15m") as SignOptions["expiresIn"],
  });

export const signRefreshToken = (payload: TokenPayload): string =>
  jwt.sign(payload, getSecret("JWT_REFRESH_SECRET"), {
    expiresIn: (process.env.JWT_REFRESH_EXPIRES || "7d") as SignOptions["expiresIn"],
    jwtid: randomUUID(), // makes every refresh token unique
  });

export const verifyAccessToken = (token: string): TokenPayload =>
  jwt.verify(token, getSecret("JWT_SECRET")) as TokenPayload;

export const verifyRefreshToken = (token: string): TokenPayload =>
  jwt.verify(token, getSecret("JWT_REFRESH_SECRET")) as TokenPayload;