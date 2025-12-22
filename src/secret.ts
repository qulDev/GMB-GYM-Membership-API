import dotenv from "dotenv";

dotenv.config({ path: ".env" });

// database
export const _DATABASE_URL = process.env.DATABASE_URL;

// server
export const _PORT = process.env.PORT;

// redis
export const _REDIS_URL = process.env.REDIS_URL;

// midtrans
export const _MIDTRANS_CLIENT_KEY = process.env.MIDTRANS_CLIENT_KEY;
export const _MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY;
export const _MIDTRANS_IS_PRODUCTION =
  process.env.MIDTRANS_IS_PRODUCTION === "true";

// jwt
export const _JWTSECRET = process.env.JWT_SECRET;
export const _JWT_ACCESS_EXPIRES_IN =
  process.env.JWT_ACCESS_EXPIRES_IN || "15m";
export const _JWT_REFRESH_EXPIRES_IN =
  process.env.JWT_REFRESH_EXPIRES_IN || "7d";
