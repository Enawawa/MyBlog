/**
 * @jest-environment node
 *
 * Redis lib unit tests — mock Upstash Redis client.
 */

const mockSet = jest.fn().mockResolvedValue("OK");
const mockGet = jest.fn();
const mockRpush = jest.fn().mockResolvedValue(1);
const mockLrange = jest.fn().mockResolvedValue([]);
const mockExpire = jest.fn().mockResolvedValue(1);
const mockPipelineDel = jest.fn();
const mockPipelineExec = jest.fn().mockResolvedValue([]);

jest.mock("@upstash/redis", () => {
  return {
    Redis: jest.fn().mockImplementation(() => ({
      set: (...args: unknown[]) => mockSet(...args),
      get: (...args: unknown[]) => mockGet(...args),
      rpush: (...args: unknown[]) => mockRpush(...args),
      lrange: (...args: unknown[]) => mockLrange(...args),
      expire: (...args: unknown[]) => mockExpire(...args),
      del: jest.fn(),
      pipeline: jest.fn(() => ({
        del: mockPipelineDel,
        exec: mockPipelineExec,
      })),
    })),
  };
});

jest.mock("nanoid", () => ({
  nanoid: (len?: number) => "t" + "x".repeat((len || 8) - 1),
}));

import { createRoom, getRoom, deleteRoom, verifyPassword, addMessage, getMessages } from "@/lib/redis";

describe("createRoom", () => {
  beforeEach(() => jest.clearAllMocks());

  it("creates a room with name and password", async () => {
    const room = await createRoom("测试房间", "abc123");
    expect(room.id).toBeDefined();
    expect(room.name).toBe("测试房间");
    expect(room.password).toBe("abc123");
    expect(room.createdAt).toBeDefined();
    expect(mockSet).toHaveBeenCalledTimes(1);
  });

  it("creates a room with default name when name is empty", async () => {
    const room = await createRoom("", "");
    expect(room.name).toContain("房间");
    expect(room.password).toBe("");
  });
});

describe("getRoom", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns room when it exists", async () => {
    const data = { id: "abc", name: "测试", password: "s", createdAt: 1700000000000 };
    mockGet.mockResolvedValueOnce(JSON.stringify(data));
    const room = await getRoom("abc");
    expect(room).not.toBeNull();
    expect(room!.id).toBe("abc");
  });

  it("returns null when room does not exist", async () => {
    mockGet.mockResolvedValueOnce(null);
    expect(await getRoom("none")).toBeNull();
  });
});

describe("verifyPassword", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns true for correct password", async () => {
    mockGet.mockResolvedValueOnce(JSON.stringify({ id: "r", name: "t", password: "secret", createdAt: 0 }));
    expect(await verifyPassword("r", "secret")).toBe(true);
  });

  it("returns false for wrong password", async () => {
    mockGet.mockResolvedValueOnce(JSON.stringify({ id: "r", name: "t", password: "secret", createdAt: 0 }));
    expect(await verifyPassword("r", "wrong")).toBe(false);
  });

  it("returns true for room without password", async () => {
    mockGet.mockResolvedValueOnce(JSON.stringify({ id: "r", name: "t", password: "", createdAt: 0 }));
    expect(await verifyPassword("r", "")).toBe(true);
  });

  it("returns false when room does not exist", async () => {
    mockGet.mockResolvedValueOnce(null);
    expect(await verifyPassword("none", "any")).toBe(false);
  });
});

describe("deleteRoom", () => {
  beforeEach(() => jest.clearAllMocks());

  it("calls pipeline del for room and messages keys", async () => {
    expect(await deleteRoom("r1")).toBe(true);
    expect(mockPipelineDel).toHaveBeenCalledTimes(2);
    expect(mockPipelineExec).toHaveBeenCalledTimes(1);
  });
});

describe("addMessage", () => {
  beforeEach(() => jest.clearAllMocks());

  it("adds a text message and returns full message object", async () => {
    const msg = await addMessage("r1", { type: "text", content: "hello", sender: "Alice" });
    expect(msg.id).toBeDefined();
    expect(msg.type).toBe("text");
    expect(msg.content).toBe("hello");
    expect(msg.sender).toBe("Alice");
    expect(msg.timestamp).toBeDefined();
    expect(mockRpush).toHaveBeenCalledTimes(1);
  });

  it("adds an image message", async () => {
    const msg = await addMessage("r1", { type: "image", content: "data:image/png;base64,abc", sender: "Bob" });
    expect(msg.type).toBe("image");
    expect(msg.content).toBe("data:image/png;base64,abc");
  });
});

describe("getMessages", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns all messages when no after param", async () => {
    mockLrange.mockResolvedValueOnce([
      JSON.stringify({ id: "m1", type: "text", content: "hi", timestamp: 100, sender: "A" }),
      JSON.stringify({ id: "m2", type: "text", content: "bye", timestamp: 200, sender: "B" }),
    ]);
    const msgs = await getMessages("r1");
    expect(msgs).toHaveLength(2);
    expect(msgs[0].content).toBe("hi");
  });

  it("filters messages by timestamp when after is provided", async () => {
    mockLrange.mockResolvedValueOnce([
      JSON.stringify({ id: "m1", type: "text", content: "old", timestamp: 100, sender: "A" }),
      JSON.stringify({ id: "m2", type: "text", content: "new", timestamp: 200, sender: "B" }),
    ]);
    const msgs = await getMessages("r1", 150);
    expect(msgs).toHaveLength(1);
    expect(msgs[0].content).toBe("new");
  });

  it("returns empty array for empty room", async () => {
    mockLrange.mockResolvedValueOnce([]);
    expect(await getMessages("r1")).toHaveLength(0);
  });
});
