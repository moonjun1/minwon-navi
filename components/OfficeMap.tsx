"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { OfficeWithWaiting } from "@/lib/api-clients";

interface OfficeMapProps {
  offices: OfficeWithWaiting[];
}

function getMarkerColor(waitingCount: number): string {
  if (waitingCount === 0) return "#22c55e"; // green
  if (waitingCount <= 3) return "#eab308"; // yellow
  return "#ef4444"; // red
}

function createCustomIcon(waitingCount: number) {
  const color = getMarkerColor(waitingCount);
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: ${color};
      border: 3px solid white;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 11px;
    ">${waitingCount}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
}

export default function OfficeMap({ offices }: OfficeMapProps) {
  // Filter offices with valid coordinates
  const validOffices = offices.filter((o) => {
    const lat = parseFloat(o.lat);
    const lng = parseFloat(o.lot);
    return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
  });

  if (validOffices.length === 0) return null;

  // Calculate center from all offices
  const avgLat =
    validOffices.reduce((sum, o) => sum + parseFloat(o.lat), 0) /
    validOffices.length;
  const avgLng =
    validOffices.reduce((sum, o) => sum + parseFloat(o.lot), 0) /
    validOffices.length;

  // Fix Leaflet default icon issue in Next.js
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
      iconUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
      shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    });
  }, []);

  return (
    <div className="mt-3 rounded-lg overflow-hidden border border-border">
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 text-xs text-muted-foreground">
        <span>🗺️ 민원실 위치</span>
        <span className="ml-auto flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500" />
            0명
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-yellow-500" />
            1-3명
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500" />
            4명+
          </span>
        </span>
      </div>
      <MapContainer
        center={[avgLat, avgLng]}
        zoom={13}
        style={{ height: "280px", width: "100%" }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {validOffices.map((office, i) => (
          <Marker
            key={i}
            position={[parseFloat(office.lat), parseFloat(office.lot)]}
            icon={createCustomIcon(office.totalWaiting)}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-bold text-base">{office.csoNm}</p>
                {office.roadNmAddr && (
                  <p className="text-gray-600 mt-1">{office.roadNmAddr}</p>
                )}
                <p className="mt-1">
                  <span className="font-semibold">대기인수:</span>{" "}
                  <span
                    style={{ color: getMarkerColor(office.totalWaiting) }}
                    className="font-bold"
                  >
                    {office.totalWaiting}명
                  </span>
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
