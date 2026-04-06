"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import ChatMessage from "@/components/ChatMessage";
import ChatInput from "@/components/ChatInput";
import SuggestedQuestions from "@/components/SuggestedQuestions";
import DashboardTab from "@/components/DashboardTab";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { OfficeWithWaiting, BusStop } from "@/lib/api-clients";

// Dynamic import for Leaflet (SSR incompatible)
const OfficeMap = dynamic(() => import("@/components/OfficeMap"), {
  ssr: false,
  loading: () => (
    <div className="mt-3 rounded-lg border border-border bg-muted/30 flex items-center justify-center h-[280px]">
      <p className="text-sm text-muted-foreground">지도 로딩 중...</p>
    </div>
  ),
});

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
  const [activeTab, setActiveTab] = useState("chat");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isEmptyChat = messages.length <= 1; // Only welcome message

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
    requestAnimationFrame(() => {
      scrollToBottom();
    });
  }, [messages, isLoading, scrollToBottom]);

  const handleSend = async (content: string) => {
    // Switch to chat tab if on dashboard
    if (activeTab !== "chat") {
      setActiveTab("chat");
    }

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

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as string)}
        className="flex-1 flex flex-col min-h-0"
      >
        <div className="shrink-0 border-b border-border bg-background">
          <div className="mx-auto max-w-3xl">
            <TabsList variant="line" className="w-full justify-start h-auto p-0">
              <TabsTrigger
                value="chat"
                className="px-4 py-2.5 text-sm"
              >
                💬 채팅
              </TabsTrigger>
              <TabsTrigger
                value="dashboard"
                className="px-4 py-2.5 text-sm"
              >
                📊 현황
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        {/* Chat Tab */}
        <TabsContent
          value="chat"
          className="flex-1 flex flex-col min-h-0 mt-0"
        >
          {/* Messages */}
          <div ref={scrollAreaRef} className="flex-1 overflow-y-auto">
            <main className="px-4 py-4">
              <div className="mx-auto max-w-3xl">
                {messages.map((msg) => (
                  <div key={msg.id}>
                    <ChatMessage
                      role={msg.role}
                      content={msg.content}
                      offices={msg.offices}
                      busStops={msg.busStops}
                    />
                    {/* Show map below assistant messages with offices */}
                    {msg.role === "assistant" &&
                      msg.offices &&
                      msg.offices.length > 0 && (
                        <div className="mb-4 ml-0 sm:ml-[calc(25%*0.15)]">
                          <div className="max-w-[85%] sm:max-w-[75%]">
                            <OfficeMap offices={msg.offices} />
                          </div>
                        </div>
                      )}
                  </div>
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
                        <span className="text-xs text-muted-foreground">
                          민원 내비
                        </span>
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

          {/* Suggested Questions (shown only when chat is empty) */}
          {isEmptyChat && !isLoading && (
            <SuggestedQuestions onSelect={handleSend} />
          )}

          {/* Input */}
          <ChatInput onSend={handleSend} disabled={isLoading} />
        </TabsContent>

        {/* Dashboard Tab */}
        <TabsContent
          value="dashboard"
          className="flex-1 overflow-y-auto mt-0"
        >
          <DashboardTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
