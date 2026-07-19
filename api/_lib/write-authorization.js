import { createRemoteJWKSet, jwtVerify } from "jose";

export const AIRADAR_VERCEL_IDENTITY = Object.freeze({
  issuer: "https://oidc.vercel.com/frankly-bautistas-projects",
  audience: "https://vercel.com/frankly-bautistas-projects",
  ownerId: "team_RAoLCxK2Biqr0Ug7zV5fM8gs",
  projectId: "prj_XVE8chqO32eOGAWzhQ9oFLOul3Zy",
  project: "ai-radar",
});

const vercelKeys = createRemoteJWKSet(
  new URL(`${AIRADAR_VERCEL_IDENTITY.issuer}/.well-known/jwks`),
);

const ALLOWED_VERCEL_ENVIRONMENTS = new Set(["development", "preview", "production"]);

async function verifyVercelOidc(token) {
  const { payload } = await jwtVerify(token, vercelKeys, {
    issuer: AIRADAR_VERCEL_IDENTITY.issuer,
    audience: AIRADAR_VERCEL_IDENTITY.audience,
  });
  return payload;
}

function bearerToken(authorization) {
  if (typeof authorization !== "string" || !authorization.startsWith("Bearer ")) {
    return null;
  }
  const token = authorization.slice("Bearer ".length).trim();
  return token || null;
}

export async function authorizeWriteRequest(
  authorization,
  { verifyOidc = verifyVercelOidc } = {},
) {
  const token = bearerToken(authorization);
  if (!token) return null;

  if (process.env.AIRADAR_WRITE_TOKEN && token === process.env.AIRADAR_WRITE_TOKEN) {
    return { type: "static-token" };
  }

  try {
    const claims = await verifyOidc(token);
    const validIdentity =
      claims.owner_id === AIRADAR_VERCEL_IDENTITY.ownerId &&
      claims.project_id === AIRADAR_VERCEL_IDENTITY.projectId &&
      claims.project === AIRADAR_VERCEL_IDENTITY.project &&
      ALLOWED_VERCEL_ENVIRONMENTS.has(claims.environment) &&
      typeof claims.user_id === "string" &&
      claims.user_id.length > 0;

    return validIdentity
      ? { type: "vercel-oidc", subject: claims.sub, userId: claims.user_id }
      : null;
  } catch {
    return null;
  }
}
