import assert from "node:assert/strict";
import test from "node:test";

import {
  AIRADAR_VERCEL_IDENTITY,
  authorizeWriteRequest,
} from "../api/_lib/write-authorization.js";

async function withWriteToken(value, callback) {
  const previous = process.env.AIRADAR_WRITE_TOKEN;
  if (value === undefined) delete process.env.AIRADAR_WRITE_TOKEN;
  else process.env.AIRADAR_WRITE_TOKEN = value;
  try {
    return await callback();
  } finally {
    if (previous === undefined) delete process.env.AIRADAR_WRITE_TOKEN;
    else process.env.AIRADAR_WRITE_TOKEN = previous;
  }
}

const validClaims = {
  iss: AIRADAR_VERCEL_IDENTITY.issuer,
  aud: AIRADAR_VERCEL_IDENTITY.audience,
  sub: "owner:frankly-bautistas-projects:project:ai-radar:environment:development",
  owner_id: AIRADAR_VERCEL_IDENTITY.ownerId,
  project_id: AIRADAR_VERCEL_IDENTITY.projectId,
  project: AIRADAR_VERCEL_IDENTITY.project,
  environment: "development",
  user_id: "user_test",
};

test("autoriza el token estático sin registrarlo", async () => {
  await withWriteToken("write-secret-test", async () => {
    const result = await authorizeWriteRequest("Bearer write-secret-test");
    assert.deepEqual(result, { type: "static-token" });
  });
});

test("autoriza un OIDC temporal limitado al proyecto AI Radar", async () => {
  await withWriteToken(undefined, async () => {
    const result = await authorizeWriteRequest("Bearer signed-vercel-jwt", {
      verifyOidc: async () => validClaims,
    });
    assert.equal(result.type, "vercel-oidc");
    assert.equal(result.userId, "user_test");
  });
});

test("autoriza OIDC de producción del mismo proyecto", async () => {
  await withWriteToken(undefined, async () => {
    const result = await authorizeWriteRequest("Bearer signed-vercel-jwt", {
      verifyOidc: async () => ({ ...validClaims, environment: "production" }),
    });
    assert.equal(result.type, "vercel-oidc");
  });
});

test("rechaza OIDC de otro proyecto o sin usuario local", async () => {
  await withWriteToken(undefined, async () => {
    const otherProject = await authorizeWriteRequest("Bearer signed-vercel-jwt", {
      verifyOidc: async () => ({ ...validClaims, project_id: "prj_other" }),
    });
    const deploymentToken = await authorizeWriteRequest("Bearer signed-vercel-jwt", {
      verifyOidc: async () => ({ ...validClaims, environment: "production", user_id: undefined }),
    });
    assert.equal(otherProject, null);
    assert.equal(deploymentToken, null);
  });
});
