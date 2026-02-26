"use client";

import { useState, useEffect, useRef, useCallback, Fragment } from "react";
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

// Render text with clickable URLs
function LinkedText({ text }: { text: string }) {
  const urlRegex = /(https?:\/\/[^\s<]+)/g;
  const parts = text.split(urlRegex);
  return (
    <>
      {parts.map((part, i) =>
        urlRegex.test(part) ? (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 break-all"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </a>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        )
      )}
    </>
  );
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
  const lastTimestampRef = useRef<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isFetchingRef = useRef(false);
  const knownIdsRef = useRef<Set<string>>(new Set());

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const appendMessage = useCallback((msg: Message) => {
    if (knownIdsRef.current.has(msg.id)) return;
    knownIdsRef.current.add(msg.id);
    setMessages((prev) => [...prev, msg]);
    if (msg.timestamp > lastTimestampRef.current) {
      lastTimestampRef.current = msg.timestamp;
    }
    setTimeout(scrollToBottom, 100);
  }, []);

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const res = await fetch(`/api/room/${roomId}`);
        const data = await res.json();
        if (data.success) {
          setRoom(data.room);
          if (!data.room.hasPassword) setVerified(true);
        } else if (res.status === 404) {
          setError("房间不存在，请检查房间号");
        } else {
          setError(data.error || "服务器错误，请稍后再试");
        }
      } catch {
        setError("网络错误");
      } finally {
        setLoading(false);
      }
    };
    fetchRoom();
  }, [roomId]);

  const fetchMessages = useCallback(async () => {
    if (!verified || isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      const url = lastTimestampRef.current
        ? `/api/room/${roomId}/messages?after=${lastTimestampRef.current}`
        : `/api/room/${roomId}/messages`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && data.messages.length > 0) {
        const newMsgs = (data.messages as Message[]).filter(
          (m) => !knownIdsRef.current.has(m.id)
        );
        if (newMsgs.length > 0) {
          for (const m of newMsgs) knownIdsRef.current.add(m.id);
          setMessages((prev) => [...prev, ...newMsgs]);
          lastTimestampRef.current =
            data.messages[data.messages.length - 1].timestamp;
          setTimeout(scrollToBottom, 100);
        } else if (lastTimestampRef.current === 0 && data.messages.length > 0) {
          lastTimestampRef.current =
            data.messages[data.messages.length - 1].timestamp;
        }
      }
    } catch {
      /* silent */
    } finally {
      isFetchingRef.current = false;
    }
  }, [roomId, verified]);

  useEffect(() => {
    if (!verified) return;
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [fetchMessages, verified]);

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
        appendMessage(data.message);
      }
    } catch {
      setError("发送失败");
    } finally {
      setSending(false);
    }
  };

  const sendImage = useCallback(
    async (dataUrl: string) => {
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
          appendMessage(data.message);
        } else {
          setError(data.error || "图片发送失败");
        }
      } catch {
        setError("图片发送失败");
      } finally {
        setSending(false);
      }
    },
    [roomId, nickname, appendMessage]
  );

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
              const d = ev.target?.result as string;
              if (d) sendImage(d);
            };
            reader.readAsDataURL(file);
          }
          return;
        }
      }
      const text = e.clipboardData?.getData("text");
      if (
        text &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
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
          if (data.success) appendMessage(data.message);
        } catch {
          /* ignore */
        } finally {
          setSending(false);
        }
      }
    };
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [verified, roomId, nickname, appendMessage, sendImage]);

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    for (const file of Array.from(e.dataTransfer.files)) {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const d = ev.target?.result as string;
          if (d) sendImage(d);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    for (const file of Array.from(e.target.files)) {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const d = ev.target?.result as string;
          if (d) sendImage(d);
        };
        reader.readAsDataURL(file);
      }
    }
    e.target.value = "";
  };

  // Share: generate link + password text like cloud drive
  const handleShare = async () => {
    const link = window.location.href;
    const shareText = room?.hasPassword
      ? `链接: ${link}\n口令: ${passwordInput || "(请输入口令)"}`
      : `链接: ${link}`;

    try {
      await navigator.clipboard.writeText(shareText);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = shareText;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopyId = async () => {
    try { await navigator.clipboard.writeText(roomId); } catch { /* */ }
  };

  const handleDeleteRoom = async () => {
    try {
      const res = await fetch(`/api/room/${roomId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: deletePassword }),
      });
      const data = await res.json();
      if (data.success) {
        router.push("/clipboard");
      } else {
        setDeleteError(data.error || "删除失败");
      }
    } catch {
      setDeleteError("网络错误");
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    try {
      const res = await fetch(
        `/api/room/${roomId}/messages?messageId=${msgId}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (data.success) {
        knownIdsRef.current.delete(msgId);
        setMessages((prev) => prev.filter((m) => m.id !== msgId));
      }
    } catch {
      /* silent */
    }
  };

  const handleClearMessages = async () => {
    if (!confirm("确定清空所有消息？此操作不可撤销。")) return;
    try {
      const res = await fetch(`/api/room/${roomId}/messages`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setMessages([]);
        knownIdsRef.current.clear();
        lastTimestampRef.current = 0;
      }
    } catch {
      /* silent */
    }
  };

  const handleCopyContent = async (content: string) => {
    try { await navigator.clipboard.writeText(content); } catch { /* */ }
  };

  const formatTime = (ts: number) =>
    new Date(ts).toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
    });

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">加载中...</p>
        </div>
      </div>
    );
  }

  if (error && !room) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center glass rounded-2xl p-10 max-w-md mx-4">
          <span className="text-4xl mb-4 block" role="img" aria-label="sad">😢</span>
          <h2 className="text-xl font-bold mb-2">无法进入房间</h2>
          <p className="text-slate-400 mb-6">{error}</p>
          <button onClick={() => router.push("/clipboard")} className="btn-primary">
            返回共享剪贴板
          </button>
        </div>
      </div>
    );
  }

  if (room && room.hasPassword && !verified) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
        <div className="glass rounded-2xl p-8 max-w-md w-full animate-fade-in">
          <div className="text-center mb-6">
            <span className="text-4xl mb-3 block" role="img" aria-label="lock">🔒</span>
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
          {verifyError && <p className="text-red-400 text-sm mb-4">{verifyError}</p>}
          <div className="flex gap-3">
            <button onClick={() => router.push("/clipboard")} className="btn-ghost flex-1">
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

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col">
      {/* Room header */}
      <div className="glass border-t-0 border-x-0 sticky top-16 z-40 px-4 sm:px-8 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => router.push("/clipboard")}
              className="text-slate-400 hover:text-white transition-colors shrink-0"
            >
              ←
            </button>
            <div className="min-w-0">
              <h1 className="font-bold truncate text-sm">{room?.name}</h1>
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
            <button onClick={handleShare} className="btn-ghost text-xs px-3 py-1.5" title="复制分享链接+口令">
              {copied ? "✓ 已复制" : <><span role="img" aria-label="link">🔗</span>{" 分享"}</>}
            </button>
            {messages.length > 0 && (
              <button
                onClick={handleClearMessages}
                className="btn-ghost text-xs px-3 py-1.5 text-amber-400 hover:text-amber-300"
                title="清空所有消息"
              >
                <span role="img" aria-label="clear">🧹</span>
              </button>
            )}
            {room?.hasPassword && (
              <button
                onClick={() => setShowDelete(!showDelete)}
                className="btn-ghost text-xs px-3 py-1.5 text-red-400 hover:text-red-300"
              >
                <span role="img" aria-label="delete">🗑️</span>
              </button>
            )}
          </div>
        </div>
        {/* Share toast */}
        {copied && (
          <div className="max-w-4xl mx-auto mt-2 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-xs text-indigo-300 animate-slide-up">
            {room?.hasPassword
              ? "已复制分享链接和口令到剪贴板，可直接发给好友"
              : "已复制分享链接到剪贴板"}
          </div>
        )}
        {showDelete && (
          <div className="max-w-4xl mx-auto mt-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl animate-slide-up">
            <p className="text-sm text-red-300 mb-3">删除房间将清除所有内容，不可撤销</p>
            <div className="flex gap-2">
              <input
                type="password"
                className="input-field text-sm py-2 flex-1"
                placeholder="输入房间口令确认删除..."
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
              />
              <button onClick={handleDeleteRoom} className="btn-danger text-sm">
                确认删除
              </button>
            </div>
            {deleteError && <p className="text-red-400 text-xs mt-2">{deleteError}</p>}
          </div>
        )}
      </div>

      {/* Nickname */}
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

      {/* Messages */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-8 pb-4 overflow-auto">
        {messages.length === 0 && (
          <div className="text-center py-20 text-slate-500">
            <span className="text-5xl mb-4 block" role="img" aria-label="empty">📭</span>
            <p className="text-lg">还没有内容</p>
            <p className="text-sm mt-1">粘贴文字或图片来开始分享吧</p>
          </div>
        )}
        <div className="space-y-3">
          {messages.map((msg) => (
            <div key={msg.id} className="message-enter group/msg">
              <div className="glass rounded-2xl p-4 glass-hover relative">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-indigo-400">{msg.sender}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-600">{formatTime(msg.timestamp)}</span>
                    <button
                      onClick={() => handleDeleteMessage(msg.id)}
                      className="opacity-0 group-hover/msg:opacity-100 text-xs text-slate-600
                                 hover:text-red-400 transition-all p-0.5"
                      title="删除此条"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                {msg.type === "text" ? (
                  <div className="group relative">
                    <p className="text-slate-200 whitespace-pre-wrap break-words leading-relaxed">
                      <LinkedText text={msg.content} />
                    </p>
                    <button
                      onClick={() => handleCopyContent(msg.content)}
                      className="absolute top-0 right-0 opacity-0 group-hover:opacity-100
                                 text-xs text-slate-500 hover:text-indigo-400 transition-all p-1"
                      title="复制"
                    >
                      <span role="img" aria-label="copy">📋</span>
                    </button>
                  </div>
                ) : (
                  <div className="mt-1">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={msg.content}
                      alt="shared"
                      className="max-w-full max-h-96 rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => setPreviewImage(msg.content)}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input area */}
      <div className="sticky bottom-0 glass border-b-0 border-x-0 px-4 sm:px-8 py-4">
        <div className="max-w-4xl mx-auto">
          <div
            className={`paste-zone rounded-xl p-4 mb-3 text-center cursor-pointer ${dragOver ? "dragover" : ""}`}
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
                <span className="text-indigo-400"><span role="img" aria-label="loading">⏳</span> 发送中...</span>
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

      {/* Image preview */}
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
