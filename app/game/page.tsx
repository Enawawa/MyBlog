"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

// 游戏常量
const GRAVITY = 0.5;
const JUMP_STRENGTH_MIN = -1;  // 最小跳跃（跳得低）
const JUMP_STRENGTH_MAX = -9;  // 最大跳跃（跳得高）
const PIPE_GAP = 220;      // 加大障碍间距
const PIPE_WIDTH = 55;
const PIPE_SPEED = 1.5;
const PIPE_SPAWN_INTERVAL = 2800;  // 管道生成间隔加大

type GameState = "idle" | "playing" | "gameover";

interface Pipe {
  id: number;
  x: number;
  topHeight: number;
  passed: boolean;
  isGolden?: boolean;  // 金色管道，通过得双倍分
}

export default function GamePage() {
  const [gameState, setGameState] = useState<GameState>("idle");
  const [score, setScore] = useState(0);
  const [birdY, setBirdY] = useState(200);
  const [birdVelocity, setBirdVelocity] = useState(0);
  const [pipes, setPipes] = useState<Pipe[]>([]);
  const [highScore, setHighScore] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [combo, setCombo] = useState(0);           // 连击数
  const [milestone, setMilestone] = useState<number | null>(null);  // 里程碑庆祝
  const [jumpStrength, setJumpStrength] = useState(-5);  // 跳跃高度 -1~-9，用户可调
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const fullscreenRef = useRef<HTMLDivElement>(null);
  const pipeIdRef = useRef(0);
  const animationRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);
  // 用 ref 存储实时值，避免闭包陈旧
  const birdYRef = useRef(200);
  const birdVelRef = useRef(0);
  const gameStateRef = useRef(gameState);
  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const jumpStrengthRef = useRef(-5);

  birdYRef.current = birdY;
  birdVelRef.current = birdVelocity;
  gameStateRef.current = gameState;
  scoreRef.current = score;
  comboRef.current = combo;
  jumpStrengthRef.current = jumpStrength;

  const getGameHeight = useCallback(() => gameAreaRef.current?.clientHeight ?? 500, []);
  const getGameWidth = useCallback(() => gameAreaRef.current?.clientWidth ?? 400, []);

  const jump = useCallback(() => {
    const strength = jumpStrengthRef.current;
    if (gameStateRef.current === "idle") {
      setGameState("playing");
      setBirdVelocity(strength);
      birdVelRef.current = strength;
    } else if (gameStateRef.current === "playing") {
      setBirdVelocity(strength);
      birdVelRef.current = strength;
    }
  }, []);

  const spawnPipe = useCallback(() => {
    const height = getGameHeight();
    const minTop = 100;
    const maxTop = height - PIPE_GAP - 100;
    const topHeight = Math.floor(Math.random() * (maxTop - minTop + 1)) + minTop;
    pipeIdRef.current += 1;
    const pipeCount = pipeIdRef.current;
    const isGolden = pipeCount % 5 === 0;  // 每第5个管道为金色，双倍分
    setPipes((prev) => [
      ...prev,
      { id: pipeIdRef.current, x: getGameWidth(), topHeight, passed: false, isGolden },
    ]);
  }, [getGameHeight, getGameWidth]);

  useEffect(() => {
    if (gameState !== "playing") return;

    const pipeSpawnTimer = setInterval(spawnPipe, PIPE_SPAWN_INTERVAL);

    const gameLoop = (timestamp: number) => {
      const dt = lastTimeRef.current ? Math.min(timestamp - lastTimeRef.current, 50) : 16;
      lastTimeRef.current = timestamp;

      const h = getGameHeight();
      const maxY = h - 45;

      // 物理更新：先速度，再位置
      birdVelRef.current += GRAVITY * (dt / 16);
      const newY = birdYRef.current + birdVelRef.current * (dt / 16);

      if (newY <= 0 || newY >= maxY) {
        setGameState("gameover");
        const s = scoreRef.current;
        setHighScore((prev) => Math.max(prev, s));
        if (typeof window !== "undefined") {
          const saved = parseInt(localStorage.getItem("flappy-game-high-score") || "0", 10);
          localStorage.setItem("flappy-game-high-score", String(Math.max(saved, s)));
        }
        return;
      }

      birdYRef.current = newY;
      setBirdY(newY);
      setBirdVelocity(birdVelRef.current);

      // 管道移动与碰撞检测
      setPipes((prev) => {
        const by = birdYRef.current;
        const birdLeft = 80;
        const birdRight = 120;
        const birdTop = by - 18;
        const birdBottom = by + 20;

        let collision = false;
        let addScore = 0;

        let passedThisFrame = false;
        let wasGolden = false;

        const updated = prev
          .map((p) => {
            const nx = p.x - PIPE_SPEED * (dt / 16);
            const pipeLeft = nx;
            const pipeRight = nx + PIPE_WIDTH;
            const gapTop = p.topHeight;
            const gapBottom = p.topHeight + PIPE_GAP;

            if (birdRight > pipeLeft && birdLeft < pipeRight) {
              if (birdTop < gapTop || birdBottom > gapBottom) collision = true;
              if (!p.passed && birdLeft > pipeRight - 10) {
                passedThisFrame = true;
                wasGolden = !!p.isGolden;
                addScore += p.isGolden ? 2 : 1;  // 金色管道双倍分
                return { ...p, x: nx, passed: true };
              }
            }
            return { ...p, x: nx };
          })
          .filter((p) => p.x > -PIPE_WIDTH);

        if (collision) {
          setGameState("gameover");
          setCombo(0);
          const s = scoreRef.current;
          setHighScore((prev) => Math.max(prev, s));
          if (typeof window !== "undefined") {
            const saved = parseInt(localStorage.getItem("flappy-game-high-score") || "0", 10);
            localStorage.setItem("flappy-game-high-score", String(Math.max(saved, s)));
          }
        }
        if (addScore > 0) {
          if (passedThisFrame) {
            const newCombo = comboRef.current + 1;
            setCombo(newCombo);
            // 连击奖励：2连击+1分, 4连击+2分, 6连击+3分...
            const comboBonus = Math.floor(newCombo / 2);
            const totalAdd = addScore + comboBonus;
            setScore((s) => s + totalAdd);
            scoreRef.current += totalAdd;
            // 里程碑庆祝：5、10、15...
            const newScore = scoreRef.current;
            if (newScore > 0 && newScore % 5 === 0) {
              setMilestone(newScore);
              setTimeout(() => setMilestone(null), 1200);
            }
          } else {
            setScore((s) => s + addScore);
          }
        }

        return updated;
      });

      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);

    return () => {
      clearInterval(pipeSpawnTimer);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [gameState, getGameHeight, getGameWidth, spawnPipe]);

  // 重置游戏
  const resetGame = useCallback(() => {
    setGameState("idle");
    setScore(0);
    setCombo(0);
    comboRef.current = 0;
    setBirdY(200);
    setBirdVelocity(0);
    setPipes([]);
    lastTimeRef.current = 0;
    scoreRef.current = 0;
  }, []);

  // 从 localStorage 加载最高分
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("flappy-game-high-score");
      if (saved) setHighScore(parseInt(saved, 10));
    }
  }, []);

  // 全屏切换
  const toggleFullscreen = useCallback(() => {
    const el = fullscreenRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 safe-area-pb">
      <div
        ref={fullscreenRef}
        className="flex flex-col w-full max-w-md h-[85vh] max-h-[800px] rounded-2xl overflow-hidden bg-[var(--bg-primary)] [&:fullscreen]:max-w-none [&:fullscreen]:max-h-none [&:fullscreen]:h-screen [&:fullscreen]:w-screen [&:fullscreen]:rounded-none"
      >
        {/* 标题和返回 */}
        <div className="flex items-center justify-between px-2 py-2 shrink-0">
          <Link
            href="/"
            className="text-slate-400 hover:text-white transition-colors text-sm"
          >
            ← 返回
          </Link>
          <h1 className="text-xl font-bold gradient-text">🎮 飞跃小鸟</h1>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleFullscreen();
            }}
            className="text-slate-400 hover:text-white transition-colors text-sm px-2 py-1"
            title={isFullscreen ? "退出全屏" : "全屏"}
          >
            {isFullscreen ? "⛶ 退出" : "⛶ 全屏"}
          </button>
        </div>

        {/* 跳跃高度调节 - 仅在开始前可调 */}
        {(gameState === "idle" || gameState === "gameover") && (
          <div className="px-2 py-2 mb-2 shrink-0">
            <label className="flex items-center gap-3 text-sm text-slate-400">
              <span className="shrink-0">跳跃高度:</span>
              <input
                type="range"
                min={JUMP_STRENGTH_MIN}
                max={JUMP_STRENGTH_MAX}
                value={jumpStrength}
                onChange={(e) => setJumpStrength(Number(e.target.value))}
                className="flex-1 h-2 accent-amber-500"
              />
              <span className="text-amber-400 font-mono w-8">{-jumpStrength}</span>
            </label>
          </div>
        )}

        {/* 分数显示 */}
        <div className="flex justify-between items-center px-2 mb-2 text-sm shrink-0 gap-2">
          <span className="text-slate-400 shrink-0">当前: <span className="text-white font-bold">{score}</span></span>
          <span className="text-amber-400 font-bold animate-pulse min-w-[4rem] text-center">
            {combo >= 2 ? `🔥 ${combo} 连击` : ""}
          </span>
          <span className="text-slate-400 shrink-0">最高: <span className="text-amber-400 font-bold">{highScore}</span></span>
        </div>

        {/* 游戏区域 - 支持触摸，全屏时占满剩余空间 */}
        <div
          ref={gameAreaRef}
          className="relative flex-1 min-h-0 w-full rounded-2xl overflow-hidden glass border-2 border-white/10 cursor-pointer select-none touch-none [-webkit-tap-highlight-color:transparent]"
          style={{ backgroundColor: "#0c4a6e" }}
          onClick={jump}
          onTouchStart={(e) => {
            e.preventDefault();
            jump();
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.code === "Space" || e.code === "Enter") {
              e.preventDefault();
              jump();
            }
          }}
        >
          {/* 天空背景 */}
          <div className="absolute inset-0 bg-gradient-to-b from-sky-400/20 to-sky-900/40" />

          {/* 云朵装饰 */}
          <div className="absolute top-8 left-[10%] w-20 h-10 rounded-full bg-white/20" />
          <div className="absolute top-16 right-[15%] w-16 h-8 rounded-full bg-white/15" />
          <div className="absolute top-24 left-[30%] w-12 h-6 rounded-full bg-white/10" />

          {/* 管道 */}
          {pipes.map((pipe) => {
            const isGolden = pipe.isGolden;
            const pipeClass = isGolden
              ? "from-amber-500 to-yellow-600 border-amber-600"
              : "from-green-600 to-green-700 border-green-800";
            return (
              <div
                key={pipe.id}
                className="absolute top-0 left-0 flex flex-col"
                style={{
                  transform: `translateX(${pipe.x}px)`,
                  width: PIPE_WIDTH,
                }}
              >
                {/* 上管道 */}
                <div
                  className="relative"
                  style={{ height: pipe.topHeight }}
                >
                  <div
                    className={`absolute bottom-0 left-0 right-0 h-full bg-gradient-to-b rounded-t-lg border-2 ${pipeClass}`}
                    style={{ width: PIPE_WIDTH }}
                  />
                  <div
                    className={`absolute -bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%+20px)] h-8 bg-gradient-to-b rounded-t-lg border-2 ${pipeClass}`}
                  />
                </div>
                {/* 空隙 */}
                <div style={{ height: PIPE_GAP }} />
                {/* 下管道 */}
                <div
                  className="relative flex-1"
                  style={{ minHeight: 100 }}
                >
                  <div
                    className={`absolute top-0 left-1/2 -translate-x-1/2 w-[calc(100%+20px)] h-8 bg-gradient-to-b rounded-b-lg border-2 ${pipeClass}`}
                  />
                  <div
                    className={`absolute top-0 left-0 right-0 h-full bg-gradient-to-b rounded-b-lg border-2 ${pipeClass}`}
                    style={{ width: PIPE_WIDTH }}
                  />
                </div>
              </div>
            );
          })}

          {/* 小鸟 */}
          <div
            className="absolute w-10 h-10 flex items-center justify-center z-10 transition-transform duration-75"
            style={{
              left: 80,
              top: birdY - 20,
            }}
          >
            <div
              className="w-10 h-10 rounded-full bg-amber-400 border-2 border-amber-600 shadow-lg flex items-center justify-center"
              style={{
                transform: `rotate(${birdVelocity * 2}deg)`,
              }}
            >
              <span className="text-lg">🐦</span>
            </div>
          </div>

          {/* 地面 */}
          <div
            className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-b from-amber-800/80 to-amber-900 border-t-2 border-amber-950"
          />

          {/* 里程碑庆祝 */}
          {milestone && (
            <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
              <span className="text-4xl font-bold text-amber-400 animate-pulse drop-shadow-lg">
                🎉 {milestone} 分！
              </span>
            </div>
          )}

          {/* 开始/结束界面 */}
          {gameState === "idle" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 z-20">
              <p className="text-white text-lg font-semibold mb-2">点击或触摸开始</p>
              <p className="text-white/80 text-sm">躲避管道，飞得越高分越高！</p>
            </div>
          )}
          {gameState === "gameover" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 z-20">
              <p className="text-2xl font-bold text-white mb-2">游戏结束</p>
              <p className="text-amber-400 text-xl mb-4">得分: {score}</p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  resetGame();
                }}
                className="btn-primary"
              >
                重新开始
              </button>
            </div>
          )}
        </div>

        {/* 操作说明 */}
        <p className="text-center text-slate-500 text-sm py-2 shrink-0">
          点击屏幕 / 触摸 / 空格键 让小鸟跳跃
        </p>
      </div>
    </main>
  );
}
