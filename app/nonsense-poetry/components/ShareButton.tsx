"use client";

export default function ShareButton({ lines }: { lines: string[] }) {
  return (
    <button
      className="btn-ghost text-sm mt-2"
      onClick={() => {
        const text = lines.join("\n") + "\n\n—— 废话文学生成器 no1sora.com/nonsense-poetry";
        navigator.clipboard?.writeText(text);
      }}
    >
      📋 复制分享
    </button>
  );
}
