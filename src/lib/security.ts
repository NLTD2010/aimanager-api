import { hash as argon2Hash, verify as argon2Verify } from "@node-rs/argon2";
import * as jwt from "jsonwebtoken";

export async function hashPassword(password: string){
  return argon2Hash(password, {
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
    outputLen: 32
  });
}

export async function verifyPassword(password: string, stored: string){
  return argon2Verify(stored, password);
}

type JwtPrimitive = string | number | boolean | null;

type JwtPayloadBase = Record<string, JwtPrimitive>;

type JwtPayload = JwtPayloadBase & {
  sub: string;
  exp: number;
  iat: number;
};

export function signJwt(payload: JwtPayloadBase & { sub: string }, secret: string, expiresInSeconds: number){
  return jwt.sign(payload, secret, {
    algorithm: "HS256",
    expiresIn: expiresInSeconds
  });
}

export async function verifyJwt(token: string, secret: string){
  try {
    const decoded = jwt.verify(token, secret, { algorithms: ["HS256"] });
    if (!decoded || typeof decoded === "string") return null;

    const payload = decoded as Partial<JwtPayload>;
    if (typeof payload.sub !== "string" || typeof payload.iat !== "number" || typeof payload.exp !== "number") return null;
    return payload as JwtPayload;
  } catch {
    return null;
  }
}
