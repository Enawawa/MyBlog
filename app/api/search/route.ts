import { NextRequest, NextResponse } from "next/server";
import { verifySearchToken } from "@/lib/jwt";

interface KnowledgeItem {
  keywords: string[];
  answer: string;
}

const KNOWLEDGE_BASE: KnowledgeItem[] = [
  {
    keywords: ["废话", "诗", "生成", "nonsense"],
    answer:
      "你可以去「废话文学」页面，用关键词一键生成短诗，并通过分享链接把结果发给朋友。",
  },
  {
    keywords: ["剪贴板", "room", "房间", "分享"],
    answer:
      "共享剪贴板支持创建房间、粘贴文字或图片实时同步，也可以设置口令管理内容。",
  },
  {
    keywords: ["游戏", "flappy", "飞跃", "小鸟"],
    answer:
      "站内有飞跃小鸟小游戏，支持触摸和键盘操作，还可以全屏和记录最高分。",
  },
  {
    keywords: ["日常", "thoughts", "博客", "文章"],
    answer:
      "博客包含日常小记与碎片感受两个主要内容区，首页卡片可快速导航。",
  },
];

function findAnswer(question: string) {
  const normalized = question.toLowerCase();
  const hit = KNOWLEDGE_BASE.find((item) =>
    item.keywords.some((keyword) => normalized.includes(keyword.toLowerCase()))
  );
  if (hit) {
    return hit.answer;
  }

  return `已收到你的问题：「${question.trim()}」。目前我可以回答站内功能相关问题，例如废话文学、共享剪贴板、小游戏或博客栏目。`;
}

function getBearerToken(authHeader: string | null) {
  if (!authHeader) return null;
  const [scheme, token] = authHeader.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;
  return token;
}

export async function POST(req: NextRequest) {
  const token = getBearerToken(req.headers.get("authorization"));
  if (!token) {
    return NextResponse.json({ error: "缺少 Bearer Token" }, { status: 401 });
  }

  try {
    await verifySearchToken(token);
  } catch {
    return NextResponse.json({ error: "JWT 无效或已过期" }, { status: 401 });
  }

  try {
    const { question } = await req.json();
    if (typeof question !== "string" || question.trim().length < 2) {
      return NextResponse.json(
        { error: "请输入至少 2 个字符的问题" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      question: question.trim(),
      answer: findAnswer(question),
    });
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }
}
