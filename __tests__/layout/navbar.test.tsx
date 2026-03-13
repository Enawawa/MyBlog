import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Navbar from "@/app/components/Navbar";

jest.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

describe("Navbar mobile dropdown", () => {
  it("opens dropdown menu and locks body scroll", async () => {
    const user = userEvent.setup();
    render(<Navbar />);

    const openButton = screen.getByRole("button", { name: "打开导航菜单" });
    await user.click(openButton);

    expect(screen.getByRole("button", { name: "关闭导航菜单" })).toBeInTheDocument();
    expect(screen.getByTestId("mobile-menu-overlay")).toBeInTheDocument();
    expect(document.body.style.overflow).toBe("hidden");

    await user.click(screen.getByTestId("mobile-menu-overlay"));
    expect(document.body.style.overflow).toBe("");
  });
});
