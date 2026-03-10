import type { Poem } from "@/lib/poem-generator";
import PoemCard from "./PoemCard";

export default function PoemList({
  poems,
  columns = 2,
}: {
  poems: Poem[];
  columns?: 1 | 2 | 3;
}) {
  const gridCls =
    columns === 1
      ? "grid-cols-1 max-w-2xl mx-auto"
      : columns === 3
      ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
      : "grid-cols-1 md:grid-cols-2";

  return (
    <div className={`grid ${gridCls} gap-4 md:gap-6`}>
      {poems.map((poem) => (
        <PoemCard key={poem.id} poem={poem} />
      ))}
    </div>
  );
}
