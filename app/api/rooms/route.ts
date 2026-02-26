import { NextRequest, NextResponse } from "next/server";
import { createRoom } from "@/lib/redis";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, password } = body;

    const room = await createRoom(name || "", password || "");

    return NextResponse.json({
      success: true,
      room: { id: room.id, name: room.name, hasPassword: !!room.password },
    });
  } catch (error) {
    console.error("Create room error:", error);
    return NextResponse.json(
      { success: false, error: "创建房间失败" },
      { status: 500 }
    );
  }
}
