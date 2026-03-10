import Link from "next/link";
import type { Poem } from "@/lib/poem-generator";

export default function PoemCard({ poem, showDate = true }: { poem: Poem; showDate?: boolean }) {
  return (
    <Link href={`/nonsense-poetry/post/${poem.id}`} className="block group">
      <article className="glass rounded-2xl p-6 md:p-8 glass-hover h-full flex flex-col">
        <div className="flex-1 mb-4">
          <div className="space-y-1 text-lg md:text-xl leading-relaxed tracking-wide font-light">
            {poem.lines.map((line, i) => (
              <p key={i} className="text-slate-200 group-hover:text-white transition-colors">
                {line}
              </p>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <div className="flex flex-wrap gap-1.5">
            {poem.keywords.slice(0, 3).map((kw) => (
              <span
                key={kw}
                className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-slate-400"
              >
                #{kw}
              </span>
            ))}
          </div>
          {showDate && (
            <time className="text-xs text-slate-600">{poem.createdAt}</time>
          )}
        </div>
      </article>
    </Link>
  );
}
