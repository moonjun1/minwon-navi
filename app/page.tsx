"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import ChatMessage from "@/components/ChatMessage";
import ChatInput from "@/components/ChatInput";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import type { OfficeWithWaiting, BusStop } from "@/lib/api-clients";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  offices?: OfficeWithWaiting[];
  busStops?: BusStop[];
}

const WELCOME_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  content:
    "안녕하세요! **민원 내비**입니다. 🏛️\n\n" +
    "민원에 대해 궁금한 점을 물어보세요!\n\n" +
    "예를 들어:\n" +
    '- "전입신고 하려는데 뭐가 필요해?"\n' +
    '- "여권 재발급 서류 알려줘"\n' +
    '- "주민등록등본 발급하려면?"\n\n' +
    "필요 서류 안내부터 실시간 민원실 대기현황까지 한번에 알려드립니다!",
};

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    const container = scrollAreaRef.current;
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth",
      });
    }
  }, []);

  useEffect(() => {
    // Use requestAnimationFrame to ensure DOM has updated before scrolling
    requestAnimationFrame(() => {
      scrollToBottom();
    });
  }, [messages, isLoading, scrollToBottom]);

  const handleSend = async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const chatHistory = messages
        .filter((m) => m.id !== "welcome")
        .map((m) => ({ role: m.role, content: m.content }));
      chatHistory.push({ role: "user", content });

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: chatHistory }),
      });

      if (!res.ok) {
        throw new Error("API request failed");
      }

      const data = await res.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.message,
        offices: data.offices,
        busStops: data.busStops,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "죄송합니다. 일시적인 오류가 발생했습니다. 다시 시도해주세요.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="shrink-0 border-b border-border bg-background px-4 py-3">
        <div className="mx-auto max-w-3xl flex items-center gap-3">
          <Avatar size="lg">
            <AvatarFallback className="bg-primary text-primary-foreground text-xl">
              🏛️
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-lg font-bold text-foreground">민원 내비</h1>
            <p className="text-xs text-muted-foreground">
              AI 민원 안내 서비스
            </p>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div ref={scrollAreaRef} className="flex-1 overflow-y-auto">
        <main className="px-4 py-4">
          <div className="mx-auto max-w-3xl">
            {messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                role={msg.role}
                content={msg.content}
                offices={msg.offices}
                busStops={msg.busStops}
              />
            ))}
            {isLoading && (
              <div className="flex justify-start mb-4">
                <div className="max-w-[75%]">
                  <div className="flex items-center gap-2 mb-1">
                    <Avatar size="sm">
                      <AvatarFallback className="bg-muted text-muted-foreground">
                        🏛️
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground">민원 내비</span>
                  </div>
                  <Card className="rounded-2xl rounded-tl-md border-none bg-muted/50 py-0">
                    <CardContent className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" />
                        <div
                          className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        />
                        <div
                          className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </main>
      </div>

      {/* Input */}
      <ChatInput onSend={handleSend} disabled={isLoading} />
    </div>
  );
}
