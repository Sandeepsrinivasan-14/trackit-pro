import React from 'react';

export default function DonutChart({ segments, size = 130, thickness = 22 }) {
    const r = (size - thickness) / 2;
    const cx = size / 2;
    const circumference = 2 * Math.PI * r;

    const total = segments.reduce((a, s) => a + (s.value || 0), 0);
    if (total === 0) {
        return (
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <circle cx={cx} cy={cx} r={r} fill="none" stroke="var(--bg-elevated)" strokeWidth={thickness} />
                <text x={cx} y={cx} textAnchor="middle" dominantBaseline="central"
                    fill="var(--text-muted)" fontSize="10">No data</text>
            </svg>
        );
    }

    let offset = circumference * 0.25;
    const arcs = segments.map(seg => {
        const pct = (seg.value || 0) / total;
        const dash = pct * circumference;
        const arc = { ...seg, dash, gap: circumference - dash, offset };
        offset += dash;
        return arc;
    });

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="donut-chart">
            <circle cx={cx} cy={cx} r={r} fill="none"
                stroke="var(--bg-deep)" strokeWidth={thickness} />
            {arcs.map((arc, i) => (
                arc.value > 0 && (
                    <circle key={i}
                        cx={cx} cy={cx} r={r}
                        fill="none"
                        stroke={arc.color}
                        strokeWidth={thickness}
                        strokeDasharray={`${arc.dash - 2} ${arc.gap + 2}`}
                        strokeDashoffset={-arc.offset}
                        strokeLinecap="round"
                        style={{ transition: 'stroke-dasharray .8s ease' }}
                    />
                )
            ))}
            <text x={cx} y={cx - 6} textAnchor="middle" fill="var(--text-primary)"
                fontSize="20" fontWeight="700" fontFamily="Inter, sans-serif">
                {total}
            </text>
            <text x={cx} y={cx + 12} textAnchor="middle" fill="var(--text-muted)"
                fontSize="9" fontFamily="Inter, sans-serif" letterSpacing="0.05em">
                TOTAL
            </text>
        </svg>
    );
}
