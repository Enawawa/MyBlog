import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <main>
      {/* Hero Banner */}
      <section className="relative h-[calc(100vh-4rem)] flex flex-col items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="/banner.png"
            alt="banner"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/30" />
        </div>
        <div className="relative z-10 text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-4 drop-shadow-lg">
            人生是旷野，不是轨道
          </h1>
          <p className="text-lg text-white/80">怎么着都能活</p>
        </div>
      </section>

      {/* Blog Cards */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/daily" className="group">
            <div className="glass rounded-2xl overflow-hidden glass-hover">
              <div className="relative aspect-[4/3]">
                <Image
                  src="/images/p1.webp"
                  alt="日常小记"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-5">
                <h3 className="text-lg font-semibold text-slate-200">日常小记</h3>
                <p className="text-sm text-slate-500 mt-1">生活里的碎碎念</p>
              </div>
            </div>
          </Link>

          <Link href="/thoughts" className="group">
            <div className="glass rounded-2xl overflow-hidden glass-hover">
              <div className="relative aspect-[4/3]">
                <Image
                  src="/images/p2.webp"
                  alt="碎片感受"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-5">
                <h3 className="text-lg font-semibold text-slate-200">碎片感受</h3>
                <p className="text-sm text-slate-500 mt-1">片刻的感悟与思绪</p>
              </div>
            </div>
          </Link>

          <Link href="/clipboard" className="group">
            <div className="glass rounded-2xl overflow-hidden glass-hover border-indigo-500/20">
              <div className="relative aspect-[4/3] bg-gradient-to-br from-indigo-600/20 to-purple-600/20 flex items-center justify-center">
                <span className="text-6xl">📋</span>
              </div>
              <div className="p-5">
                <h3 className="text-lg font-semibold text-indigo-400">共享剪贴板</h3>
                <p className="text-sm text-slate-500 mt-1">
                  创建房间，粘贴即分享
                </p>
              </div>
            </div>
          </Link>

          <Link href="/game" className="group">
            <div className="glass rounded-2xl overflow-hidden glass-hover border-amber-500/20">
              <div className="relative aspect-[4/3] bg-gradient-to-br from-amber-600/20 to-orange-600/20 flex items-center justify-center">
                <span className="text-6xl">🎮</span>
              </div>
              <div className="p-5">
                <h3 className="text-lg font-semibold text-amber-400">飞跃小鸟</h3>
                <p className="text-sm text-slate-500 mt-1">
                  刺激的竞速小游戏，点击即玩
                </p>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-slate-600 text-sm border-t border-white/5">
        <p>Copyright &copy; 2024 Double All Rights Reserved.</p>
      </footer>
    </main>
  );
}
