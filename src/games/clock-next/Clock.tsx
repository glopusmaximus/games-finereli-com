// Analog clock SVG component — clean, colorful, kid-friendly

interface ClockProps {
  hour: number;    // 1-12
  minute: number;  // 0-59
  size?: number;   // px, default 240
  animate?: boolean; // smooth hand transition
}

export default function Clock({ hour, minute, size = 240, animate = false }: ClockProps) {
  const cx = 50;
  const cy = 50;

  // Hour hand: 360° / 12 hours = 30° per hour, plus minute contribution
  const hourAngle = ((hour % 12) + minute / 60) * 30 - 90;
  // Minute hand: 360° / 60 minutes = 6° per minute
  const minuteAngle = minute * 6 - 90;

  const transition = animate ? 'transform 0.6s cubic-bezier(0.34,1.56,0.64,1)' : 'none';

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.1))' }}
    >
      {/* Clock face */}
      <circle cx={cx} cy={cy} r="46" fill="white" stroke="#e0e0f0" strokeWidth="2.5" />

      {/* Hour markers — dots for non-numbered positions */}
      {Array.from({ length: 60 }, (_, i) => {
        const angle = (i * 6 - 90) * Math.PI / 180;
        const isHour = i % 5 === 0;
        const r = isHour ? 39 : 41;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        if (isHour) return null; // numbers go here instead
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r="0.5"
            fill="#d0d0e0"
          />
        );
      })}

      {/* Hour numbers */}
      {Array.from({ length: 12 }, (_, i) => {
        const num = i + 1;
        const angle = (num * 30 - 90) * Math.PI / 180;
        const r = 37;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        return (
          <text
            key={num}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="central"
            fill="#3a3a5a"
            fontSize="8"
            fontWeight="800"
            fontFamily="'Nunito', sans-serif"
          >
            {num}
          </text>
        );
      })}

      {/* Minute hand — long, thin, blue */}
      <line
        x1={cx}
        y1={cy}
        x2={cx + 30 * Math.cos(minuteAngle * Math.PI / 180)}
        y2={cy + 30 * Math.sin(minuteAngle * Math.PI / 180)}
        stroke="#45aaf2"
        strokeWidth="2"
        strokeLinecap="round"
        style={{ transition }}
      />

      {/* Hour hand — short, thick, purple */}
      <line
        x1={cx}
        y1={cy}
        x2={cx + 20 * Math.cos(hourAngle * Math.PI / 180)}
        y2={cy + 20 * Math.sin(hourAngle * Math.PI / 180)}
        stroke="#a55eea"
        strokeWidth="3.5"
        strokeLinecap="round"
        style={{ transition }}
      />

      {/* Center dot */}
      <circle cx={cx} cy={cy} r="2.5" fill="#a55eea" />
      <circle cx={cx} cy={cy} r="1.2" fill="white" />
    </svg>
  );
}
