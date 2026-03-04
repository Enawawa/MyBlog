"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

// 游戏常量
const GRAVITY = 0.5;
const JUMP_STRENGTH = -9;
const PIPE_GAP = 150;
const PIPE_WIDTH = 55;
const PIPE_SPEED = 2.5;
const PIPE_SPAWN_INTERVAL = 2000;

type GameState = "idle" | "playing" | "gameover";

interface Pipe {
  id: number;
  x: number;
  topHeight: number;
  passed: boolean;
}

export default function GamePage() {
  const [gameState, setGameState] = useState<GameState>("idle");
  const [score, setScore] = useState(0);
  const [birdY, setBirdY] = useState(200);
  const [birdVelocity, setBirdVelocity] = useState(0);
  const [pipes, setPipes] = useState<Pipe[]>([]);
  const [highScore, setHighScore] = useState(0);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const pipeIdRef = useRef(0);
  const animationRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);
  // 用 ref 存储实时值，避免闭包陈旧
  const birdYRef = useRef(200);
  const birdVelRef = useRef(0);
  const gameStateRef = useRef(gameState);
  const scoreRef = useRef(0);

  birdYRef.current = birdY;
  birdVelRef.current = birdVelocity;
  gameStateRef.current = gameState;
  scoreRef.current = score;

  const getGameHeight = useCallback(() => gameAreaRef.current?.clientHeight ?? 500, []);
  const getGameWidth = useCallback(() => gameAreaRef.current?.clientWidth ?? 400, []);

  const jump = useCallback(() => {
    if (gameStateRef.current === "idle") {
      setGameState("playing");
      setBirdVelocity(JUMP_STRENGTH);
      birdVelRef.current = JUMP_STRENGTH;
    } else if (gameStateRef.current === "playing") {
      setBirdVelocity(JUMP_STRENGTH);
      birdVelRef.current = JUMP_STRENGTH;
    }
  }, []);

  const spawnPipe = useCallback(() => {
    const height = getGameHeight();
    const minTop = 100;
    const maxTop = height - PIPE_GAP - 100;
    const topHeight = Math.floor(Math.random() * (maxTop - minTop + 1)) + minTop;
    pipeIdRef.current += 1;
    setPipes((prev) => [
      ...prev,
      { id: pipeIdRef.current, x: getGameWidth(), topHeight, passed: false },
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
                addScore += 1;
                return { ...p, x: nx, passed: true };
              }
            }
            return { ...p, x: nx };
          })
          .filter((p) => p.x > -PIPE_WIDTH);

        if (collision) {
          setGameState("gameover");
          const s = scoreRef.current;
          setHighScore((prev) => Math.max(prev, s));
          if (typeof window !== "undefined") {
            const saved = parseInt(localStorage.getItem("flappy-game-high-score") || "0", 10);
            localStorage.setItem("flappy-game-high-score", String(Math.max(saved, s)));
          }
        }
        if (addScore > 0) setScore((s) => s + addScore);

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
    setBirdY(200);
    setBirdVelocity(0);
    setPipes([]);
    lastTimeRef.current = 0;
  }, []);

  // 从 localStorage 加载最高分
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("flappy-game-high-score");
      if (saved) setHighScore(parseInt(saved, 10));
    }
  }, []);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 safe-area-pb">
      <div className="w-full max-w-md">
        {/* 标题和返回 */}
        <div className="flex items-center justify-between mb-4">
          <Link
            href="/"
            className="text-slate-400 hover:text-white transition-colors text-sm"
          >
            ← 返回
          </Link>
          <h1 className="text-xl font-bold gradient-text">🎮 飞跃小鸟</h1>
          <div className="w-12" />
        </div>

        {/* 分数显示 */}
        <div className="flex justify-between items-center mb-2 text-sm">
          <span className="text-slate-400">当前: <span className="text-white font-bold">{score}</span></span>
          <span className="text-slate-400">最高: <span className="text-amber-400 font-bold">{highScore}</span></span>
        </div>

        {/* 游戏区域 - 支持触摸 */}
        <div
          ref={gameAreaRef}
          className="relative w-full aspect-[4/5] max-h-[70vh] rounded-2xl overflow-hidden glass border-2 border-white/10 cursor-pointer select-none touch-none [-webkit-tap-highlight-color:transparent]"
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
          {pipes.map((pipe) => (
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
                  className="absolute bottom-0 left-0 right-0 h-full bg-gradient-to-b from-green-600 to-green-700 rounded-t-lg border-2 border-green-800"
                  style={{ width: PIPE_WIDTH }}
                />
                <div
                  className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%+20px)] h-8 bg-gradient-to-b from-green-600 to-green-800 rounded-t-lg border-2 border-green-800"
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
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-[calc(100%+20px)] h-8 bg-gradient-to-b from-green-700 to-green-800 rounded-b-lg border-2 border-green-800"
                />
                <div
                  className="absolute top-0 left-0 right-0 h-full bg-gradient-to-b from-green-600 to-green-700 rounded-b-lg border-2 border-green-800"
                  style={{ width: PIPE_WIDTH }}
                />
              </div>
            </div>
          ))}

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
        <p className="text-center text-slate-500 text-sm mt-4">
          点击屏幕 / 触摸 / 空格键 让小鸟跳跃
        </p>
      </div>
    </main>
  );
}
