import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useParams: () => ({ id: "room123" }),
}));

const mockFetch = jest.fn();
global.fetch = mockFetch;

Object.assign(navigator, {
  clipboard: { writeText: jest.fn().mockResolvedValue(undefined) },
});

import RoomPage from "@/app/clipboard/room/[id]/page";

function roomOk(hasPassword = false) {
  return {
    json: async () => ({
      success: true,
      room: { id: "room123", name: "测试房间", hasPassword, createdAt: Date.now() },
    }),
  };
}

function msgsOk(messages: object[] = []) {
  return { json: async () => ({ success: true, messages }) };
}

function sendOk(msg: object) {
  return { json: async () => ({ success: true, message: msg }) };
}

function roomNotFound() {
  return { json: async () => ({ success: false, error: "房间不存在" }) };
}

describe("Room Page", () => {
  beforeEach(() => jest.clearAllMocks());

  it("shows loading spinner initially", () => {
    mockFetch.mockImplementation(() => new Promise(() => {}));
    render(<RoomPage />);
    expect(screen.getByText("加载中...")).toBeInTheDocument();
  });

  it("shows error screen when room not found", async () => {
    mockFetch.mockResolvedValueOnce(roomNotFound());
    await act(async () => { render(<RoomPage />); });
    expect(screen.getByText("无法进入房间")).toBeInTheDocument();
    expect(screen.getByText("房间不存在或已过期")).toBeInTheDocument();
  });

  it("shows password prompt for protected room", async () => {
    mockFetch.mockResolvedValueOnce(roomOk(true));
    await act(async () => { render(<RoomPage />); });
    expect(screen.getByText("此房间需要口令才能进入")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("请输入房间口令...")).toBeInTheDocument();
  });

  it("loads open room and shows empty state", async () => {
    mockFetch
      .mockResolvedValueOnce(roomOk(false))
      .mockResolvedValueOnce(msgsOk([]));

    await act(async () => { render(<RoomPage />); });
    await waitFor(() => expect(screen.getByText("还没有内容")).toBeInTheDocument());
    expect(screen.getByText("测试房间")).toBeInTheDocument();
    expect(screen.getByText("room123")).toBeInTheDocument();
  });

  it("displays existing messages", async () => {
    const msgs = [
      { id: "m1", type: "text", content: "Hello!", timestamp: Date.now(), sender: "Alice" },
      { id: "m2", type: "text", content: "World!", timestamp: Date.now() + 1, sender: "Bob" },
    ];
    mockFetch
      .mockResolvedValueOnce(roomOk(false))
      .mockResolvedValueOnce(msgsOk(msgs));

    await act(async () => { render(<RoomPage />); });
    await waitFor(() => {
      expect(screen.getByText("Hello!")).toBeInTheDocument();
      expect(screen.getByText("World!")).toBeInTheDocument();
      expect(screen.getByText("Alice")).toBeInTheDocument();
      expect(screen.getByText("Bob")).toBeInTheDocument();
    });
  });

  it("sends text and appends directly — no double fetch", async () => {
    const user = userEvent.setup();
    const sentMsg = {
      id: "msg_new", type: "text", content: "New msg",
      timestamp: Date.now(), sender: "匿名用户",
    };

    mockFetch
      .mockResolvedValueOnce(roomOk(false))
      .mockResolvedValueOnce(msgsOk([]))
      .mockResolvedValueOnce(sendOk(sentMsg));

    await act(async () => { render(<RoomPage />); });
    await waitFor(() => expect(screen.getByText("还没有内容")).toBeInTheDocument());

    const input = screen.getByPlaceholderText("输入消息，按回车发送...");
    await user.type(input, "New msg");
    await user.click(screen.getByRole("button", { name: "发送" }));

    await waitFor(() => expect(screen.getByText("New msg")).toBeInTheDocument());

    // Only 3 fetch calls: GET room, GET messages, POST send.
    // The old bug would have a 4th call (fetchMessages after send).
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it("deduplicates messages with the same ID", async () => {
    const msg = { id: "dup1", type: "text", content: "Dedup", timestamp: Date.now(), sender: "T" };

    mockFetch
      .mockResolvedValueOnce(roomOk(false))
      .mockResolvedValueOnce(msgsOk([msg]))
      .mockResolvedValue(msgsOk([msg])); // all future polls return same

    await act(async () => { render(<RoomPage />); });
    await waitFor(() => expect(screen.getByText("Dedup")).toBeInTheDocument());
    expect(screen.getAllByText("Dedup")).toHaveLength(1);
  });

  it("verifies password and enters room", async () => {
    const user = userEvent.setup();

    mockFetch
      .mockResolvedValueOnce(roomOk(true))
      .mockResolvedValueOnce({ json: async () => ({ success: true, verified: true }) })
      .mockResolvedValueOnce(msgsOk([]));

    await act(async () => { render(<RoomPage />); });
    await waitFor(() => expect(screen.getByPlaceholderText("请输入房间口令...")).toBeInTheDocument());

    await user.type(screen.getByPlaceholderText("请输入房间口令..."), "secret");
    await user.click(screen.getByRole("button", { name: "验证" }));

    await waitFor(() => expect(screen.getByText("还没有内容")).toBeInTheDocument());
  });

  it("rejects wrong password", async () => {
    const user = userEvent.setup();

    mockFetch
      .mockResolvedValueOnce(roomOk(true))
      .mockResolvedValueOnce({ json: async () => ({ success: true, verified: false }) });

    await act(async () => { render(<RoomPage />); });
    await waitFor(() => expect(screen.getByPlaceholderText("请输入房间口令...")).toBeInTheDocument());

    await user.type(screen.getByPlaceholderText("请输入房间口令..."), "wrong");
    await user.click(screen.getByRole("button", { name: "验证" }));

    await waitFor(() => expect(screen.getByText("口令错误")).toBeInTheDocument());
  });

  it("navigates back from error screen", async () => {
    const user = userEvent.setup();

    mockFetch.mockResolvedValueOnce(roomNotFound());

    await act(async () => { render(<RoomPage />); });
    await waitFor(() => expect(screen.getByText("返回共享剪贴板")).toBeInTheDocument());

    await user.click(screen.getByText("返回共享剪贴板"));
    expect(mockPush).toHaveBeenCalledWith("/clipboard");
  });
});
