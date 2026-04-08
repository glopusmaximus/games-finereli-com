// Analog clock SVG component — clean, colorful, kid-friendly
// Optional period prop adds sun/moon sky background

interface ClockProps {
  hour: number;    // 1-12
  minute: number;  // 0-59
  size?: number;   // px, default 240
  animate?: boolean; // smooth hand transition
  period?: 'am' | 'pm'; // adds sky background with sun/moon
}

export default function Clock({ hour, minute, size = 240, animate = false, period }: ClockProps) {
  const cx = 50;
  const cy = 50;

  const hourAngle = ((hour % 12) + minute / 60) * 30 - 90;
  const minuteAngle = minute * 6 - 90;
  const transition = animate ? 'transform 0.6s cubic-bezier(0.34,1.56,0.64,1)' : 'none';

  const isAm = period === 'am';
  const isPm = period === 'pm';

  // Colors adapt to period
  const faceColor = isAm ? '#FFFDE7' : isPm ? '#1a1a3e' : 'white';
  const strokeColor = isAm ? '#F9CA24' : isPm ? '#4b4b8a' : '#e0e0f0';
  const dotColor = isAm ? '#e0d0a0' : isPm ? '#5a5a8a' : '#d0d0e0';
  const numberColor = isAm ? '#5a4a2a' : isPm ? '#c0c0e0' : '#3a3a5a';
  const minuteHandColor = isAm ? '#FF9F43' : isPm ? '#45aaf2' : '#45aaf2';
  const hourHandColor = isAm ? '#e05050' : isPm ? '#c084fc' : '#a55eea';
  const centerColor = isAm ? '#e05050' : isPm ? '#c084fc' : '#a55eea';

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.1))' }}
    >
      {/* Sky background — only when period is set */}
      {period && (
        <circle cx={cx} cy={cy} r="48" fill={isAm ? '#E3F2FD' : '#0d0d2b'} />
      )}

      {/* Clock face */}
      <circle cx={cx} cy={cy} r="46" fill={faceColor} stroke={strokeColor} strokeWidth="2.5" />

      {/* Sun or moon icon — top of clock, outside the face */}
      {isAm && (
        <>
          {/* Sun */}
          <circle cx={cx} cy={8} r="5" fill="#F9CA24" opacity="0.9" />
          {/* Rays */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => {
            const rad = deg * Math.PI / 180;
            return (
              <line key={deg}
                x1={cx + 7 * Math.cos(rad)} y1={8 + 7 * Math.sin(rad)}
                x2={cx + 9.5 * Math.cos(rad)} y2={8 + 9.5 * Math.sin(rad)}
                stroke="#F9CA24" strokeWidth="1" strokeLinecap="round" opacity="0.7"
              />
            );
          })}
        </>
      )}
      {isPm && (
        <>
          {/* Moon crescent */}
          <circle cx={cx - 1} cy={8} r="4.5" fill="#c0c0e0" opacity="0.9" />
          <circle cx={cx + 1.5} cy={6.5} r="3.5" fill="#0d0d2b" />
          {/* Stars */}
          <circle cx={cx - 12} cy={6} r="0.8" fill="#e0e0ff" opacity="0.7" />
          <circle cx={cx + 10} cy={10} r="0.6" fill="#e0e0ff" opacity="0.5" />
          <circle cx={cx + 15} cy={5} r="0.7" fill="#e0e0ff" opacity="0.6" />
        </>
      )}

      {/* Minute dots */}
      {Array.from({ length: 60 }, (_, i) => {
        if (i % 5 === 0) return null;
        const angle = (i * 6 - 90) * Math.PI / 180;
        return (
          <circle key={i} cx={cx + 41 * Math.cos(angle)} cy={cy + 41 * Math.sin(angle)} r="0.5" fill={dotColor} />
        );
      })}

      {/* Hour numbers */}
      {Array.from({ length: 12 }, (_, i) => {
        const num = i + 1;
        const angle = (num * 30 - 90) * Math.PI / 180;
        return (
          <text key={num} x={cx + 37 * Math.cos(angle)} y={cy + 37 * Math.sin(angle)}
            textAnchor="middle" dominantBaseline="central"
            fill={numberColor} fontSize="8" fontWeight="800" fontFamily="'Nunito', sans-serif"
          >{num}</text>
        );
      })}

      {/* AM/PM label */}
      {period && (
        <text x={cx} y={cy + 14} textAnchor="middle" dominantBaseline="central"
          fill={isAm ? '#c0a040' : '#8080b0'} fontSize="5" fontWeight="800" fontFamily="'Nunito', sans-serif"
          opacity="0.7"
        >
          {isAm ? 'AM' : 'PM'}
        </text>
      )}

      {/* Minute hand */}
      <line x1={cx} y1={cy}
        x2={cx + 30 * Math.cos(minuteAngle * Math.PI / 180)}
        y2={cy + 30 * Math.sin(minuteAngle * Math.PI / 180)}
        stroke={minuteHandColor} strokeWidth="2" strokeLinecap="round" style={{ transition }}
      />

      {/* Hour hand */}
      <line x1={cx} y1={cy}
        x2={cx + 20 * Math.cos(hourAngle * Math.PI / 180)}
        y2={cy + 20 * Math.sin(hourAngle * Math.PI / 180)}
        stroke={hourHandColor} strokeWidth="3.5" strokeLinecap="round" style={{ transition }}
      />

      {/* Center dot */}
      <circle cx={cx} cy={cy} r="2.5" fill={centerColor} />
      <circle cx={cx} cy={cy} r="1.2" fill={faceColor} />
    </svg>
  );
}
