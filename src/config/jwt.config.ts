import {
  _JWTSECRET,
  _JWT_ACCESS_EXPIRES_IN,
  _JWT_REFRESH_EXPIRES_IN,
} from "../secret";

export const jwtConfig = {
  secret: _JWTSECRET || "default-secret-key-change-in-production",
  accessTokenExpiresIn: _JWT_ACCESS_EXPIRES_IN || "15m",
  refreshTokenExpiresIn: _JWT_REFRESH_EXPIRES_IN || "7d",
  accessTokenExpiresInSeconds: 15 * 60, // 15 minutes
  refreshTokenExpiresInSeconds: 7 * 24 * 60 * 60, // 7 days
};

export const getExpiresInSeconds = (expiresIn: string): number => {
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) return 900; // default 15 minutes

  const value = parseInt(match[1]);
  const unit = match[2];

  switch (unit) {
    case "s":
      return value;
    case "m":
      return value * 60;
    case "h":
      return value * 60 * 60;
    case "d":
      return value * 24 * 60 * 60;
    default:
      return 900;
  }
};
