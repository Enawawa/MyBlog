import Link from "next/link";

export default function TagList({
  tags,
  activeTag,
}: {
  tags: string[];
  activeTag?: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <Link
          key={tag}
          href={`/nonsense-poetry/tag/${encodeURIComponent(tag)}`}
          className={`text-sm px-4 py-1.5 rounded-full border transition-all duration-200 hover:scale-105 ${
            activeTag === tag
              ? "bg-white text-slate-900 border-white"
              : "border-white/10 text-slate-400 hover:border-white/30 hover:text-white"
          }`}
        >
          #{tag}
        </Link>
      ))}
    </div>
  );
}
