"use client";
import { useEffect, useRef, useState } from "react";
import { money, shortMoney } from "@/lib/finance";
export function FinancialChart({
  points,
  lines = ["Receitas", "Despesas"],
}: {
  points: { label: string; income: number; expense: number }[];
  lines?: [string, string];
}) {
  const [active, setActive] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [width, setWidth] = useState(840);
  useEffect(() => {
    const svg = svgRef.current!;
    const observer = new ResizeObserver(([entry]) =>
      setWidth(Math.max(300, Math.round(entry.contentRect.width))),
    );
    observer.observe(svg);
    return () => observer.disconnect();
  }, []);
  const height = width < 500 ? 220 : 250,
    left = width < 500 ? 60 : 70,
    right = 18,
    top = 24,
    bottom = 35;
  const values = points.flatMap((p) => [p.income, p.expense]),
    min = Math.min(0, ...values),
    max = Math.max(10000, ...values),
    range = max - min || 1;
  const x = (i: number) =>
      left + (i / Math.max(1, points.length - 1)) * (width - left - right),
    y = (v: number) => top + ((max - v) / range) * (height - top - bottom);
  const path = (key: "income" | "expense") =>
    points.map((p, i) => `${i ? "L" : "M"}${x(i)},${y(p[key])}`).join(" ");
  return (
    <div className="chart">
      <div className="chart-legend">
        <span>
          <i className="legend-green" />
          {lines[0]}
        </span>
        <span>
          <i className="legend-gray" />
          {lines[1]}
        </span>
      </div>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={points
          .map(
            (p) =>
              `${p.label}: ${lines[0]} ${money(p.income)}, ${lines[1]} ${money(p.expense)}`,
          )
          .join(". ")}
      >
        {Array.from({ length: 5 }, (_, i) => {
          const v = min + (range * i) / 4;
          return (
            <g key={i}>
              <line
                x1={left}
                x2={width - right}
                y1={y(v)}
                y2={y(v)}
                stroke="var(--border)"
                strokeDasharray="3 5"
              />
              <text
                x={left - 12}
                y={y(v) + 4}
                textAnchor="end"
                className="chart-label"
              >
                {shortMoney(v)}
              </text>
            </g>
          );
        })}
        <path
          d={path("expense")}
          fill="none"
          stroke="var(--chart-secondary)"
          strokeWidth="2"
          strokeDasharray="5 5"
          strokeLinejoin="round"
        />
        <path
          d={path("income")}
          fill="none"
          stroke="var(--chart-primary)"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {points.map((p, i) => (
          <g key={i}>
            <text
              x={x(i)}
              y={height - 8}
              textAnchor="middle"
              className="chart-label"
            >
              {p.label}
            </text>
            <circle
              cx={x(i)}
              cy={y(p.income)}
              r="3.5"
              fill="var(--brand)"
              stroke="var(--chart-primary)"
              strokeWidth="2"
            />
            <rect
              x={x(i) - (width - left - right) / points.length / 2}
              y={0}
              width={(width - left - right) / points.length}
              height={height}
              fill="transparent"
              tabIndex={0}
              role="img"
              aria-label={`${p.label}: ${lines[0]} ${money(p.income)}, ${lines[1]} ${money(p.expense)}`}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(null)}
              onClick={() => setActive(active === i ? null : i)}
            />
          </g>
        ))}
      </svg>
      {active !== null && (
        <div className="chart-tooltip" role="status">
          <strong>{points[active].label}</strong>
          <span>
            {lines[0]} <b>{money(points[active].income)}</b>
          </span>
          <span>
            {lines[1]} <b>{money(points[active].expense)}</b>
          </span>
        </div>
      )}
    </div>
  );
}
