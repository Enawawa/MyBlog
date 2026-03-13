import type { Metadata } from "next";
import "./globals.css";
import Navbar from "./components/Navbar";

export const metadata: Metadata = {
  title: "Double's Blog",
  description: "人生是旷野，不是轨道",
};


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
