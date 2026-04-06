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
import { Button } from "@/components/ui/button";
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
  content: "안녕하세요! **민원 내비**입니다 🏛️\n\n무엇을 도와드릴까요?",
};

const WELCOME_CARDS = [
  {
    icon: "💬",
    title: "민원 안내",
    description: "필요 서류와 절차를 알려드려요",
  },
  {
    icon: "🏛️",
    title: "민원실 추천",
    description: "가장 한산한 곳을 찾아드려요",
  },
  {
    icon: "📍",
    title: "실시간 현황",
    description: "전국 민원실 대기 현황을 확인하세요",
  },
];

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 위치 정보 가져오기 (채팅에서 활용)
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => {
        // 위치 거부 시 무시
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
    );
  }, []);

  const isEmptyChat = messages.length <= 1; // Only welcome message

  const handleNewChat = () => {
    setMessages([WELCOME_MESSAGE]);
    setIsLoading(false);
    setActiveTab("chat");
  };

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
        body: JSON.stringify({
          messages: chatHistory,
          ...(userLocation && {
            lat: userLocation.lat,
            lng: userLocation.lng,
          }),
        }),
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
        <div className="mx-auto max-w-3xl flex items-center justify-between">
          <div className="flex items-center gap-3">
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
          {!isEmptyChat && (
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8"
              onClick={handleNewChat}
            >
              ✨ 새 대화
            </Button>
          )}
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

          {/* Welcome cards + Suggested Questions (shown only when chat is empty) */}
          {isEmptyChat && !isLoading && (
            <div className="px-4 pb-2">
              <div className="mx-auto max-w-3xl grid grid-cols-1 sm:grid-cols-3 gap-2">
                {WELCOME_CARDS.map((card) => (
                  <Card
                    key={card.title}
                    className="border border-border/50 bg-muted/30 py-0"
                  >
                    <CardContent className="px-4 py-3 text-center">
                      <div className="text-2xl mb-1">{card.icon}</div>
                      <div className="text-sm font-semibold text-foreground">
                        {card.title}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {card.description}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
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
