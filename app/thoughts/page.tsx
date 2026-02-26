import type { Metadata } from "next";

export const metadata: Metadata = { title: "碎片感受 - Double's Blog" };

const fragments = [
  {
    title: "无所谓",
    content: `人生啊
无非就是走一段路
磕磕绊绊地走
踉踉跄跄地走
有时咕咚一下摔到地上
也不用着急着起身
不用假装潇洒拍拍灰尘
真伤了也可以打个急救电话
喊一声身边的亲朋或陌生人
总能熬到痊愈
然后再度启程
如若不幸伤在了荒野
与这世界断了联
那就所幸平静地闭上眼
确切地感知这就是走过的所有路
也再也不受那未知的终点困扰
当真是无所谓了`,
  },
  {
    content:
      "石路旁边的草丛里，被踩出一条光秃秃的新路，可见原来的小路多么拥挤，一米宽小小的路要承载行人、自行车、电动车的双向通行，逼得行人在草丛里踏出来一条新的土路",
  },
  {
    content:
      "小镇青年有这么强的消费力，大概是他们不用存钱买房，生存花销又不大，反而更容易豪掷。",
  },
  {
    content:
      "我的一生，不是追求从贫穷到富有的底气，是说出一句句没什么大不了的底气",
  },
];

export default function ThoughtsPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-10 gradient-text inline-block">
        碎片感受
      </h1>
      <div className="space-y-6">
        {fragments.map((f, i) => (
          <article
            key={i}
            className="glass rounded-2xl p-6 glass-hover animate-fade-in"
          >
            {f.title && (
              <h2 className="text-lg font-semibold text-amber-300/90 mb-3">
                {f.title}
              </h2>
            )}
            <p className="text-slate-300 leading-relaxed whitespace-pre-line text-[15px]">
              {f.content}
            </p>
          </article>
        ))}
      </div>

      <footer className="mt-16 py-8 text-center text-slate-600 text-sm border-t border-white/5">
        <p>Copyright &copy; 2024 Double All Rights Reserved.</p>
      </footer>
    </main>
  );
}
