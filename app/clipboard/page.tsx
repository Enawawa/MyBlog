"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ClipboardHome() {
  const router = useRouter();
  const [mode, setMode] = useState<"home" | "create" | "join">("home");
  const [roomName, setRoomName] = useState("");
  const [password, setPassword] = useState("");
  const [joinId, setJoinId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: roomName, password }),
      });
      const data = await res.json();
      if (data.success) {
        router.push(`/clipboard/room/${data.room.id}`);
      } else {
        setError(data.error || "创建失败");
      }
    } catch {
      setError("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!joinId.trim()) {
      setError("请输入房间号");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/room/${joinId.trim()}`);
      const data = await res.json();
      if (data.success) {
        router.push(`/clipboard/room/${joinId.trim()}`);
      } else {
        setError("房间不存在");
      }
    } catch {
      setError("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 pb-20">
      <div className="w-full max-w-lg">
        {/* Home */}
        {mode === "home" && (
          <div className="text-center animate-fade-in">
            <div className="mb-8">
              <div className="text-5xl mb-4">📋</div>
              <h1 className="text-4xl font-bold mb-3">
                <span className="gradient-text">共享剪贴板</span>
              </h1>
              <p className="text-slate-400 leading-relaxed">
                无需登录，创建房间即可与他人共享文字和图片
                <br />
                粘贴即分享，简单高效
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
              <button
                onClick={() => setMode("create")}
                className="btn-primary text-lg px-8 py-4"
              >
                ✨ 创建房间
              </button>
              <button
                onClick={() => setMode("join")}
                className="btn-ghost text-lg px-8 py-4"
              >
                🚪 加入房间
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-14">
              {[
                { icon: "📎", title: "粘贴即分享", desc: "支持文字和图片" },
                { icon: "🔒", title: "口令保护", desc: "可设置房间密码" },
                { icon: "⚡", title: "实时同步", desc: "内容即时更新" },
              ].map((f) => (
                <div key={f.title} className="glass rounded-2xl p-5 text-center">
                  <div className="text-2xl mb-2">{f.icon}</div>
                  <h3 className="font-semibold text-sm">{f.title}</h3>
                  <p className="text-slate-500 text-xs mt-1">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Create */}
        {mode === "create" && (
          <div className="animate-fade-in">
            <button
              onClick={() => { setMode("home"); setError(""); }}
              className="text-slate-400 hover:text-white mb-6 flex items-center gap-2 transition-colors"
            >
              ← 返回
            </button>
            <div className="glass rounded-2xl p-8">
              <h2 className="text-2xl font-bold mb-6">创建新房间</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">房间名称（可选）</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="给房间起个名字..."
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">房间口令（可选，用于管理房间）</label>
                  <input
                    type="password"
                    className="input-field"
                    placeholder="设置口令后可删除房间..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                {error && <p className="text-red-400 text-sm">{error}</p>}
                <button
                  onClick={handleCreate}
                  disabled={loading}
                  className="btn-primary w-full text-lg py-4 mt-2 disabled:opacity-50"
                >
                  {loading ? "创建中..." : "🚀 创建房间"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Join */}
        {mode === "join" && (
          <div className="animate-fade-in">
            <button
              onClick={() => { setMode("home"); setError(""); }}
              className="text-slate-400 hover:text-white mb-6 flex items-center gap-2 transition-colors"
            >
              ← 返回
            </button>
            <div className="glass rounded-2xl p-8">
              <h2 className="text-2xl font-bold mb-6">加入房间</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">房间号</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="输入房间号..."
                    value={joinId}
                    onChange={(e) => setJoinId(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                  />
                </div>
                {error && <p className="text-red-400 text-sm">{error}</p>}
                <button
                  onClick={handleJoin}
                  disabled={loading}
                  className="btn-primary w-full text-lg py-4 mt-2 disabled:opacity-50"
                >
                  {loading ? "查找中..." : "🚪 加入房间"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
