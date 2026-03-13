import { NextRequest, NextResponse } from "next/server";
import { SEARCH_TOKEN_TTL_SECONDS, signSearchToken } from "@/lib/jwt";

function getExpectedClientId() {
  return process.env.SEARCH_CLIENT_ID || process.env.NEXT_PUBLIC_SEARCH_CLIENT_ID;
}

export async function POST(req: NextRequest) {
  const expectedClientId = getExpectedClientId();
  if (!expectedClientId) {
    return NextResponse.json(
      { error: "未配置 SEARCH_CLIENT_ID 或 NEXT_PUBLIC_SEARCH_CLIENT_ID" },
      { status: 500 }
    );
  }

  const clientId = req.headers.get("x-client-id");
  if (!clientId || clientId !== expectedClientId) {
    return NextResponse.json({ error: "客户端身份校验失败" }, { status: 401 });
  }

  try {
    const token = await signSearchToken(clientId);
    return NextResponse.json({
      token,
      tokenType: "Bearer",
      expiresIn: SEARCH_TOKEN_TTL_SECONDS,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "JWT 生成失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
