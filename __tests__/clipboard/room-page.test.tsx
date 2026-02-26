import { render, screen, waitFor, act, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useParams: () => ({ id: "room123" }),
}));

const mockFetch = jest.fn();
global.fetch = mockFetch;

const mockWriteText = jest.fn().mockResolvedValue(undefined);
Object.defineProperty(navigator, "clipboard", {
  value: { writeText: mockWriteText },
  writable: true,
  configurable: true,
});

Element.prototype.scrollIntoView = jest.fn();

import RoomPage from "@/app/clipboard/room/[id]/page";

// ===== Helpers =====

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
function sendFail(error = "发送失败") {
  return { json: async () => ({ success: false, error }) };
}
function roomNotFound() {
  return { status: 404, json: async () => ({ success: false, error: "房间不存在" }) };
}
function verifyOk() {
  return { json: async () => ({ success: true, verified: true }) };
}
function verifyFail() {
  return { json: async () => ({ success: true, verified: false }) };
}
function deleteOk() {
  return { json: async () => ({ success: true }) };
}
function deleteFail(error = "密码错误") {
  return { json: async () => ({ success: false, error }) };
}

function makeTextMsg(id: string, content: string, sender = "匿名用户") {
  return { id, type: "text", content, timestamp: Date.now(), sender };
}
function makeImgMsg(id: string, sender = "匿名用户") {
  return { id, type: "image", content: "data:image/png;base64,AAAA", timestamp: Date.now(), sender };
}

async function enterRoom(opts: { hasPassword?: boolean; messages?: object[] } = {}) {
  const { hasPassword = false, messages = [] } = opts;
  mockFetch
    .mockResolvedValueOnce(roomOk(hasPassword))
    .mockResolvedValueOnce(msgsOk(messages));
  await act(async () => { render(<RoomPage />); });
  await waitFor(() => {
    if (messages.length > 0) {
      expect(screen.getByText("测试房间")).toBeInTheDocument();
    } else {
      expect(screen.getByText("还没有内容")).toBeInTheDocument();
    }
  });
}

// =============== TESTS ===============

describe("Room Page — Loading & Error States", () => {
  beforeEach(() => jest.clearAllMocks());

  it("shows loading spinner", () => {
    mockFetch.mockImplementation(() => new Promise(() => {}));
    render(<RoomPage />);
    expect(screen.getByText("加载中...")).toBeInTheDocument();
  });

  it("shows error when room not found", async () => {
    mockFetch.mockResolvedValueOnce(roomNotFound());
    await act(async () => { render(<RoomPage />); });
    expect(screen.getByText("无法进入房间")).toBeInTheDocument();
    expect(screen.getByText("房间不存在，请检查房间号")).toBeInTheDocument();
  });

  it("shows network error when fetch throws", async () => {
    mockFetch.mockRejectedValueOnce(new Error("fail"));
    await act(async () => { render(<RoomPage />); });
    expect(screen.getByText("无法进入房间")).toBeInTheDocument();
    expect(screen.getByText("网络错误")).toBeInTheDocument();
  });

  it("navigates back from error screen", async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValueOnce(roomNotFound());
    await act(async () => { render(<RoomPage />); });
    await user.click(screen.getByText("返回共享剪贴板"));
    expect(mockPush).toHaveBeenCalledWith("/clipboard");
  });
});

