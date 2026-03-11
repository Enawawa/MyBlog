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

          <Link href="/nonsense-poetry" className="group">
            <div className="glass rounded-2xl overflow-hidden glass-hover border-rose-500/20">
              <div className="relative aspect-[4/3] bg-gradient-to-br from-rose-600/20 to-pink-600/20 flex items-center justify-center">
                <span className="text-6xl">📜</span>
              </div>
              <div className="p-5">
                <h3 className="text-lg font-semibold text-rose-400">废话文学</h3>
                <p className="text-sm text-slate-500 mt-1">
                  打工人废话诗生成器
                </p>
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

          <a href="/trending.html" className="group">
            <div className="glass rounded-2xl overflow-hidden glass-hover border-emerald-500/20">
              <div className="relative aspect-[4/3] bg-gradient-to-br from-emerald-600/20 to-teal-600/20 flex items-center justify-center">
                <span className="text-6xl">✦</span>
              </div>
              <div className="p-5">
                <h3 className="text-lg font-semibold text-emerald-400">设计灵感</h3>
                <p className="text-sm text-slate-500 mt-1">
                  精选设计产品与创意推荐
                </p>
              </div>
            </div>
          </a>
        </div>
      </section>

      {/* 3D Game Section */}
      <section id="games" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-3">
            <span className="gradient-text">🎮 3D 游戏空间</span>
          </h2>
          <p className="text-center text-slate-500 text-sm mb-12">
            基于 WebGL 引擎打造，畅玩精美 3D 小游戏
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <a href="/games/stack-tower.html" className="group block">
              <div className="glass rounded-2xl overflow-hidden glass-hover border-purple-500/20">
                <div className="relative aspect-[4/3] bg-gradient-to-br from-purple-600/30 to-indigo-600/30 flex items-center justify-center">
                  <span className="text-5xl md:text-6xl group-hover:scale-110 transition-transform duration-300">🏗️</span>
                </div>
                <div className="p-4">
                  <h3 className="text-base font-semibold text-purple-400">堆叠方块</h3>
                  <p className="text-xs text-slate-500 mt-1">策略 · 休闲</p>
                </div>
              </div>
            </a>
            <a href="/games/flappy-flight.html" className="group block">
              <div className="glass rounded-2xl overflow-hidden glass-hover border-cyan-500/20">
                <div className="relative aspect-[4/3] bg-gradient-to-br from-cyan-600/30 to-blue-800/30 flex items-center justify-center">
                  <span className="text-5xl md:text-6xl group-hover:scale-110 transition-transform duration-300">🚀</span>
                </div>
                <div className="p-4">
                  <h3 className="text-base font-semibold text-cyan-400">飞跃障碍</h3>
                  <p className="text-xs text-slate-500 mt-1">动作 · 敏捷</p>
                </div>
              </div>
            </a>
            <a href="/games/racing-drift.html" className="group block">
              <div className="glass rounded-2xl overflow-hidden glass-hover border-orange-500/20">
                <div className="relative aspect-[4/3] bg-gradient-to-br from-orange-600/30 to-red-800/30 flex items-center justify-center">
                  <span className="text-5xl md:text-6xl group-hover:scale-110 transition-transform duration-300">🏎️</span>
                </div>
                <div className="p-4">
                  <h3 className="text-base font-semibold text-orange-400">极速漂移</h3>
                  <p className="text-xs text-slate-500 mt-1">竞速 · 闪避</p>
                </div>
              </div>
            </a>
            <a href="/games/rhythm-bounce.html" className="group block">
              <div className="glass rounded-2xl overflow-hidden glass-hover border-pink-500/20">
                <div className="relative aspect-[4/3] bg-gradient-to-br from-pink-600/30 to-purple-800/30 flex items-center justify-center">
                  <span className="text-5xl md:text-6xl group-hover:scale-110 transition-transform duration-300">🎵</span>
                </div>
                <div className="p-4">
                  <h3 className="text-base font-semibold text-pink-400">节奏弹跳</h3>
                  <p className="text-xs text-slate-500 mt-1">节奏 · 跳跃</p>
                </div>
              </div>
            </a>
            <a href="/games/kitchen-defense.html" className="group block">
              <div className="glass rounded-2xl overflow-hidden glass-hover border-amber-500/20">
                <div className="relative aspect-[4/3] bg-gradient-to-br from-amber-600/30 to-red-700/30 flex items-center justify-center">
                  <span className="text-5xl md:text-6xl group-hover:scale-110 transition-transform duration-300">🍳</span>
                </div>
                <div className="p-4">
                  <h3 className="text-base font-semibold text-amber-400">后厨防线</h3>
                  <p className="text-xs text-slate-500 mt-1">弹幕 · 肉鸽</p>
                </div>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-slate-600 text-sm border-t border-white/5">
        <p>Copyright &copy; 2024 Double All Rights Reserved.</p>
      </footer>
    </main>
  );
}
