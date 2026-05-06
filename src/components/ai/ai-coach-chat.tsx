"use client";

import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Send, X, Sparkles, Loader2, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const STARTER_PROMPTS = [
  "What should I focus on this week?",
  "Explain my 360 results to me",
  "How do I improve my lowest EQ domain?",
  "What do my personality traits say about my work style?",
];

function ChatBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className={cn("flex gap-2.5", isUser ? "flex-row-reverse" : "flex-row")}
    >
      {!isUser && (
        <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 shadow-[0_0_12px_rgba(6,182,212,0.4)]">
          <Sparkles className="size-3.5 text-white" />
        </div>
      )}
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
          isUser
            ? "bg-cyan-500/15 text-cyan-50 border border-cyan-500/20 rounded-tr-sm"
            : "bg-white/[0.06] text-white/90 border border-white/10 rounded-tl-sm",
        )}
      >
        {msg.content}
      </div>
    </motion.div>
  );
}

export function AiCoachChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hi! I'm your AI development coach. I can help you understand your assessment results, suggest focus areas, or answer questions about your growth journey. What's on your mind?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showStarters, setShowStarters] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function send(text?: string) {
    const messageText = (text ?? input).trim();
    if (!messageText || loading) return;

    setInput("");
    setShowStarters(false);

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: messageText,
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const history = messages
        .filter((m) => m.id !== "welcome")
        .slice(-6)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/app/ai-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageText, history }),
      });

      if (!res.ok) throw new Error("Request failed");
      const data = await res.json() as { reply: string };

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.reply,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Sorry, I had trouble connecting. Please try again in a moment.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Floating trigger button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            key="chat-trigger"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            type="button"
            onClick={() => setOpen(true)}
            id="ai-coach-open-btn"
            aria-label="Open AI coach"
            className={cn(
              "fixed right-4 z-50 flex items-center gap-2 rounded-full",
              "bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] lg:bottom-6 lg:right-6",
              "bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-3 text-white",
              "shadow-[0_0_32px_rgba(6,182,212,0.35)] hover:shadow-[0_0_48px_rgba(6,182,212,0.50)]",
              "transition-all duration-200 hover:scale-105 active:scale-95",
            )}
          >
            <Sparkles className="size-4" />
            <span className="text-sm font-medium">AI Coach</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="chat-panel"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "fixed right-3 z-50 flex w-[min(380px,calc(100vw-1.5rem))] flex-col",
              "bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] lg:bottom-6 lg:right-6",
              "overflow-hidden rounded-2xl border border-cyan-500/25",
              "bg-[#0A0A0E] shadow-[0_32px_80px_rgba(0,0,0,0.7),0_0_60px_rgba(6,182,212,0.12)]",
            )}
            style={{ height: "min(480px,calc(100dvh-12rem))" }}
          >
            {/* Header */}
            <div className="ai-aurora-bg relative flex items-center gap-3 border-b border-white/10 px-4 py-3">
              <div className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 shadow-[0_0_16px_rgba(6,182,212,0.5)]">
                <Sparkles className="size-4 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white/95">AI Development Coach</p>
                <p className="text-[10px] text-cyan-400/80">Powered by DeepSeek</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close chat"
                className="flex size-7 items-center justify-center rounded-lg text-white/40 transition-colors hover:bg-white/[0.08] hover:text-white/80"
              >
                <ChevronDown className="size-4" />
              </button>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex flex-1 flex-col gap-3 overflow-y-auto p-4"
              style={{ scrollbarWidth: "none" }}
            >
              {messages.map((msg) => (
                <ChatBubble key={msg.id} msg={msg} />
              ))}

              {loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2.5"
                >
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600">
                    <Loader2 className="size-3.5 animate-spin text-white" />
                  </div>
                  <div className="flex gap-1 rounded-2xl rounded-tl-sm border border-white/10 bg-white/[0.06] px-3.5 py-2.5">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="block size-1.5 animate-bounce rounded-full bg-white/40"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Starter prompts */}
              {showStarters && messages.length === 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-1 flex flex-wrap gap-2"
                >
                  {STARTER_PROMPTS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => send(p)}
                      className={cn(
                        "rounded-full border border-cyan-500/25 bg-cyan-500/5 px-3 py-1 text-xs",
                        "text-cyan-300/80 transition-all hover:border-cyan-400/40 hover:bg-cyan-500/10 hover:text-cyan-200",
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </motion.div>
              )}
            </div>

            {/* Input */}
            <form
              onSubmit={(e) => { e.preventDefault(); void send(); }}
              className="flex items-center gap-2 border-t border-white/10 p-3"
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask your coach…"
                maxLength={500}
                disabled={loading}
                id="ai-coach-input"
                className={cn(
                  "flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm",
                  "text-white/90 placeholder:text-white/30 outline-none",
                  "focus:border-cyan-500/40 focus:bg-white/[0.06] transition-colors",
                  "disabled:opacity-50",
                )}
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                id="ai-coach-send-btn"
                aria-label="Send message"
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-xl transition-all",
                  "bg-gradient-to-br from-cyan-500 to-blue-600 text-white",
                  "disabled:opacity-35 disabled:cursor-not-allowed",
                  "hover:shadow-[0_0_16px_rgba(6,182,212,0.4)] active:scale-95",
                )}
              >
                <Send className="size-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
