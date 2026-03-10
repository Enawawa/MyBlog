import type { Metadata } from "next";
import Link from "next/link";
import { generatePoem, generateDailyPoems, getTodayStr } from "@/lib/poem-generator";
import PoemCard from "../../components/PoemCard";
import ShareButton from "../../components/ShareButton";

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const poem = generatePoem(params.id);
  const preview = poem.lines.slice(0, 2).join("，");
  return {
    title: `${preview} — 废话文学`,
    description: `${poem.lines.join("。")} — 打工人废话文学生成器`,
    keywords: [...poem.keywords, "废话文学", "打工人文学"],
    openGraph: {
      title: `${preview} — 废话文学`,
      description: poem.lines.join("。"),
    },
  };
}

export default function PoemDetailPage({ params }: Props) {
  const poem = generatePoem(params.id);

  const today = getTodayStr();
  const allToday = generateDailyPoems(today, 20);
  const related = allToday
    .filter((p) => p.id !== poem.id)
    .filter((p) => p.keywords.some((kw) => poem.keywords.includes(kw)))
    .slice(0, 4);
  const recommendations = related.length >= 2 ? related : allToday.filter((p) => p.id !== poem.id).slice(0, 4);

  return (
    <main className="max-w-3xl mx-auto px-6 py-12">
      {/* Poem Content */}
      <article className="mb-16">
        <div className="glass rounded-2xl p-8 md:p-16 text-center">
          <div className="space-y-3 text-2xl md:text-3xl leading-relaxed tracking-wide font-light">
            {poem.lines.map((line, i) => (
              <p key={i} className="text-slate-100">{line}</p>
            ))}
          </div>
        </div>

        {/* Meta */}
        <div className="mt-8 flex flex-col items-center gap-4">
          <div className="flex flex-wrap justify-center gap-2">
            {poem.keywords.map((kw) => (
              <Link
                key={kw}
                href={`/nonsense-poetry/tag/${encodeURIComponent(kw)}`}
                className="text-sm px-4 py-1.5 rounded-full border border-white/10 text-slate-400
                         hover:border-white/30 hover:text-white transition-all"
              >
                #{kw}
              </Link>
            ))}
          </div>

          <time className="text-sm text-slate-600">{poem.createdAt}</time>

          {/* Share */}
          <ShareButton lines={poem.lines} />
        </div>
      </article>

      {/* Related */}
      {recommendations.length > 0 && (
        <section>
          <h2 className="text-sm uppercase tracking-widest text-slate-500 mb-6">
            相关废话推荐
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.map((p) => (
              <PoemCard key={p.id} poem={p} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

// Extracted to a client component file below
