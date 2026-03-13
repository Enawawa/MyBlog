import { SignJWT, jwtVerify, type JWTPayload } from "jose";

const JWT_ISSUER = "myblog";
const JWT_AUDIENCE = "myblog-search";
const JWT_SCOPE = "search:qa";
const DEFAULT_TTL_SECONDS = 60 * 10;

interface SearchTokenPayload extends JWTPayload {
  clientId: string;
  scope: string;
}

function getJwtSecret() {
  const secret = process.env.SEARCH_JWT_SECRET;
  if (!secret) {
    throw new Error("未配置 SEARCH_JWT_SECRET");
  }
  return new TextEncoder().encode(secret);
}

export async function signSearchToken(clientId: string, ttlSeconds = DEFAULT_TTL_SECONDS) {
  return new SignJWT({ clientId, scope: JWT_SCOPE })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${ttlSeconds}s`)
    .sign(getJwtSecret());
}

export async function verifySearchToken(token: string): Promise<SearchTokenPayload> {
  const { payload } = await jwtVerify(token, getJwtSecret(), {
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  });
  if (payload.scope !== JWT_SCOPE || typeof payload.clientId !== "string") {
    throw new Error("JWT scope 或 clientId 无效");
  }
  return payload as SearchTokenPayload;
}

export const SEARCH_TOKEN_TTL_SECONDS = DEFAULT_TTL_SECONDS;
