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

  it("renders title and feature cards", () => {
    render(<ClipboardHome />);
    expect(screen.getByText("共享剪贴板")).toBeInTheDocument();
    expect(screen.getByText("粘贴即分享")).toBeInTheDocument();
    expect(screen.getByText("口令保护")).toBeInTheDocument();
    expect(screen.getByText("实时同步")).toBeInTheDocument();
  });

  it("switches to create mode and shows form", async () => {
    const user = userEvent.setup();
    render(<ClipboardHome />);

    // Button accessible name is "sparkle 创建房间" due to aria-label on the span
    await user.click(screen.getByRole("button", { name: /创建房间/ }));

    expect(screen.getByText("创建新房间")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("给房间起个名字...")).toBeInTheDocument();
  });

  it("switches to join mode and shows form", async () => {
    const user = userEvent.setup();
    render(<ClipboardHome />);

    await user.click(screen.getByRole("button", { name: /加入房间/ }));

    expect(screen.getByPlaceholderText("输入房间号...")).toBeInTheDocument();
  });

  it("can go back from create mode to home", async () => {
    const user = userEvent.setup();
    render(<ClipboardHome />);

    await user.click(screen.getByRole("button", { name: /创建房间/ }));
    expect(screen.getByText("创建新房间")).toBeInTheDocument();

    await user.click(screen.getByText("← 返回"));
    expect(screen.getByText("共享剪贴板")).toBeInTheDocument();
  });

  it("creates a room and navigates to it", async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValueOnce({
      json: async () => ({
        success: true,
        room: { id: "newroom1", name: "我的房间", hasPassword: false },
      }),
    });

    render(<ClipboardHome />);

    await user.click(screen.getByRole("button", { name: /创建房间/ }));
    await user.type(screen.getByPlaceholderText("给房间起个名字..."), "我的房间");

    // In create mode, the submit button has text "🚀 创建房间"
    const submitBtns = screen.getAllByRole("button", { name: /创建房间/ });
    await user.click(submitBtns[submitBtns.length - 1]);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/clipboard/room/newroom1");
    });
  });

  it("shows error for non-existent room", async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValueOnce({
      json: async () => ({ success: false, error: "房间不存在" }),
    });

    render(<ClipboardHome />);
    await user.click(screen.getByRole("button", { name: /加入房间/ }));
    await user.type(screen.getByPlaceholderText("输入房间号..."), "nonexist");

    const submitBtns = screen.getAllByRole("button", { name: /加入房间/ });
    await user.click(submitBtns[submitBtns.length - 1]);

    await waitFor(() => {
      expect(screen.getByText("房间不存在")).toBeInTheDocument();
    });
  });

  it("shows error when join ID is empty", async () => {
    const user = userEvent.setup();
    render(<ClipboardHome />);

    await user.click(screen.getByRole("button", { name: /加入房间/ }));

    const submitBtns = screen.getAllByRole("button", { name: /加入房间/ });
    await user.click(submitBtns[submitBtns.length - 1]);

    expect(screen.getByText("请输入房间号")).toBeInTheDocument();
  });
});
