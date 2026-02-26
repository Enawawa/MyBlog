import { NextRequest, NextResponse } from "next/server";
import { getRoom, deleteRoom, verifyPassword } from "@/lib/redis";

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

    return NextResponse.json({
      success: true,
      room: {
        id: room.id,
        name: room.name,
        hasPassword: !!room.password,
        createdAt: room.createdAt,
      },
    });
  } catch (error) {
    console.error("Get room error:", error);
    return NextResponse.json(
      { success: false, error: "获取房间信息失败" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { password } = body;

    const room = await getRoom(params.id);
    if (!room) {
      return NextResponse.json(
        { success: false, error: "房间不存在" },
        { status: 404 }
      );
    }

    if (room.password) {
      const valid = await verifyPassword(params.id, password || "");
      if (!valid) {
        return NextResponse.json(
          { success: false, error: "密码错误" },
          { status: 403 }
        );
      }
    }

    await deleteRoom(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete room error:", error);
    return NextResponse.json(
      { success: false, error: "删除房间失败" },
      { status: 500 }
    );
  }
}
