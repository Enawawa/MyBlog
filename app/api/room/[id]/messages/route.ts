import { NextRequest, NextResponse } from "next/server";
import { getRoom, getMessages, addMessage, deleteMessage, clearMessages } from "@/lib/redis";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const room = await getRoom(params.id);
    if (!room) {
      return NextResponse.json(
        { success: false, error: "房间不存在" },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const after = searchParams.get("after");

    const messages = await getMessages(
      params.id,
      after ? parseInt(after) : undefined
    );

    return NextResponse.json({ success: true, messages });
  } catch (error) {
    console.error("Get messages error:", error);
    return NextResponse.json(
      { success: false, error: "获取消息失败" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const room = await getRoom(params.id);
    if (!room) {
      return NextResponse.json(
        { success: false, error: "房间不存在" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { type, content, sender, fileName } = body;

    if (!type || !content) {
      return NextResponse.json(
        { success: false, error: "消息内容不能为空" },
        { status: 400 }
      );
    }

    const MAX_IMAGE = 4 * 1024 * 1024;   // 4MB
    const MAX_VIDEO = 15 * 1024 * 1024;  // 15MB
    const MAX_FILE = 10 * 1024 * 1024;   // 10MB

    if (type === "image" && content.length > MAX_IMAGE) {
      return NextResponse.json(
        { success: false, error: "图片大小不能超过 4MB" },
        { status: 400 }
      );
    }
    if (type === "video" && content.length > MAX_VIDEO) {
      return NextResponse.json(
        { success: false, error: "视频大小不能超过 15MB" },
        { status: 400 }
      );
    }
    if (type === "file" && content.length > MAX_FILE) {
      return NextResponse.json(
        { success: false, error: "文件大小不能超过 10MB" },
        { status: 400 }
      );
    }

    const message = await addMessage(params.id, {
      type,
      content,
      sender: sender || "匿名用户",
      ...(fileName && { fileName }),
    });

    return NextResponse.json({ success: true, message });
  } catch (error) {
    console.error("Add message error:", error);
    return NextResponse.json(
      { success: false, error: "发送消息失败" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const room = await getRoom(params.id);
    if (!room) {
      return NextResponse.json(
        { success: false, error: "房间不存在" },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get("messageId");

    if (messageId) {
      const deleted = await deleteMessage(params.id, messageId);
      if (!deleted) {
        return NextResponse.json(
          { success: false, error: "消息不存在" },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true });
    }

    await clearMessages(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete message error:", error);
    return NextResponse.json(
      { success: false, error: "删除消息失败" },
      { status: 500 }
    );
  }
}
