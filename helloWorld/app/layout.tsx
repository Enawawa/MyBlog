import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ClipBoard Room - 剪贴板共享房间",
  description: "无需登录，通过房间号即可与他人共享文字和图片内容",
  keywords: ["clipboard", "share", "room", "paste", "剪贴板", "共享"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
