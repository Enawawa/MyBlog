import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SearchQA from "@/app/components/SearchQA";

describe("SearchQA", () => {
  const mockFetch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = mockFetch;
  });

  it("submits question and renders returned answer", async () => {
    const user = userEvent.setup();
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: "test.jwt.token" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          question: "共享剪贴板怎么用？",
          answer: "共享剪贴板支持创建房间并实时同步。",
        }),
      });

    render(<SearchQA />);

    await user.type(screen.getByLabelText("输入问题"), "共享剪贴板怎么用？");
    await user.click(screen.getByRole("button", { name: "提问" }));

    await waitFor(() => {
      expect(screen.getByText("答案：共享剪贴板支持创建房间并实时同步。")).toBeInTheDocument();
    });

    expect(mockFetch).toHaveBeenNthCalledWith(
      1,
      "/api/auth/token",
      expect.objectContaining({
        method: "POST",
        headers: { "x-client-id": "myblog-web" },
      })
    );

    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      "/api/search",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer test.jwt.token",
        }),
      })
    );
  });
});
