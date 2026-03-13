"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type NavLink = {
  href: string;
  label: string;
  className: string;
  isExternal?: boolean;
};

const NAV_LINKS: NavLink[] = [
  {
    href: "/",
    label: "首页",
    className:
      "text-slate-300 hover:text-white hover:bg-white/10",
  },
  {
    href: "/daily",
    label: "日常小记",
    className:
      "text-slate-300 hover:text-white hover:bg-white/10",
  },
  {
    href: "/thoughts",
    label: "碎片感受",
    className:
      "text-slate-300 hover:text-white hover:bg-white/10",
  },
  {
    href: "/clipboard",
    label: "📋 共享剪贴板",
    className:
      "text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10",
  },
  {
    href: "/game",
    label: "🎮 飞跃小鸟",
    className:
      "text-amber-400 hover:text-amber-300 hover:bg-amber-500/10",
  },
  {
    href: "/#games",
    label: "🕹️ 3D游戏",
    className:
      "text-purple-400 hover:text-purple-300 hover:bg-purple-500/10",
  },
  {
    href: "/nonsense-poetry",
    label: "📜 废话文学",
    className:
      "text-rose-400 hover:text-rose-300 hover:bg-rose-500/10",
  },
  {
    href: "/trending.html",
    label: "✦ 设计灵感",
    className:
      "text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10",
    isExternal: true,
  },
];

function NavLinkItem({ link, onClick }: { link: NavLink; onClick?: () => void }) {
  const className = `px-3 py-2 rounded-lg transition-all ${link.className}`;
  if (link.isExternal) {
    return (
      <a href={link.href} className={className} onClick={onClick}>
        {link.label}
      </a>
    );
  }
  return (
    <Link href={link.href} className={className} onClick={onClick}>
      {link.label}
    </Link>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen]);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  return (
    <>
      <header className="fixed top-0 w-full z-50 glass border-t-0 border-x-0">
        <div className="max-w-6xl mx-auto h-16 flex items-center justify-between px-6">
          <Link href="/" className="text-xl font-bold hover:opacity-80 transition-opacity">
            Double&apos;s Blog
          </Link>

          <nav className="hidden md:flex items-center gap-1 text-sm">
            {NAV_LINKS.map((link) => (
              <NavLinkItem key={link.href} link={link} />
            ))}
          </nav>

          <button
            type="button"
            className="md:hidden px-3 py-2 rounded-lg border border-white/10 text-slate-200 hover:bg-white/10 transition-colors"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-controls="mobile-nav-panel"
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? "关闭导航菜单" : "打开导航菜单"}
          >
            {mobileOpen ? "✕" : "☰"}
          </button>
        </div>
      </header>

      {mobileOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/60 md:hidden cursor-default"
            onClick={() => setMobileOpen(false)}
            aria-label="关闭导航遮罩"
            data-testid="mobile-menu-overlay"
          />
          <div
            id="mobile-nav-panel"
            className="fixed top-16 inset-x-0 z-50 md:hidden border-b border-white/10 bg-slate-950/95 backdrop-blur-xl"
          >
            <nav className="max-w-6xl mx-auto px-6 py-4 flex flex-col gap-2 text-sm">
              {NAV_LINKS.map((link) => (
                <NavLinkItem
                  key={link.href}
                  link={link}
                  onClick={() => setMobileOpen(false)}
                />
              ))}
            </nav>
          </div>
        </>
      )}
    </>
  );
}
