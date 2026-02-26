import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export interface Room {
  id: string;
  name: string;
  password: string;
  createdAt: number;
}

export interface Message {
  id: string;
  type: "text" | "image";
  content: string;
  timestamp: number;
  sender: string;
}

const ROOM_PREFIX = "room:";
const MESSAGES_PREFIX = "messages:";
const ROOM_TTL = 60 * 60 * 24 * 7; // 7 days

export async function createRoom(
  name: string,
  password: string
): Promise<Room> {
  const { nanoid } = await import("nanoid");
  const id = nanoid(8);
  const room: Room = {
    id,
    name: name || `房间 ${id}`,
    password,
    createdAt: Date.now(),
  };

  await redis.set(`${ROOM_PREFIX}${id}`, JSON.stringify(room), {
    ex: ROOM_TTL,
  });

  return room;
}

export async function getRoom(id: string): Promise<Room | null> {
  const data = await redis.get<string>(`${ROOM_PREFIX}${id}`);
  if (!data) return null;
  return typeof data === "string" ? JSON.parse(data) : data;
}

export async function deleteRoom(id: string): Promise<boolean> {
  const pipeline = redis.pipeline();
  pipeline.del(`${ROOM_PREFIX}${id}`);
  pipeline.del(`${MESSAGES_PREFIX}${id}`);
  await pipeline.exec();
  return true;
}

export async function verifyPassword(
  id: string,
  password: string
): Promise<boolean> {
  const room = await getRoom(id);
  if (!room) return false;
  if (!room.password) return true;
  return room.password === password;
}

export async function addMessage(
  roomId: string,
  message: Omit<Message, "id" | "timestamp">
): Promise<Message> {
  const { nanoid } = await import("nanoid");
  const fullMessage: Message = {
    ...message,
    id: nanoid(12),
    timestamp: Date.now(),
  };

  await redis.rpush(
    `${MESSAGES_PREFIX}${roomId}`,
    JSON.stringify(fullMessage)
  );

  await redis.expire(`${MESSAGES_PREFIX}${roomId}`, ROOM_TTL);

  return fullMessage;
}

export async function getMessages(
  roomId: string,
  after?: number
): Promise<Message[]> {
  const raw = await redis.lrange(`${MESSAGES_PREFIX}${roomId}`, 0, -1);
  const messages: Message[] = raw.map((item) =>
    typeof item === "string" ? JSON.parse(item) : item
  );

  if (after) {
    return messages.filter((m) => m.timestamp > after);
  }
  return messages;
}

export default redis;
