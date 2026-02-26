import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useParams: () => ({ id: "test123" }),
}));

const mockFetch = jest.fn();
global.fetch = mockFetch;

import ClipboardHome from "@/app/clipboard/page";

describe("Clipboard Home Page", () => {
  beforeEach(() => jest.clearAllMocks());

  // ========== HOME SCREEN ==========

  it("renders title, description, feature cards, and action buttons", () => {
    render(<ClipboardHome />);
    expect(screen.getByText("共享剪贴板")).toBeInTheDocument();
    expect(screen.getByText(/无需登录/)).toBeInTheDocument();
    expect(screen.getByText(/粘贴即分享，简单高效/)).toBeInTheDocument();
    expect(screen.getByText("粘贴即分享")).toBeInTheDocument();
    expect(screen.getByText("口令保护")).toBeInTheDocument();
    expect(screen.getByText("实时同步")).toBeInTheDocument();
    expect(screen.getByText("支持文字和图片")).toBeInTheDocument();
    expect(screen.getByText("可设置房间密码")).toBeInTheDocument();
    expect(screen.getByText("内容即时更新")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /创建房间/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /加入房间/ })).toBeInTheDocument();
  });

  // ========== CREATE ROOM FLOW ==========

  it("switches to create mode and shows all form elements", async () => {
    const user = userEvent.setup();
    render(<ClipboardHome />);
    await user.click(screen.getByRole("button", { name: /创建房间/ }));

    expect(screen.getByText("创建新房间")).toBeInTheDocument();
    expect(screen.getByText("房间名称（可选）")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("给房间起个名字...")).toBeInTheDocument();
    expect(screen.getByText("房间口令（可选，用于管理房间）")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("设置口令后可删除房间...")).toBeInTheDocument();
    expect(screen.getByText("← 返回")).toBeInTheDocument();
  });

  it("creates a room with name and password and navigates", async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValueOnce({
      json: async () => ({
        success: true,
        room: { id: "rm01", name: "Test Room", hasPassword: true },
      }),
    });

    render(<ClipboardHome />);
    await user.click(screen.getByRole("button", { name: /创建房间/ }));
    await user.type(screen.getByPlaceholderText("给房间起个名字..."), "Test Room");
    await user.type(screen.getByPlaceholderText("设置口令后可删除房间..."), "mypass");

    const btns = screen.getAllByRole("button", { name: /创建房间/ });
    await user.click(btns[btns.length - 1]);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/clipboard/room/rm01");
    });

    // Verify the fetch was called with correct body
    expect(mockFetch).toHaveBeenCalledWith("/api/rooms", expect.objectContaining({
      method: "POST",
    }));
    const body = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string);
    expect(body.name).toBe("Test Room");
    expect(body.password).toBe("mypass");
  });

  it("creates a room without name or password", async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValueOnce({
      json: async () => ({
        success: true,
        room: { id: "rm02", name: "房间 rm02", hasPassword: false },
      }),
    });

    render(<ClipboardHome />);
    await user.click(screen.getByRole("button", { name: /创建房间/ }));
    const btns = screen.getAllByRole("button", { name: /创建房间/ });
    await user.click(btns[btns.length - 1]);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/clipboard/room/rm02");
    });
  });

  it("shows API error when room creation fails", async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValueOnce({
      json: async () => ({ success: false, error: "服务器忙" }),
    });

    render(<ClipboardHome />);
    await user.click(screen.getByRole("button", { name: /创建房间/ }));
    const btns = screen.getAllByRole("button", { name: /创建房间/ });
    await user.click(btns[btns.length - 1]);

    await waitFor(() => expect(screen.getByText("服务器忙")).toBeInTheDocument());
  });

  it("shows network error when create fetch throws", async () => {
    const user = userEvent.setup();
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    render(<ClipboardHome />);
    await user.click(screen.getByRole("button", { name: /创建房间/ }));
    const btns = screen.getAllByRole("button", { name: /创建房间/ });
    await user.click(btns[btns.length - 1]);

    await waitFor(() => expect(screen.getByText("网络错误，请重试")).toBeInTheDocument());
  });

  it("goes back from create mode to home, clearing error", async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValueOnce({
      json: async () => ({ success: false, error: "出错了" }),
    });

    render(<ClipboardHome />);
    await user.click(screen.getByRole("button", { name: /创建房间/ }));
    const btns = screen.getAllByRole("button", { name: /创建房间/ });
    await user.click(btns[btns.length - 1]);
    await waitFor(() => expect(screen.getByText("出错了")).toBeInTheDocument());

    await user.click(screen.getByText("← 返回"));
    expect(screen.getByText("共享剪贴板")).toBeInTheDocument();
    expect(screen.queryByText("出错了")).not.toBeInTheDocument();
  });

  // ========== JOIN ROOM FLOW ==========

  it("switches to join mode and shows form", async () => {
    const user = userEvent.setup();
    render(<ClipboardHome />);
    await user.click(screen.getByRole("button", { name: /加入房间/ }));

    expect(screen.getByRole("heading", { name: "加入房间" })).toBeInTheDocument();
    expect(screen.getByText("房间号")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("输入房间号...")).toBeInTheDocument();
    expect(screen.getByText("← 返回")).toBeInTheDocument();
  });

  it("joins an existing room by ID", async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValueOnce({
      json: async () => ({
        success: true,
        room: { id: "abc123", name: "Room", hasPassword: false },
      }),
    });

    render(<ClipboardHome />);
    await user.click(screen.getByRole("button", { name: /加入房间/ }));
    await user.type(screen.getByPlaceholderText("输入房间号..."), "abc123");
    const btns = screen.getAllByRole("button", { name: /加入房间/ });
    await user.click(btns[btns.length - 1]);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/clipboard/room/abc123");
    });
  });

  it("joins room by pressing Enter in input", async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValueOnce({
      json: async () => ({
        success: true,
        room: { id: "enter1", name: "R", hasPassword: false },
      }),
    });

    render(<ClipboardHome />);
    await user.click(screen.getByRole("button", { name: /加入房间/ }));
    const input = screen.getByPlaceholderText("输入房间号...");
    await user.type(input, "enter1{Enter}");

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/clipboard/room/enter1");
    });
  });

  it("shows error when join ID is empty", async () => {
    const user = userEvent.setup();
    render(<ClipboardHome />);
    await user.click(screen.getByRole("button", { name: /加入房间/ }));
    const btns = screen.getAllByRole("button", { name: /加入房间/ });
    await user.click(btns[btns.length - 1]);

    expect(screen.getByText("请输入房间号")).toBeInTheDocument();
  });

  it("shows error for non-existent room", async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValueOnce({
      status: 404,
      json: async () => ({ success: false, error: "房间不存在" }),
    });

    render(<ClipboardHome />);
    await user.click(screen.getByRole("button", { name: /加入房间/ }));
    await user.type(screen.getByPlaceholderText("输入房间号..."), "nope");
    const btns = screen.getAllByRole("button", { name: /加入房间/ });
    await user.click(btns[btns.length - 1]);

    await waitFor(() => expect(screen.getByText("房间不存在，请检查房间号是否正确")).toBeInTheDocument());
  });

  it("shows network error when join fetch throws", async () => {
    const user = userEvent.setup();
    mockFetch.mockRejectedValueOnce(new Error("fail"));

    render(<ClipboardHome />);
    await user.click(screen.getByRole("button", { name: /加入房间/ }));
    await user.type(screen.getByPlaceholderText("输入房间号..."), "x");
    const btns = screen.getAllByRole("button", { name: /加入房间/ });
    await user.click(btns[btns.length - 1]);

    await waitFor(() => expect(screen.getByText("网络错误，请重试")).toBeInTheDocument());
  });

  it("goes back from join mode to home", async () => {
    const user = userEvent.setup();
    render(<ClipboardHome />);
    await user.click(screen.getByRole("button", { name: /加入房间/ }));
    expect(screen.getByRole("heading", { name: "加入房间" })).toBeInTheDocument();

    await user.click(screen.getByText("← 返回"));
    expect(screen.getByText("共享剪贴板")).toBeInTheDocument();
  });

  it("trims whitespace from room ID before joining", async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValueOnce({
      json: async () => ({ success: true, room: { id: "trimtest" } }),
    });

    render(<ClipboardHome />);
    await user.click(screen.getByRole("button", { name: /加入房间/ }));
    await user.type(screen.getByPlaceholderText("输入房间号..."), "  trimtest  ");
    const btns = screen.getAllByRole("button", { name: /加入房间/ });
    await user.click(btns[btns.length - 1]);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/clipboard/room/trimtest");
    });
  });
});