describe("Room Page — Password Verification", () => {
  beforeEach(() => jest.clearAllMocks());

  it("shows password prompt for protected room", async () => {
    mockFetch.mockResolvedValueOnce(roomOk(true));
    await act(async () => { render(<RoomPage />); });
    expect(screen.getByText("此房间需要口令才能进入")).toBeInTheDocument();
    expect(screen.getByText("测试房间")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("请输入房间口令...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "验证" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "返回" })).toBeInTheDocument();
  });

  it("enters room after correct password", async () => {
    const user = userEvent.setup();
    mockFetch
      .mockResolvedValueOnce(roomOk(true))
      .mockResolvedValueOnce(verifyOk())
      .mockResolvedValueOnce(msgsOk([]));

    await act(async () => { render(<RoomPage />); });
    await user.type(screen.getByPlaceholderText("请输入房间口令..."), "secret");
    await user.click(screen.getByRole("button", { name: "验证" }));

    await waitFor(() => expect(screen.getByText("还没有内容")).toBeInTheDocument());
  });

  it("submits password by pressing Enter", async () => {
    const user = userEvent.setup();
    mockFetch
      .mockResolvedValueOnce(roomOk(true))
      .mockResolvedValueOnce(verifyOk())
      .mockResolvedValueOnce(msgsOk([]));

    await act(async () => { render(<RoomPage />); });
    await user.type(screen.getByPlaceholderText("请输入房间口令..."), "secret{Enter}");

    await waitFor(() => expect(screen.getByText("还没有内容")).toBeInTheDocument());
  });

  it("shows error for wrong password", async () => {
    const user = userEvent.setup();
    mockFetch
      .mockResolvedValueOnce(roomOk(true))
      .mockResolvedValueOnce(verifyFail());

    await act(async () => { render(<RoomPage />); });
    await user.type(screen.getByPlaceholderText("请输入房间口令..."), "wrong");
    await user.click(screen.getByRole("button", { name: "验证" }));

    await waitFor(() => expect(screen.getByText("口令错误")).toBeInTheDocument());
  });

  it("shows error when verify fetch throws", async () => {
    const user = userEvent.setup();
    mockFetch
      .mockResolvedValueOnce(roomOk(true))
      .mockRejectedValueOnce(new Error("net"));

    await act(async () => { render(<RoomPage />); });
    await user.type(screen.getByPlaceholderText("请输入房间口令..."), "x");
    await user.click(screen.getByRole("button", { name: "验证" }));

    await waitFor(() => expect(screen.getByText("验证失败")).toBeInTheDocument());
  });

  it("navigates back from password screen", async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValueOnce(roomOk(true));
    await act(async () => { render(<RoomPage />); });
    await user.click(screen.getByRole("button", { name: "返回" }));
    expect(mockPush).toHaveBeenCalledWith("/clipboard");
  });
});

describe("Room Page — Room Header & Info", () => {
  beforeEach(() => jest.clearAllMocks());

  it("shows room name and ID", async () => {
    await enterRoom();
    expect(screen.getByText("测试房间")).toBeInTheDocument();
    expect(screen.getByText("room123")).toBeInTheDocument();
    expect(screen.getByText("房间号:")).toBeInTheDocument();
  });

  it("shows back arrow button", async () => {
    const user = userEvent.setup();
    await enterRoom();
    await user.click(screen.getByText("←"));
    expect(mockPush).toHaveBeenCalledWith("/clipboard");
  });

  it("shows share button but no delete button for open room", async () => {
    await enterRoom();
    expect(screen.getByRole("button", { name: /分享/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /delete/ })).not.toBeInTheDocument();
  });

  it("shows delete button for password-protected room", async () => {
    const user = userEvent.setup();
    mockFetch
      .mockResolvedValueOnce(roomOk(true))
      .mockResolvedValueOnce(verifyOk())
      .mockResolvedValueOnce(msgsOk([]));

    await act(async () => { render(<RoomPage />); });
    await user.type(screen.getByPlaceholderText("请输入房间口令..."), "s{Enter}");
    await waitFor(() => expect(screen.getByText("还没有内容")).toBeInTheDocument());

    expect(screen.getByRole("button", { name: /delete/ })).toBeInTheDocument();
  });
});

describe("Room Page — Share (link + password)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    navigator.clipboard.writeText = mockWriteText;
  });

  it("copies share link for open room (no password)", async () => {
    const user = userEvent.setup();
    await enterRoom();

    await user.click(screen.getByRole("button", { name: /分享/ }));

    expect(mockWriteText).toHaveBeenCalledWith(
      expect.stringContaining("链接:")
    );
    await waitFor(() => expect(screen.getByText("✓ 已复制")).toBeInTheDocument());
    expect(screen.getByText("已复制分享链接到剪贴板")).toBeInTheDocument();
  });

  it("copies share link + password for protected room", async () => {
    const user = userEvent.setup();
    mockFetch
      .mockResolvedValueOnce(roomOk(true))
      .mockResolvedValueOnce(verifyOk())
      .mockResolvedValueOnce(msgsOk([]));

    await act(async () => { render(<RoomPage />); });
    await user.type(screen.getByPlaceholderText("请输入房间口令..."), "mypass{Enter}");
    await waitFor(() => expect(screen.getByText("还没有内容")).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: /分享/ }));

    expect(mockWriteText).toHaveBeenCalledWith(
      expect.stringContaining("口令: mypass")
    );
    await waitFor(() => {
      expect(screen.getByText(/已复制分享链接和口令/)).toBeInTheDocument();
    });
  });

  it("copies room ID when clicking code element", async () => {
    await enterRoom();
    fireEvent.click(screen.getByTitle("点击复制"));
    expect(mockWriteText).toHaveBeenCalledWith("room123");
  });
});

