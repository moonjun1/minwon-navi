"use client";

import type { OfficeWithWaiting } from "@/lib/api-clients";

interface CivilOfficeCardProps {
  office: OfficeWithWaiting;
  isRecommended?: boolean;
}

export default function CivilOfficeCard({
  office,
  isRecommended,
}: CivilOfficeCardProps) {
  const formatTime = (t: string) => {
    if (!t || t.length < 4) return t || "-";
    return `${t.slice(0, 2)}:${t.slice(2, 4)}`;
  };

  return (
    <div
      className={`rounded-xl border p-4 transition-shadow hover:shadow-md ${
        isRecommended
          ? "border-blue-400 bg-blue-50"
          : "border-gray-200 bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-gray-900 truncate">
              {office.csoNm}
            </h3>
            {isRecommended && (
              <span className="shrink-0 inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                추천
              </span>
            )}
            {office.nghtOpnYn === "Y" && (
              <span className="shrink-0 inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                야간운영
              </span>
            )}
          </div>
          {office.rdnmAdr && (
            <p className="mt-1 text-sm text-gray-500 truncate">
              {office.rdnmAdr}
            </p>
          )}
        </div>
        <div className="shrink-0 text-right">
          <div className="text-2xl font-bold text-gray-900">
            {office.totalWaiting}
            <span className="text-sm font-normal text-gray-500 ml-0.5">명</span>
          </div>
          <div className="text-xs text-gray-400">대기중</div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
        <span>
          🕐 {formatTime(office.opnBgngTm)} ~ {formatTime(office.opnEndTm)}
        </span>
      </div>

      {office.waitingInfo.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {office.waitingInfo.map((w, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-600"
            >
              {w.taskNm}
              <span className="font-semibold text-gray-900">
                {w.wtngCnt}명
              </span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
