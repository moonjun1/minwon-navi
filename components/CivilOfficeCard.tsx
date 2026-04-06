"use client";

import type { OfficeWithWaiting } from "@/lib/api-clients";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface CivilOfficeCardProps {
  office: OfficeWithWaiting;
  isRecommended?: boolean;
}

function getWaitingBadgeClasses(count: number): string {
  if (count === 0) return "bg-green-100 text-green-700 border-green-200";
  if (count <= 3) return "bg-yellow-100 text-yellow-700 border-yellow-200";
  return "bg-red-100 text-red-700 border-red-200";
}

export default function CivilOfficeCard({
  office,
  isRecommended,
}: CivilOfficeCardProps) {
  const formatTime = (t: string) => {
    if (!t || t.length < 4) return t || "-";
    // Handle both "0900" (4-digit) and "090000" (6-digit) formats
    return `${t.slice(0, 2)}:${t.slice(2, 4)}`;
  };

  return (
    <Card
      size="sm"
      className={`transition-shadow hover:shadow-md ${
        isRecommended
          ? "border-blue-400 bg-blue-50 ring-blue-400"
          : ""
      }`}
    >
      <CardHeader className="pb-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="truncate">{office.csoNm}</CardTitle>
              {isRecommended && (
                <Badge variant="secondary" className="shrink-0 bg-blue-100 text-blue-700">
                  추천
                </Badge>
              )}
              {office.nghtOperYn === "Y" && (
                <Badge variant="secondary" className="shrink-0 bg-purple-100 text-purple-700">
                  야간운영
                </Badge>
              )}
            </div>
            {office.roadNmAddr && (
              <p className="mt-1 text-sm text-muted-foreground truncate">
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
            <div className="text-xs text-muted-foreground mt-1">대기중</div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>
            🕐 {formatTime(office.wkdyOperBgngTm)} ~ {formatTime(office.wkdyOperEndTm)}
          </span>
        </div>

        {office.waitingInfo.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {office.waitingInfo.map((w, i) => (
              <Badge key={i} variant="secondary" className="gap-1">
                {w.taskNm}
                <span className="font-semibold text-foreground">
                  {w.wtngCnt}명
                </span>
              </Badge>
            ))}
          </div>
        )}

        {/* 길찾기 버튼 */}
        {office.lat && office.lot && (
          <div className="mt-3 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs h-8"
              onClick={() => {
                const url = `https://map.naver.com/v5/directions/-/${office.lot},${office.lat},${encodeURIComponent(office.csoNm)}/-/transit`;
                window.open(url, "_blank", "noopener,noreferrer");
              }}
            >
              🗺️ 네이버 길찾기
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs h-8"
              onClick={() => {
                const url = `https://map.kakao.com/link/to/${encodeURIComponent(office.csoNm)},${office.lat},${office.lot}`;
                window.open(url, "_blank", "noopener,noreferrer");
              }}
            >
              🚕 카카오 길찾기
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
