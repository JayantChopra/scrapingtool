"use client";

import { useState } from "react";
// @ts-expect-error — raw JS module from react-canada-map
import drawDetails from "@/data/canada-svg-details";
import provincesData from "@/data/canada-provinces.json";

interface ProvinceData {
  code: string;
  name: string;
  count: number;
}

interface CanadaMapProps {
  provinces: ProvinceData[];
  maxCount: number;
}

const PROVINCE_COLORS: Record<string, { base: string; hover: string }> = {
  BC: { base: "#a8c4e0", hover: "#7fa8d0" },
  AB: { base: "#5a5e6e", hover: "#6f7382" },
  SK: { base: "#2a9d8f", hover: "#3ab8a8" },
  MB: { base: "#f5cdb6", hover: "#f0b89a" },
  ON: { base: "#e68a52", hover: "#d97a3e" },
  QC: { base: "#5b8cc4", hover: "#4a7ab8" },
  NB: { base: "#6b2737", hover: "#853248" },
  NS: { base: "#d4455a", hover: "#c43a4e" },
  PE: { base: "#d4455a", hover: "#c43a4e" },
  NL: { base: "#8fbf8f", hover: "#7aad7a" },
  YT: { base: "#7b5ea7", hover: "#9070c0" },
  NT: { base: "#f0a830", hover: "#e09820" },
  NU: { base: "#d44c72", hover: "#c03a60" },
};

function getProvinceColor(code: string, count: number, max: number, isHovered: boolean): string {
  if (count === 0) {
    const colors = PROVINCE_COLORS[code];
    if (!colors) return isHovered ? "#4a5568" : "#374151";
    // Desaturated version when no data
    return isHovered ? colors.hover + "80" : colors.base + "60";
  }
  const colors = PROVINCE_COLORS[code];
  if (!colors) return isHovered ? "#818cf8" : "#6366f1";
  return isHovered ? colors.hover : colors.base;
}

const typedData = provincesData as Record<string, { name: string; dimensions: string; use?: string }>;

export default function CanadaMap({ provinces, maxCount }: CanadaMapProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  const dataMap = new Map(provinces.map((p) => [p.code, p]));

  return (
    <div className="relative">
      <svg
        viewBox="-24500 -15050 55700 32000"
        className="w-full h-auto"
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
      >
        {drawDetails()}

        {Object.entries(typedData).map(([code, info]) => {
          const province = dataMap.get(code);
          const count = province?.count ?? 0;
          const isHovered = hovered === code;

          return (
            <g
              key={code}
              id={code}
              onMouseEnter={() => setHovered(code)}
              onMouseLeave={() => setHovered(null)}
              className="cursor-pointer"
            >
              <path
                d={info.dimensions}
                fill={getProvinceColor(code, count, maxCount, isHovered)}
                mask="url(#all)"
                className="transition-colors duration-200"
              >
                <title>{info.name}</title>
              </path>
              {info.use && (
                <use xlinkHref={info.use} fill={getProvinceColor(code, count, maxCount, isHovered)} />
              )}
            </g>
          );
        })}
      </svg>

      {/* Tooltip */}
      {hovered && (
        <div className="absolute top-4 right-4 bg-gray-800/90 backdrop-blur-sm border border-gray-700 rounded-xl px-4 py-3 shadow-xl">
          <p className="text-sm font-semibold text-white">
            {dataMap.get(hovered)?.name ?? typedData[hovered]?.name ?? hovered}
          </p>
          <p className="text-2xl font-bold text-indigo-400 mt-0.5">
            {dataMap.get(hovered)?.count ?? 0}
            <span className="text-xs font-normal text-gray-400 ml-1.5">leads</span>
          </p>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center justify-center gap-5 mt-3 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm opacity-40" style={{ background: "#6b7280" }} /> No data
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm" style={{ background: "#5b8cc4" }} /> Has leads
        </span>
      </div>
    </div>
  );
}
