"use client";

import type { OfficeWithWaiting } from "@/lib/api-clients";
import type { BusStop } from "@/lib/api-clients";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import CivilOfficeCard from "./CivilOfficeCard";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  offices?: OfficeWithWaiting[];
  busStops?: BusStop[];
}

function renderMarkdown(text: string) {
  // Simple markdown: **bold**, newlines, - list items
  const lines = text.split("\n");
  return lines.map((line, i) => {
    // Bold
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    const rendered = parts.map((part, j) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={j} className="font-semibold">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return <span key={j}>{part}</span>;
    });

    if (line.trim().startsWith("- ")) {
      return (
        <li key={i} className="ml-4 list-disc">
          {rendered}
        </li>
      );
    }

    if (line.trim() === "") {
      return <br key={i} />;
    }

    return (
      <p key={i} className="leading-relaxed">
        {rendered}
      </p>
    );
  });
}

export default function ChatMessage({
  role,
  content,
  offices,
  busStops,
}: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div
        className={`max-w-[85%] sm:max-w-[75%] ${
          isUser ? "order-2" : "order-1"
        }`}
      >
        {/* Avatar */}
        <div
          className={`flex items-center gap-2 mb-1 ${
            isUser ? "flex-row-reverse" : ""
          }`}
        >
          <Avatar size="sm">
            <AvatarFallback
              className={
                isUser
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }
            >
              {isUser ? "👤" : "🏛️"}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs text-muted-foreground">
            {isUser ? "나" : "민원 내비"}
          </span>
        </div>

        {/* Message bubble */}
        {isUser ? (
          <div className="rounded-2xl rounded-tr-md bg-primary text-primary-foreground px-4 py-3">
            <div className="text-sm space-y-1">{renderMarkdown(content)}</div>
          </div>
        ) : (
          <Card className="rounded-2xl rounded-tl-md border-none bg-muted/50 py-0">
            <CardContent className="px-4 py-3">
              <div className="text-sm space-y-1 text-foreground">
                {renderMarkdown(content)}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Civil office cards */}
        {!isUser && offices && offices.length > 0 && (
          <div className="mt-3 space-y-2">
            <p className="text-xs font-medium text-muted-foreground px-1">
              🏛️ 민원실 실시간 현황
            </p>
            {offices.slice(0, 5).map((office, i) => (
              <CivilOfficeCard
                key={i}
                office={office}
                isRecommended={i === 0}
              />
            ))}
          </div>
        )}

        {/* Bus stops */}
        {!isUser && busStops && busStops.length > 0 && (
          <div className="mt-3">
            <p className="text-xs font-medium text-muted-foreground px-1 mb-2">
              🚌 근처 버스 정류소
            </p>
            <div className="space-y-1">
              {busStops.slice(0, 3).map((stop, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-sm"
                >
                  <span className="text-green-600 font-medium">
                    {stop.psNm}
                  </span>
                  {stop.rteNo && (
                    <span className="text-xs text-green-500">
                      ({stop.rteNo})
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
