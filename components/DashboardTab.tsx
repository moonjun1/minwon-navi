"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { OfficeWithWaiting } from "@/lib/api-clients";

function getWaitingBadgeClasses(count: number): string {
  if (count === 0) return "bg-green-100 text-green-700 border-green-200";
  if (count <= 3) return "bg-yellow-100 text-yellow-700 border-yellow-200";
  return "bg-red-100 text-red-700 border-red-200";
}

function formatTime(t: string) {
  if (!t || t.length < 4) return t || "-";
  return `${t.slice(0, 2)}:${t.slice(2, 4)}`;
}

export default function DashboardTab() {
  const [offices, setOffices] = useState<OfficeWithWaiting[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  const fetchOffices = useCallback(async () => {
    try {
      const res = await fetch("/api/offices");
      if (res.ok) {
        const data = await res.json();
        // Sort by waiting count (ascending)
        const sorted = [...data.offices].sort(
          (a: OfficeWithWaiting, b: OfficeWithWaiting) =>
            a.totalWaiting - b.totalWaiting
        );
        setOffices(sorted);
        setLastUpdated(
          new Date().toLocaleTimeString("ko-KR", {
            hour: "2-digit",
            minute: "2-digit",
          })
        );
      }
    } catch (err) {
      console.error("Failed to fetch offices:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOffices();
    // Refresh every 30 seconds
    const interval = setInterval(fetchOffices, 30000);
    return () => clearInterval(interval);
  }, [fetchOffices]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce" />
            <div
              className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce"
              style={{ animationDelay: "0.1s" }}
            />
            <div
              className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce"
              style={{ animationDelay: "0.2s" }}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            민원실 현황을 불러오는 중...
          </p>
        </div>
      </div>
    );
  }

  if (offices.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-muted-foreground">
          현재 표시할 민원실 정보가 없습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 py-4">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">
              실시간 민원실 현황
            </h2>
            <p className="text-xs text-muted-foreground">
              대기인수 적은 순으로 정렬됩니다
            </p>
          </div>
          {lastUpdated && (
            <Badge variant="secondary" className="text-xs">
              {lastUpdated} 갱신
            </Badge>
          )}
        </div>

        {/* Office Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {offices.map((office, i) => (
            <Card
              key={i}
              size="sm"
              className={`transition-shadow hover:shadow-md ${
                i === 0
                  ? "border-blue-400 bg-blue-50 ring-blue-400"
                  : ""
              }`}
            >
              <CardHeader className="pb-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle className="truncate">
                        {office.csoNm}
                      </CardTitle>
                      {i === 0 && (
                        <Badge
                          variant="secondary"
                          className="shrink-0 bg-blue-100 text-blue-700"
                        >
                          추천
                        </Badge>
                      )}
                    </div>
                    {office.roadNmAddr && (
                      <p className="mt-1 text-xs text-muted-foreground truncate">
                        {office.roadNmAddr}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <Badge
                      variant="outline"
                      className={`text-lg font-bold px-3 py-1 h-auto ${getWaitingBadgeClasses(office.totalWaiting)}`}
                    >
                      {office.totalWaiting}명
                    </Badge>
                    <div className="text-xs text-muted-foreground mt-1">
                      대기중
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>
                    🕐 {formatTime(office.wkdyOperBgngTm)} ~{" "}
                    {formatTime(office.wkdyOperEndTm)}
                  </span>
                  {office.nghtOperYn === "Y" && (
                    <Badge
                      variant="secondary"
                      className="bg-purple-100 text-purple-700 text-[10px]"
                    >
                      야간
                    </Badge>
                  )}
                </div>
                {office.waitingInfo.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {office.waitingInfo.map((w, j) => (
                      <Badge key={j} variant="secondary" className="gap-1 text-xs">
                        {w.taskNm}
                        <span className="font-semibold text-foreground">
                          {w.wtngCnt}명
                        </span>
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
