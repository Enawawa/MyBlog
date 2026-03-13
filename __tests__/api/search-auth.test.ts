/**
 * @jest-environment node
 */

import { POST as issueToken } from "@/app/api/auth/token/route";
import { POST as searchQA } from "@/app/api/search/route";

function makeRequest(url: string, init: RequestInit) {
  return new Request(url, init);
}

describe("search JWT auth flow", () => {
  beforeEach(() => {
    process.env.SEARCH_JWT_SECRET = "unit-test-secret";
    process.env.SEARCH_CLIENT_ID = "myblog-web";
  });

  it("returns 401 when client id is invalid", async () => {
    const res = await issueToken(
      makeRequest("http://localhost/api/auth/token", {
        method: "POST",
        headers: { "x-client-id": "invalid-client" },
      }) as never
    );
    expect(res.status).toBe(401);
  });

  it("issues JWT and allows asking questions with Bearer token", async () => {
    const tokenRes = await issueToken(
      makeRequest("http://localhost/api/auth/token", {
        method: "POST",
        headers: { "x-client-id": "myblog-web" },
      }) as never
    );
    expect(tokenRes.status).toBe(200);

    const tokenData = await tokenRes.json();
    const searchRes = await searchQA(
      makeRequest("http://localhost/api/search", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokenData.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: "怎么生成废话诗？" }),
      }) as never
    );

    expect(searchRes.status).toBe(200);
    const data = await searchRes.json();
    expect(data.answer).toContain("废话文学");
    expect(data.question).toBe("怎么生成废话诗？");
  });

  it("returns 401 when Bearer token is missing", async () => {
    const res = await searchQA(
      makeRequest("http://localhost/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: "共享剪贴板怎么用？" }),
      }) as never
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 for too-short question", async () => {
    const tokenRes = await issueToken(
      makeRequest("http://localhost/api/auth/token", {
        method: "POST",
        headers: { "x-client-id": "myblog-web" },
      }) as never
    );
    const tokenData = await tokenRes.json();

    const searchRes = await searchQA(
      makeRequest("http://localhost/api/search", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokenData.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: "a" }),
      }) as never
    );
    expect(searchRes.status).toBe(400);
  });
});
