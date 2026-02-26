"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";

interface Message {
  id: string;
  type: "text" | "image";
  content: string;
  timestamp: number;
  sender: string;
}

interface RoomInfo {
  id: string;
  name: string;
  hasPassword: boolean;
  createdAt: number;
}

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;

  const [room, setRoom] = useState<RoomInfo | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [textInput, setTextInput] = useState("");
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [verified, setVerified] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [verifyError, setVerifyError] = useState("");
  const [showDelete, setShowDelete] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pasteZoneRef = useRef<HTMLDivElement>(null);
  const lastTimestampRef = useRef<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Fetch room info
  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const res = await fetch(`/api/room/${roomId}`);
        const data = await res.json();
        if (data.success) {
          setRoom(data.room);
          if (!data.room.hasPassword) {
            setVerified(true);
          }
        } else {
          setError("房间不存在或已过期");
        }
      } catch {
        setError("网络错误");
      } finally {
        setLoading(false);
      }
    };
    fetchRoom();
  }, [roomId]);

  // Poll messages
  const fetchMessages = useCallback(async () => {
    if (!verified) return;
    try {
      const url = lastTimestampRef.current
        ? `/api/room/${roomId}/messages?after=${lastTimestampRef.current}`
        : `/api/room/${roomId}/messages`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && data.messages.length > 0) {
        if (lastTimestampRef.current === 0) {
          setMessages(data.messages);
        } else {
          setMessages((prev) => [...prev, ...data.messages]);
        }
        lastTimestampRef.current =
          data.messages[data.messages.length - 1].timestamp;
        setTimeout(scrollToBottom, 100);
      }
    } catch {
      // silent fail on polling
    }
  }, [roomId, verified]);

  useEffect(() => {
    if (!verified) return;
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [fetchMessages, verified]);

  // Verify password
  const handleVerify = async () => {
    try {
      const res = await fetch(`/api/room/${roomId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: passwordInput }),
      });
      const data = await res.json();
      if (data.verified) {
        setVerified(true);
        setVerifyError("");
      } else {
        setVerifyError("口令错误");
      }
    } catch {
      setVerifyError("验证失败");
    }
  };

  // Send text message
  const handleSendText = async () => {
    if (!textInput.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/room/${roomId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "text",
          content: textInput.trim(),
          sender: nickname || "匿名用户",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTextInput("");
        await fetchMessages();
      }
    } catch {
      setError("发送失败");
    } finally {
      setSending(false);
    }
  };

  // Send image message
  const sendImage = useCallback(async (dataUrl: string) => {
    setSending(true);
    try {
      const res = await fetch(`/api/room/${roomId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "image",
          content: dataUrl,
          sender: nickname || "匿名用户",
        }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchMessages();
      } else {
        setError(data.error || "图片发送失败");
      }
    } catch {
      setError("图片发送失败");
    } finally {
      setSending(false);
    }
  }, [roomId, nickname, fetchMessages]);

  // Handle paste event (global)
  useEffect(() => {
    if (!verified) return;

    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
              const dataUrl = ev.target?.result as string;
              if (dataUrl) sendImage(dataUrl);
            };
            reader.readAsDataURL(file);
          }
          return;
        }
      }

      const text = e.clipboardData?.getData("text");
      if (text && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        setSending(true);
        try {
          const res = await fetch(`/api/room/${roomId}/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "text",
              content: text,
              sender: nickname || "匿名用户",
            }),
          });
          const data = await res.json();
          if (data.success) await fetchMessages();
        } catch {
          // ignore
        } finally {
          setSending(false);
        }
      }
    };

    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [verified, roomId, nickname, fetchMessages, sendImage]);

  // Handle drag & drop
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    for (const file of Array.from(files)) {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const dataUrl = ev.target?.result as string;
          if (dataUrl) sendImage(dataUrl);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  // Handle file input
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const dataUrl = ev.target?.result as string;
          if (dataUrl) sendImage(dataUrl);
        };
        reader.readAsDataURL(file);
      }
    }
    e.target.value = "";
  };

  // Copy room link
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = window.location.href;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Copy room ID
  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
    } catch {
      // fallback
    }
  };

  // Delete room
  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/room/${roomId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: deletePassword }),
      });
      const data = await res.json();
      if (data.success) {
        router.push("/");
      } else {
        setDeleteError(data.error || "删除失败");
      }
    } catch {
      setDeleteError("网络错误");
    }
  };

  // Copy text content
  const handleCopyContent = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
    } catch {
      // fallback
    }
  };

  // Format time
  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">加载中...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center glass rounded-2xl p-10 max-w-md mx-4">
          <div className="text-4xl mb-4">😢</div>
          <h2 className="text-xl font-bold mb-2">无法进入房间</h2>
          <p className="text-slate-400 mb-6">{error}</p>
          <button onClick={() => router.push("/")} className="btn-primary">
            返回首页
          </button>
        </div>
      </div>
    );
  }

  // Password verification
  if (room && room.hasPassword && !verified) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="glass rounded-2xl p-8 max-w-md w-full animate-fade-in">
          <div className="text-center mb-6">
            <div className="text-4xl mb-3">🔒</div>
            <h2 className="text-xl font-bold">{room.name}</h2>
            <p className="text-slate-400 text-sm mt-1">此房间需要口令才能进入</p>
          </div>
          <input
            type="password"
            className="input-field mb-4"
            placeholder="请输入房间口令..."
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleVerify()}
          />
          {verifyError && (
            <p className="text-red-400 text-sm mb-4">{verifyError}</p>
          )}
          <div className="flex gap-3">
            <button onClick={() => router.push("/")} className="btn-ghost flex-1">
              返回
            </button>
            <button onClick={handleVerify} className="btn-primary flex-1">
              验证
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main room view
  return (
    <div className="min-h-screen flex flex-col">
      {/* Room Header */}
      <header className="glass border-t-0 border-x-0 sticky top-0 z-50 px-4 sm:px-8 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => router.push("/")}
              className="text-slate-400 hover:text-white transition-colors shrink-0"
            >
              ←
            </button>
            <div className="min-w-0">
              <h1 className="font-bold truncate">{room?.name}</h1>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>房间号:</span>
                <code
                  className="bg-white/5 px-2 py-0.5 rounded cursor-pointer hover:bg-white/10 transition-colors"
                  onClick={handleCopyId}
                  title="点击复制"
                >
                  {roomId}
                </code>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopyLink}
              className="btn-ghost text-sm px-3 py-1.5"
            >
              {copied ? "✓ 已复制" : "🔗 分享"}
            </button>
            {room?.hasPassword && (
              <button
                onClick={() => setShowDelete(!showDelete)}
                className="btn-ghost text-sm px-3 py-1.5 text-red-400 hover:text-red-300"
              >
                🗑️
              </button>
            )}
          </div>
        </div>

        {/* Delete confirmation */}
        {showDelete && (
          <div className="max-w-4xl mx-auto mt-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl animate-slide-up">
            <p className="text-sm text-red-300 mb-3">
              删除房间将清除所有内容，此操作不可撤销
            </p>
            <div className="flex gap-2">
              <input
                type="password"
                className="input-field text-sm py-2 flex-1"
                placeholder="输入房间口令确认删除..."
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
              />
              <button onClick={handleDelete} className="btn-danger text-sm">
                确认删除
              </button>
            </div>
            {deleteError && (
              <p className="text-red-400 text-xs mt-2">{deleteError}</p>
            )}
          </div>
        )}
      </header>

      {/* Nickname bar */}
      <div className="max-w-4xl w-full mx-auto px-4 sm:px-8 py-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 shrink-0">昵称:</span>
          <input
            type="text"
            className="bg-transparent border-b border-white/10 text-sm text-slate-300 
                       focus:outline-none focus:border-indigo-500/50 px-1 py-0.5 w-32 transition-colors"
            placeholder="匿名用户"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />
        </div>
      </div>

      {/* Messages Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-8 pb-4 overflow-auto">
        {messages.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-lg">还没有内容</p>
            <p className="text-sm mt-1">粘贴文字或图片来开始分享吧</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => (
              <div key={msg.id} className="message-enter">
                <div className="glass rounded-2xl p-4 glass-hover">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-indigo-400">
                      {msg.sender}
                    </span>
                    <span className="text-xs text-slate-600">
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                  {msg.type === "text" ? (
                    <div className="group relative">
                      <p className="text-slate-200 whitespace-pre-wrap break-words leading-relaxed">
                        {msg.content}
                      </p>
                      <button
                        onClick={() => handleCopyContent(msg.content)}
                        className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 
                                   text-xs text-slate-500 hover:text-indigo-400 transition-all p-1"
                        title="复制"
                      >
                        📋
                      </button>
                    </div>
                  ) : (
                    <div className="mt-1">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={msg.content}
                        alt="shared image"
                        className="max-w-full max-h-96 rounded-xl cursor-pointer 
                                   hover:opacity-90 transition-opacity"
                        onClick={() => setPreviewImage(msg.content)}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      {/* Paste Zone & Input */}
      <div className="sticky bottom-0 glass border-b-0 border-x-0 px-4 sm:px-8 py-4">
        <div className="max-w-4xl mx-auto">
          {/* Paste / Drop zone */}
          <div
            ref={pasteZoneRef}
            className={`paste-zone rounded-xl p-4 mb-3 text-center cursor-pointer
                       ${dragOver ? "dragover" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
              multiple
            />
            <p className="text-slate-500 text-sm">
              {sending ? (
                <span className="text-indigo-400">⏳ 发送中...</span>
              ) : dragOver ? (
                <span className="text-indigo-400">松开鼠标上传图片</span>
              ) : (
                <>
                  <span className="text-indigo-400">Ctrl+V</span> 粘贴文字/图片 ·
                  拖拽图片到这里 · 或
                  <span className="text-indigo-400"> 点击上传</span>
                </>
              )}
            </p>
          </div>

          {/* Text input */}
          <div className="flex gap-2">
            <input
              type="text"
              className="input-field flex-1"
              placeholder="输入消息，按回车发送..."
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendText();
                }
              }}
              disabled={sending}
            />
            <button
              onClick={handleSendText}
              disabled={sending || !textInput.trim()}
              className="btn-primary px-6 disabled:opacity-50"
            >
              发送
            </button>
          </div>
        </div>
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setPreviewImage(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewImage}
            alt="preview"
            className="max-w-full max-h-full object-contain rounded-lg"
          />
          <button
            className="absolute top-6 right-6 text-white/60 hover:text-white text-3xl transition-colors"
            onClick={() => setPreviewImage(null)}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
