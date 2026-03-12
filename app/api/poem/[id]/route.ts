import { NextRequest, NextResponse } from "next/server";
import redis from "@/lib/redis";

const POEM_PREFIX = "poem:";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  if (!id.startsWith("ai-")) {
    return NextResponse.json({ error: "仅支持查询 AI 生成的诗歌" }, { status: 400 });
  }

  try {
    const data = await redis.get<string>(`${POEM_PREFIX}${id}`);
    if (!data) {
      return NextResponse.json({ error: "诗歌不存在或已过期" }, { status: 404 });
    }
    const poem = typeof data === "string" ? JSON.parse(data) : data;
    return NextResponse.json(poem);
  } catch {
    return NextResponse.json({ error: "读取失败" }, { status: 500 });
  }
}
