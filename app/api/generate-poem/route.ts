import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import redis from "@/lib/redis";

const POEM_PREFIX = "poem:";
const POEM_LIST_KEY = "poems:recent";

const SYSTEM_PROMPT = `你是一个「废话文学」诗人。废话文学的核心特征：
1. 每一句话单独看语法通顺、逻辑正确
2. 但整体读完发现什么有效信息都没传达
3. 常用手法：同义反复、循环论证、正确的废话、把简单的事说复杂
4. 风格：打工人日常视角，带有淡淡的丧和自嘲幽默
5. 句与句之间有因果/转折/递进等逻辑连接词，让读者觉得"好像说得很有道理"

经典范例风格：
- "听君一席话，如听一席话"
- "每天睡前我都会想一想，然后就睡了"
- "上班的意义就是为了下班"
- "能说出这种话的人，一定是能说出这种话的人"

你的写作规则（严格遵守）：
- 每首诗 6-10 行
- 每行 6-20 个字
- 必须围绕用户给出的关键词展开
- 句子逻辑要通顺、自然，不能是随机词语拼凑
- 整首诗要有"废话感"：正确但无用、循环但流畅
- 不要加标题、不要加引号、不要加序号
- 只输出诗歌正文，每行一句，不要有其他任何内容`;

export async function POST(req: NextRequest) {
  try {
    const { keywords } = await req.json();

    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return NextResponse.json(
        { error: "请提供至少一个关键词" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "未配置 GEMINI_API_KEY" },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const userPrompt = `请围绕以下关键词写一首废话文学短诗：${keywords.join("、")}`;

    const result = await model.generateContent(
      SYSTEM_PROMPT + "\n\n" + userPrompt
    );

    const text = result.response.text().trim();
    const lines = text
      .split("\n")
      .map((l: string) => l.trim())
      .filter((l: string) => l.length > 0 && l.length < 50);

    if (lines.length < 3) {
      return NextResponse.json(
        { error: "生成结果不符合预期，请重试" },
        { status: 500 }
      );
    }

    // Store in Redis with unique ID
    const { nanoid } = await import("nanoid");
    const id = `ai-${nanoid(10)}`;
    const poem = {
      id,
      lines,
      keywords: keywords.slice(0, 5),
      createdAt: new Date().toISOString().slice(0, 10),
      ai: true,
    };

    try {
      await redis.set(`${POEM_PREFIX}${id}`, JSON.stringify(poem), { ex: 86400 * 30 });
      await redis.lpush(POEM_LIST_KEY, JSON.stringify({ id, keywords: poem.keywords, createdAt: poem.createdAt }));
      await redis.ltrim(POEM_LIST_KEY, 0, 199);
    } catch {
      // Redis failures are non-fatal; poem still returned to user
    }

    return NextResponse.json(poem);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "生成失败";
    console.error("Poem generation error:", message);
    return NextResponse.json({ error: `生成失败: ${message}` }, { status: 500 });
  }
}
