import { NextRequest, NextResponse } from "next/server";
import { verifyPassword, getRoom } from "@/lib/redis";

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

    if (!room.password) {
      return NextResponse.json({ success: true, verified: true });
    }

    const body = await request.json();
    const { password } = body;

    const valid = await verifyPassword(params.id, password || "");

    return NextResponse.json({ success: true, verified: valid });
  } catch (error) {
    console.error("Verify password error:", error);
    return NextResponse.json(
      { success: false, error: "验证失败" },
      { status: 500 }
    );
  }
}
