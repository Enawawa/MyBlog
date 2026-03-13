import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Double's Blog",
  description: "人生是旷野，不是轨道",
};
type NavItem = {
  href: string;
  label: string;
  className?: string;
  isExternal?: boolean;
};

function NavMenuGroup({
  title,
  items,
  buttonClassName,
}: {
  title: string;
  items: NavItem[];
  buttonClassName: string;
}) {
  return (
    <div className="relative group shrink-0">
      <button
        type="button"
        className={`${buttonClassName} px-3 py-2 rounded-lg transition-all`}
      >
        {title} ▾
      </button>
      <div className="absolute right-0 top-full mt-2 w-44 rounded-xl glass p-2 opacity-0 invisible pointer-events-none translate-y-1 group-hover:opacity-100 group-hover:visible group-hover:pointer-events-auto group-hover:translate-y-0 transition-all duration-200">
        {items.map((item) =>
          item.isExternal ? (
            <a
              key={item.href}
              href={item.href}
              className={`block px-3 py-2 rounded-lg text-sm transition-all ${item.className ?? "text-slate-300 hover:text-white hover:bg-white/10"}`}
            >
              {item.label}
            </a>
          ) : (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-3 py-2 rounded-lg text-sm transition-all ${item.className ?? "text-slate-300 hover:text-white hover:bg-white/10"}`}
            >
              {item.label}
            </Link>
          ),
        )}
      </div>
    </div>
  );
}

function Navbar() {
  return (
    <header className="fixed top-0 w-full z-50 glass border-t-0 border-x-0">
      <div className="max-w-6xl mx-auto h-16 flex items-center justify-between px-6">
        <Link href="/" className="text-xl font-bold hover:opacity-80 transition-opacity">
          Double&apos;s Blog
        </Link>
        <nav className="flex items-center gap-1 text-sm overflow-x-auto min-w-0 whitespace-nowrap max-md:px-1">
          <Link
            href="/"
            className="px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-all"
          >
            首页
          </Link>
          <NavMenuGroup
            title="日记"
            buttonClassName="text-slate-300 hover:text-white hover:bg-white/10"
            items={[
              { href: "/daily", label: "日常小记" },
              { href: "/thoughts", label: "碎片感受" },
            ]}
          />
          <NavMenuGroup
            title="工具"
            buttonClassName="text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10"
            items={[
              {
                href: "/clipboard",
                label: "📋 共享剪贴板",
                className: "text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10",
              },
              {
                href: "/nonsense-poetry",
                label: "📜 废话文学",
                className: "text-rose-400 hover:text-rose-300 hover:bg-rose-500/10",
              },
              {
                href: "/treehole",
                label: "🌳 倾听树洞",
                className: "text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10",
              },
            ]}
          />
          <NavMenuGroup
            title="游戏"
            buttonClassName="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
            items={[
              {
                href: "/game",
                label: "🎮 飞跃小鸟",
                className: "text-amber-400 hover:text-amber-300 hover:bg-amber-500/10",
              },
              {
                href: "/#games",
                label: "🕹️ 3D 游戏",
                className: "text-purple-400 hover:text-purple-300 hover:bg-purple-500/10",
              },
            ]}
          />
        </nav>
      </div>
    </header>
  );
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen antialiased">
        <Navbar />
        <div className="pt-16">{children}</div>
      </body>
    </html>
  );
}
