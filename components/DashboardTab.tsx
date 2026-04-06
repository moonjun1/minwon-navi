"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { OfficeWithWaiting } from "@/lib/api-clients";
import { haversine } from "@/lib/haversine";

const MAX_NEARBY = 10;

// 지역별 대표 좌표
const REGIONS: Record<string, { label: string; lat: number; lng: number }> = {
  seoul: { label: "서울", lat: 37.5665, lng: 126.978 },
  busan: { label: "부산", lat: 35.1796, lng: 129.0756 },
  daegu: { label: "대구", lat: 35.8714, lng: 128.6014 },
  incheon: { label: "인천", lat: 37.4563, lng: 126.7052 },
  gwangju: { label: "광주", lat: 35.1595, lng: 126.8526 },
  daejeon: { label: "대전", lat: 36.3504, lng: 127.3845 },
  ulsan: { label: "울산", lat: 35.5384, lng: 129.3114 },
  sejong: { label: "세종", lat: 36.48, lng: 127.2589 },
  gyeonggi: { label: "경기", lat: 37.4138, lng: 127.5183 },
  gangwon: { label: "강원", lat: 37.8228, lng: 128.1555 },
  chungbuk: { label: "충북", lat: 36.6357, lng: 127.4913 },
  chungnam: { label: "충남", lat: 36.5184, lng: 126.8 },
  jeonbuk: { label: "전북", lat: 35.7175, lng: 127.153 },
  jeonnam: { label: "전남", lat: 34.8161, lng: 126.4629 },
  gyeongbuk: { label: "경북", lat: 36.4919, lng: 128.8889 },
  gyeongnam: { label: "경남", lat: 35.4606, lng: 128.2132 },
  jeju: { label: "제주", lat: 33.4996, lng: 126.5312 },
};

type LocationState =
  | { type: "loading" }
  | { type: "located"; lat: number; lng: number }
  | { type: "denied" }
  | { type: "region"; key: string; lat: number; lng: number };

function getWaitingBadgeClasses(count: number): string {
  if (count === 0) return "bg-green-100 text-green-700 border-green-200";
  if (count <= 3) return "bg-yellow-100 text-yellow-700 border-yellow-200";
  return "bg-red-100 text-red-700 border-red-200";
}

function formatTime(t: string) {
  if (!t || t.length < 4) return t || "-";
  return `${t.slice(0, 2)}:${t.slice(2, 4)}`;
}

function formatDistance(km: number): string {
  if (km < 1) return `약 ${Math.round(km * 1000)}m`;
  return `약 ${km.toFixed(1)}km`;
}

interface OfficeWithDistance extends OfficeWithWaiting {
  distance: number;
}

function sortByDistance(
  offices: OfficeWithWaiting[],
  lat: number,
  lng: number
): OfficeWithDistance[] {
  return offices
    .map((office) => {
      const oLat = parseFloat(office.lat);
      const oLng = parseFloat(office.lot);
      const distance =
        isNaN(oLat) || isNaN(oLng) ? Infinity : haversine(lat, lng, oLat, oLng);
      return { ...office, distance };
    })
    .sort((a, b) => a.distance - b.distance)
    .slice(0, MAX_NEARBY);
}

export default function DashboardTab() {
  const [allOffices, setAllOffices] = useState<OfficeWithWaiting[]>([]);
  const [nearbyOffices, setNearbyOffices] = useState<OfficeWithDistance[]>([]);
  const [location, setLocation] = useState<LocationState>({ type: "loading" });
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  // Geolocation 요청
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocation({ type: "denied" });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          type: "located",
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => {
        setLocation({ type: "denied" });
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
    );
  }, []);

  const fetchOffices = useCallback(async () => {
    try {
      const res = await fetch("/api/offices");
      if (res.ok) {
        const data = await res.json();
        setAllOffices(data.offices || []);
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
    const interval = setInterval(fetchOffices, 30000);
    return () => clearInterval(interval);
  }, [fetchOffices]);

  // 위치 또는 민원실 데이터 변경 시 정렬
  useEffect(() => {
    if (allOffices.length === 0) return;

    if (location.type === "located" || location.type === "region") {
      setNearbyOffices(sortByDistance(allOffices, location.lat, location.lng));
    } else if (location.type === "denied") {
      // 위치 거부 시 대기인수 적은 순 전체 표시 (기존 동작 유지 but limited)
      const sorted = [...allOffices]
        .sort((a, b) => a.totalWaiting - b.totalWaiting)
        .slice(0, MAX_NEARBY)
        .map((o) => ({ ...o, distance: -1 }));
      setNearbyOffices(sorted);
    }
  }, [allOffices, location]);

  const handleRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const key = e.target.value;
    if (key === "") return;
    const region = REGIONS[key];
    setLocation({ type: "region", key, lat: region.lat, lng: region.lng });
  };

  if (loading || location.type === "loading") {
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
            {location.type === "loading"
              ? "위치를 확인하는 중..."
              : "민원실 현황을 불러오는 중..."}
          </p>
        </div>
      </div>
    );
  }

  if (nearbyOffices.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-muted-foreground">
          현재 표시할 민원실 정보가 없습니다.
        </p>
      </div>
    );
  }

  const isGeo = location.type === "located";
  const isRegion = location.type === "region";
  const showDistance = isGeo || isRegion;

  return (
    <div className="px-4 py-4">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">
              {isGeo ? "📍 내 주변 민원실" : "📊 실시간 민원실 현황"}
            </h2>
            <p className="text-xs text-muted-foreground">
              {isGeo
                ? "가까운 순으로 정렬됩니다"
                : isRegion
                  ? `${REGIONS[location.key].label} 지역 기준`
                  : "대기인수 적은 순으로 정렬됩니다"}
            </p>
          </div>
          {lastUpdated && (
            <Badge variant="secondary" className="text-xs shrink-0">
              {lastUpdated} 갱신
            </Badge>
          )}
        </div>

        {/* 위치 거부 시 지역 선택 */}
        {(location.type === "denied" || location.type === "region") && (
          <div className="mb-4">
            <select
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              onChange={handleRegionChange}
              value={isRegion ? location.key : ""}
            >
              <option value="">지역을 선택하세요</option>
              {Object.entries(REGIONS).map(([key, { label }]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Office Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {nearbyOffices.map((office, i) => (
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
                      {showDistance && office.distance >= 0 && (
                        <Badge
                          variant="outline"
                          className="shrink-0 text-xs"
                        >
                          {formatDistance(office.distance)}
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