describe("Room Page — Nickname", () => {
  beforeEach(() => jest.clearAllMocks());

  it("shows nickname input with placeholder", async () => {
    await enterRoom();
    expect(screen.getByText("昵称:")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("匿名用户")).toBeInTheDocument();
  });

  it("uses custom nickname when sending", async () => {
    const user = userEvent.setup();
    const msg = makeTextMsg("n1", "hi");
    mockFetch
      .mockResolvedValueOnce(roomOk(false))
      .mockResolvedValueOnce(msgsOk([]))
      .mockResolvedValueOnce(sendOk({ ...msg, sender: "小明" }));

    await act(async () => { render(<RoomPage />); });
    await waitFor(() => expect(screen.getByText("还没有内容")).toBeInTheDocument());

    await user.type(screen.getByPlaceholderText("匿名用户"), "小明");
    await user.type(screen.getByPlaceholderText("输入消息，按回车发送..."), "hi");
    await user.click(screen.getByRole("button", { name: "发送" }));

    await waitFor(() => expect(screen.getByText("小明")).toBeInTheDocument());

    const body = JSON.parse((mockFetch.mock.calls[2][1] as RequestInit).body as string);
    expect(body.sender).toBe("小明");
  });
});

describe("Room Page — Send Text Message", () => {
  beforeEach(() => jest.clearAllMocks());

  it("sends via button click and clears input", async () => {
    const user = userEvent.setup();
    const msg = makeTextMsg("t1", "Button send");
    mockFetch
      .mockResolvedValueOnce(roomOk(false))
      .mockResolvedValueOnce(msgsOk([]))
      .mockResolvedValueOnce(sendOk(msg));

    await act(async () => { render(<RoomPage />); });
    await waitFor(() => expect(screen.getByText("还没有内容")).toBeInTheDocument());

    const input = screen.getByPlaceholderText("输入消息，按回车发送...");
    await user.type(input, "Button send");
    await user.click(screen.getByRole("button", { name: "发送" }));

    await waitFor(() => expect(screen.getByText("Button send")).toBeInTheDocument());
    expect(input).toHaveValue("");
  });

  it("sends via Enter key", async () => {
    const user = userEvent.setup();
    const msg = makeTextMsg("t2", "Enter send");
    mockFetch
      .mockResolvedValueOnce(roomOk(false))
      .mockResolvedValueOnce(msgsOk([]))
      .mockResolvedValueOnce(sendOk(msg));

    await act(async () => { render(<RoomPage />); });
    await waitFor(() => expect(screen.getByText("还没有内容")).toBeInTheDocument());

    await user.type(screen.getByPlaceholderText("输入消息，按回车发送..."), "Enter send{Enter}");
    await waitFor(() => expect(screen.getByText("Enter send")).toBeInTheDocument());
  });

  it("does not send empty or whitespace-only message", async () => {
    const user = userEvent.setup();
    mockFetch
      .mockResolvedValueOnce(roomOk(false))
      .mockResolvedValueOnce(msgsOk([]));

    await act(async () => { render(<RoomPage />); });
    await waitFor(() => expect(screen.getByText("还没有内容")).toBeInTheDocument());

    // Send button should be disabled with empty input
    expect(screen.getByRole("button", { name: "发送" })).toBeDisabled();

    // Type spaces, button still disabled
    await user.type(screen.getByPlaceholderText("输入消息，按回车发送..."), "   ");
    expect(screen.getByRole("button", { name: "发送" })).toBeDisabled();

    // Only 2 fetch calls (room + messages), no send
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("appends directly without extra fetchMessages (no duplicate)", async () => {
    const user = userEvent.setup();
    const msg = makeTextMsg("t3", "NoDup");
    mockFetch
      .mockResolvedValueOnce(roomOk(false))
      .mockResolvedValueOnce(msgsOk([]))
      .mockResolvedValueOnce(sendOk(msg));

    await act(async () => { render(<RoomPage />); });
    await waitFor(() => expect(screen.getByText("还没有内容")).toBeInTheDocument());

    await user.type(screen.getByPlaceholderText("输入消息，按回车发送..."), "NoDup");
    await user.click(screen.getByRole("button", { name: "发送" }));

    await waitFor(() => expect(screen.getByText("NoDup")).toBeInTheDocument());
    // Exactly 3: room, messages, POST. No 4th fetchMessages
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });
});

describe("Room Page — Paste Text (global Ctrl+V)", () => {
  beforeEach(() => jest.clearAllMocks());

  it("pastes text via global paste event (not focused on input)", async () => {
    const msg = makeTextMsg("pt1", "Pasted text content");
    mockFetch
      .mockResolvedValueOnce(roomOk(false))
      .mockResolvedValueOnce(msgsOk([]))
      .mockResolvedValueOnce(sendOk(msg));

    await act(async () => { render(<RoomPage />); });
    await waitFor(() => expect(screen.getByText("还没有内容")).toBeInTheDocument());

    // Focus on document body, not any input
    (document.body as HTMLElement).focus();

    const pasteEvent = new Event("paste", { bubbles: true, cancelable: true }) as unknown as ClipboardEvent;
    Object.defineProperty(pasteEvent, "clipboardData", {
      value: {
        items: [],
        getData: (type: string) => type === "text" ? "Pasted text content" : "",
      },
    });
    await act(async () => { document.dispatchEvent(pasteEvent); });

    await waitFor(() => expect(screen.getByText("Pasted text content")).toBeInTheDocument());

    const body = JSON.parse((mockFetch.mock.calls[2][1] as RequestInit).body as string);
    expect(body.type).toBe("text");
    expect(body.content).toBe("Pasted text content");
  });

  it("does NOT send paste text when an INPUT is focused", async () => {
    mockFetch
      .mockResolvedValueOnce(roomOk(false))
      .mockResolvedValueOnce(msgsOk([]));

    await act(async () => { render(<RoomPage />); });
    await waitFor(() => expect(screen.getByText("还没有内容")).toBeInTheDocument());

    // Focus on the text input
    screen.getByPlaceholderText("输入消息，按回车发送...").focus();

    const pasteEvent = new Event("paste", { bubbles: true, cancelable: true }) as unknown as ClipboardEvent;
    Object.defineProperty(pasteEvent, "clipboardData", {
      value: {
        items: [],
        getData: () => "should not send",
      },
    });
    document.dispatchEvent(pasteEvent);

    // Should NOT have a 3rd fetch call (POST)
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});

describe("Room Page — Paste & Upload Image", () => {
  beforeEach(() => jest.clearAllMocks());

  it("pastes an image via clipboard", async () => {
    const imgMsg = makeImgMsg("pi1");
    mockFetch
      .mockResolvedValueOnce(roomOk(false))
      .mockResolvedValueOnce(msgsOk([]))
      .mockResolvedValueOnce(sendOk(imgMsg));

    await act(async () => { render(<RoomPage />); });
    await waitFor(() => expect(screen.getByText("还没有内容")).toBeInTheDocument());

    // Create a fake image file
    const blob = new Blob(["fake-png"], { type: "image/png" });
    const file = new File([blob], "test.png", { type: "image/png" });

    // Mock FileReader
    const originalFileReader = global.FileReader;
    const mockReadAsDataURL = jest.fn();
    const MockFileReader = jest.fn().mockImplementation(() => ({
      readAsDataURL: mockReadAsDataURL,
      onload: null as ((ev: ProgressEvent<FileReader>) => void) | null,
      result: "data:image/png;base64,AAAA",
    }));
    global.FileReader = MockFileReader as unknown as typeof FileReader;

    (document.body as HTMLElement).focus();

    const pasteEvent = new Event("paste", { bubbles: true, cancelable: true }) as unknown as ClipboardEvent;
    Object.defineProperty(pasteEvent, "clipboardData", {
      value: {
        items: [{
          type: "image/png",
          getAsFile: () => file,
        }],
        getData: () => "",
      },
    });

    await act(async () => {
      document.dispatchEvent(pasteEvent);
    });

    // Trigger the FileReader onload callback
    const reader = MockFileReader.mock.results[0].value;
    await act(async () => {
      reader.onload?.({ target: { result: "data:image/png;base64,AAAA" } } as unknown as ProgressEvent<FileReader>);
    });

    await waitFor(() => {
      const images = screen.getAllByAltText("shared");
      expect(images.length).toBeGreaterThanOrEqual(1);
    });

    global.FileReader = originalFileReader;
  });

  it("uploads image via file input (click paste zone)", async () => {
    const imgMsg = makeImgMsg("fi1");
    mockFetch
      .mockResolvedValueOnce(roomOk(false))
      .mockResolvedValueOnce(msgsOk([]))
      .mockResolvedValueOnce(sendOk(imgMsg));

    await act(async () => { render(<RoomPage />); });
    await waitFor(() => expect(screen.getByText("还没有内容")).toBeInTheDocument());

    const originalFileReader = global.FileReader;
    const mockOnload = jest.fn();
    const MockFileReader = jest.fn().mockImplementation(() => ({
      readAsDataURL: function(this: { onload: ((e: unknown) => void) | null }) {
        // Immediately trigger onload
        this.onload?.({ target: { result: "data:image/png;base64,BBBB" } });
      },
      onload: null as ((e: unknown) => void) | null,
    }));
    global.FileReader = MockFileReader as unknown as typeof FileReader;

    const file = new File(["img-data"], "photo.png", { type: "image/png" });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    await waitFor(() => {
      const images = screen.getAllByAltText("shared");
      expect(images.length).toBeGreaterThanOrEqual(1);
    });

    global.FileReader = originalFileReader;
  });

  it("handles drag-and-drop image", async () => {
    const imgMsg = makeImgMsg("dd1");
    mockFetch
      .mockResolvedValueOnce(roomOk(false))
      .mockResolvedValueOnce(msgsOk([]))
      .mockResolvedValueOnce(sendOk(imgMsg));

    await act(async () => { render(<RoomPage />); });
    await waitFor(() => expect(screen.getByText("还没有内容")).toBeInTheDocument());

    const originalFileReader = global.FileReader;
    const MockFileReader = jest.fn().mockImplementation(() => ({
      readAsDataURL: function(this: { onload: ((e: unknown) => void) | null }) {
        this.onload?.({ target: { result: "data:image/png;base64,CCCC" } });
      },
      onload: null as ((e: unknown) => void) | null,
    }));
    global.FileReader = MockFileReader as unknown as typeof FileReader;

    const pasteZone = screen.getByText(/Ctrl\+V/).closest("div")!;
    const file = new File(["img"], "drop.png", { type: "image/png" });

    // Fire dragover to show drag state
    fireEvent.dragOver(pasteZone, { dataTransfer: { files: [] } });

    // Fire drop
    await act(async () => {
      fireEvent.drop(pasteZone, {
        dataTransfer: { files: [file] },
      });
    });

    await waitFor(() => {
      const images = screen.getAllByAltText("shared");
      expect(images.length).toBeGreaterThanOrEqual(1);
    });

    global.FileReader = originalFileReader;
  });

  it("calls sendImage with correct data on paste image, and handles API error", async () => {
    // Use mockResolvedValue for all messages polling, then precisely control sendImage call
    mockFetch
      .mockResolvedValueOnce(roomOk(false))  // 1: GET room
      .mockResolvedValueOnce(msgsOk([]));    // 2: GET messages

    await act(async () => { render(<RoomPage />); });
    await waitFor(() => expect(screen.getByText("还没有内容")).toBeInTheDocument());

    const originalFileReader = global.FileReader;
    let readerInstance: { onload: ((e: unknown) => void) | null; readAsDataURL: jest.Mock } | null = null;
    global.FileReader = jest.fn().mockImplementation(() => {
      readerInstance = { onload: null, readAsDataURL: jest.fn() };
      return readerInstance;
    }) as unknown as typeof FileReader;

    (document.body as HTMLElement).focus();
    const file = new File(["img"], "fail.png", { type: "image/png" });
    const pasteEvent = new Event("paste", { bubbles: true, cancelable: true }) as unknown as ClipboardEvent;
    Object.defineProperty(pasteEvent, "clipboardData", {
      value: {
        items: [{ type: "image/png", getAsFile: () => file }],
        getData: () => "",
      },
    });

    await act(async () => { document.dispatchEvent(pasteEvent); });

    expect(readerInstance).not.toBeNull();
    expect(readerInstance!.readAsDataURL).toHaveBeenCalled();

    // Set up the next fetch to be the sendImage failure
    mockFetch.mockResolvedValueOnce(sendFail("图片太大了"));

    const fetchCountBefore = mockFetch.mock.calls.length;
    await act(async () => {
      readerInstance!.onload!({ target: { result: "data:image/png;base64,BIG" } });
    });

    // Verify the fetch was called with image type
    await waitFor(() => {
      expect(mockFetch.mock.calls.length).toBeGreaterThan(fetchCountBefore);
    });

    const imgCall = mockFetch.mock.calls.find((call) => {
      try {
        const opts = call[1] as RequestInit;
        if (opts?.method !== "POST") return false;
        const b = JSON.parse(opts.body as string);
        return b.type === "image";
      } catch { return false; }
    });
    expect(imgCall).toBeDefined();
    const body = JSON.parse((imgCall![1] as RequestInit).body as string);
    expect(body.type).toBe("image");
    expect(body.content).toBe("data:image/png;base64,BIG");

    global.FileReader = originalFileReader;
  });
});

describe("Room Page — Message Display & Copy Content", () => {
  beforeEach(() => jest.clearAllMocks());

  it("displays text messages with sender and time", async () => {
    const msg = makeTextMsg("d1", "Hello world", "Alice");
    await enterRoom({ messages: [msg] });

    expect(screen.getByText("Hello world")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
  });

  it("displays image messages", async () => {
    const msg = makeImgMsg("d2", "Bob");
    mockFetch
      .mockResolvedValueOnce(roomOk(false))
      .mockResolvedValueOnce(msgsOk([msg]));

    await act(async () => { render(<RoomPage />); });
    await waitFor(() => {
      expect(screen.getByAltText("shared")).toBeInTheDocument();
      expect(screen.getByText("Bob")).toBeInTheDocument();
    });
  });

  it("copies text content via copy button", async () => {
    const msg = makeTextMsg("c1", "Copy me");
    await enterRoom({ messages: [msg] });

    // Re-assign after enterRoom's beforeEach clears mocks
    navigator.clipboard.writeText = mockWriteText;

    const copyBtn = screen.getByTitle("复制");
    fireEvent.click(copyBtn);

    expect(mockWriteText).toHaveBeenCalledWith("Copy me");
  });

  it("deduplicates messages by ID", async () => {
    const msg = makeTextMsg("dup1", "Unique");
    mockFetch
      .mockResolvedValueOnce(roomOk(false))
      .mockResolvedValueOnce(msgsOk([msg]))
      .mockResolvedValue(msgsOk([msg]));

    await act(async () => { render(<RoomPage />); });
    await waitFor(() => expect(screen.getByText("Unique")).toBeInTheDocument());
    expect(screen.getAllByText("Unique")).toHaveLength(1);
  });
});

describe("Room Page — Image Preview Modal", () => {
  beforeEach(() => jest.clearAllMocks());

  it("opens preview when clicking image, closes when clicking overlay", async () => {
    const user = userEvent.setup();
    const msg = makeImgMsg("pv1");
    mockFetch
      .mockResolvedValueOnce(roomOk(false))
      .mockResolvedValueOnce(msgsOk([msg]));

    await act(async () => { render(<RoomPage />); });
    await waitFor(() => expect(screen.getByAltText("shared")).toBeInTheDocument());

    // Click the image to open preview
    await user.click(screen.getByAltText("shared"));
    expect(screen.getByAltText("preview")).toBeInTheDocument();

    // Click the close button (the one in the preview overlay, has specific class)
    const closeBtns = screen.getAllByText("✕");
    const previewClose = closeBtns.find(el => el.className.includes("absolute top-6"));
    await user.click(previewClose!);
    expect(screen.queryByAltText("preview")).not.toBeInTheDocument();
  });
});

describe("Room Page — Delete Room", () => {
  beforeEach(() => jest.clearAllMocks());

  async function enterProtectedRoom() {
    const user = userEvent.setup();
    mockFetch
      .mockResolvedValueOnce(roomOk(true))
      .mockResolvedValueOnce(verifyOk())
      .mockResolvedValueOnce(msgsOk([]));

    await act(async () => { render(<RoomPage />); });
    await user.type(screen.getByPlaceholderText("请输入房间口令..."), "s{Enter}");
    await waitFor(() => expect(screen.getByText("还没有内容")).toBeInTheDocument());
    return user;
  }

  it("opens and closes delete confirmation", async () => {
    const user = await enterProtectedRoom();

    // Click delete button
    await user.click(screen.getByRole("button", { name: /delete/ }));
    expect(screen.getByText("删除房间将清除所有内容，不可撤销")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("输入房间口令确认删除...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "确认删除" })).toBeInTheDocument();

    // Click again to close
    await user.click(screen.getByRole("button", { name: /delete/ }));
    expect(screen.queryByText("删除房间将清除所有内容，不可撤销")).not.toBeInTheDocument();
  });

  it("deletes room with correct password", async () => {
    const user = await enterProtectedRoom();
    mockFetch.mockResolvedValueOnce(deleteOk());

    await user.click(screen.getByRole("button", { name: /delete/ }));
    await user.type(screen.getByPlaceholderText("输入房间口令确认删除..."), "secret");
    await user.click(screen.getByRole("button", { name: "确认删除" }));

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/clipboard"));
  });

  it("shows error for wrong delete password", async () => {
    const user = await enterProtectedRoom();
    mockFetch.mockResolvedValueOnce(deleteFail("密码错误"));

    await user.click(screen.getByRole("button", { name: /delete/ }));
    await user.type(screen.getByPlaceholderText("输入房间口令确认删除..."), "wrong");
    await user.click(screen.getByRole("button", { name: "确认删除" }));

    await waitFor(() => expect(screen.getByText("密码错误")).toBeInTheDocument());
  });

  it("shows network error on delete failure", async () => {
    const user = await enterProtectedRoom();
    mockFetch.mockRejectedValueOnce(new Error("net"));

    await user.click(screen.getByRole("button", { name: /delete/ }));
    await user.click(screen.getByRole("button", { name: "确认删除" }));

    await waitFor(() => expect(screen.getByText("网络错误")).toBeInTheDocument());
  });
});

describe("Room Page — Polling & Dedup", () => {
  beforeEach(() => jest.clearAllMocks());

  it("receives new messages from other users via polling", async () => {
    jest.useFakeTimers();

    const msg1 = makeTextMsg("poll1", "First");
    const msg2 = makeTextMsg("poll2", "From others");

    mockFetch
      .mockResolvedValueOnce(roomOk(false))
      .mockResolvedValueOnce(msgsOk([msg1]))
      .mockResolvedValueOnce(msgsOk([msg2]));

    await act(async () => { render(<RoomPage />); });
    await waitFor(() => expect(screen.getByText("First")).toBeInTheDocument());

    await act(async () => { jest.advanceTimersByTime(3000); });

    await waitFor(() => expect(screen.getByText("From others")).toBeInTheDocument());

    jest.useRealTimers();
  });
});

describe("Room Page — URL Detection in Text", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders URLs as clickable links", async () => {
    const msg = makeTextMsg("url1", "Visit https://example.com for more");
    await enterRoom({ messages: [msg] });

    const link = screen.getByText("https://example.com");
    expect(link.tagName).toBe("A");
    expect(link).toHaveAttribute("href", "https://example.com");
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("renders plain text without links normally", async () => {
    const msg = makeTextMsg("url2", "No links here");
    await enterRoom({ messages: [msg] });
    expect(screen.getByText("No links here")).toBeInTheDocument();
  });

  it("handles multiple URLs in one message", async () => {
    const msg = makeTextMsg("url3", "See https://a.com and https://b.com");
    await enterRoom({ messages: [msg] });

    expect(screen.getByText("https://a.com")).toHaveAttribute("href", "https://a.com");
    expect(screen.getByText("https://b.com")).toHaveAttribute("href", "https://b.com");
  });
});

describe("Room Page — Delete Single Message", () => {
  beforeEach(() => jest.clearAllMocks());

  it("deletes a single message from the list", async () => {
    const msg = makeTextMsg("del1", "Delete me");
    mockFetch
      .mockResolvedValueOnce(roomOk(false))
      .mockResolvedValueOnce(msgsOk([msg]))
      .mockResolvedValue(msgsOk([]));

    await act(async () => { render(<RoomPage />); });
    await waitFor(() => expect(screen.getByText("Delete me")).toBeInTheDocument());

    // Mock the delete API call
    mockFetch.mockResolvedValueOnce({ json: async () => ({ success: true }) });

    const deleteBtn = screen.getByTitle("删除此条");
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(screen.queryByText("Delete me")).not.toBeInTheDocument();
    });
  });
});

describe("Room Page — Clear All Messages", () => {
  beforeEach(() => jest.clearAllMocks());

  it("clears all messages after confirmation", async () => {
    const msgs = [
      makeTextMsg("clr1", "Msg One"),
      makeTextMsg("clr2", "Msg Two"),
    ];
    mockFetch
      .mockResolvedValueOnce(roomOk(false))
      .mockResolvedValueOnce(msgsOk(msgs))
      .mockResolvedValue(msgsOk([]));

    await act(async () => { render(<RoomPage />); });
    await waitFor(() => expect(screen.getByText("Msg One")).toBeInTheDocument());

    // Mock confirm dialog
    window.confirm = jest.fn().mockReturnValue(true);
    mockFetch.mockResolvedValueOnce({ json: async () => ({ success: true }) });

    const clearBtn = screen.getByTitle("清空所有消息");
    fireEvent.click(clearBtn);

    await waitFor(() => {
      expect(screen.queryByText("Msg One")).not.toBeInTheDocument();
      expect(screen.queryByText("Msg Two")).not.toBeInTheDocument();
      expect(screen.getByText("还没有内容")).toBeInTheDocument();
    });
  });

  it("does not clear when confirm is cancelled", async () => {
    const msg = makeTextMsg("clr3", "Keep me");
    await enterRoom({ messages: [msg] });

    window.confirm = jest.fn().mockReturnValue(false);

    const clearBtn = screen.getByTitle("清空所有消息");
    fireEvent.click(clearBtn);

    expect(screen.getByText("Keep me")).toBeInTheDocument();
  });
});
