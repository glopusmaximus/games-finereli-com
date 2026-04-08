import { useState, useCallback, useRef } from 'react';
import Clock from './Clock';

type Level = 1 | 2 | 3 | 4;

const STORAGE_KEY_LEVEL = 'readOClockLevel';
const STORAGE_KEY_STARS = 'readOClockStars';
const ROUNDS = 10;

const HOUR_WORDS: Record<number, string> = {
  1: 'one', 2: 'two', 3: 'three', 4: 'four', 5: 'five', 6: 'six',
  7: 'seven', 8: 'eight', 9: 'nine', 10: 'ten', 11: 'eleven', 12: 'twelve',
};

const ENCOURAGEMENTS = [
  'Hmm, not that one!',
  'Almost! Try again',
  'Keep going!',
  'So close!',
  'Try another one!',
];

// --- Activities for Levels 3 & 4 ---

interface Activity {
  name: string;
  emoji: string;
  hour: number;   // 1-12
  period: 'am' | 'pm';
}

const ACTIVITIES: Activity[] = [
  { name: 'Wake up', emoji: '🌅', hour: 7, period: 'am' },
  { name: 'Breakfast', emoji: '🥣', hour: 8, period: 'am' },
  { name: 'Kindergarten', emoji: '🏫', hour: 9, period: 'am' },
  { name: 'Snack', emoji: '🍎', hour: 11, period: 'am' },
  { name: 'Home', emoji: '🏠', hour: 2, period: 'pm' },
  { name: 'Lunch', emoji: '🍽️', hour: 3, period: 'pm' },
  { name: 'Playground', emoji: '🛝', hour: 4, period: 'pm' },
  { name: 'Dinner', emoji: '🍕', hour: 7, period: 'pm' },
  { name: 'TV', emoji: '📺', hour: 8, period: 'pm' },
  { name: 'Reading', emoji: '📖', hour: 9, period: 'pm' },
  { name: 'Sleep', emoji: '😴', hour: 10, period: 'pm' },
];

// --- Helpers ---

function getStored(key: string, fallback: string): string {
  try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
}
function setStored(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch { /* noop */ }
}

function getStoredLevel(): Level {
  const v = parseInt(getStored(STORAGE_KEY_LEVEL, '1'), 10);
  return (v >= 1 && v <= 4 ? v : 1) as Level;
}

function getStoredStars(): number {
  return parseInt(getStored(STORAGE_KEY_STARS, '0'), 10) || 0;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function wrongHours(correct: number, count: number): number[] {
  const pool = Array.from({ length: 12 }, (_, i) => i + 1).filter(h => h !== correct);
  return shuffle(pool).slice(0, count);
}

function formatHourText(hour: number): string {
  return `${HOUR_WORDS[hour]} o'clock`;
}

function generateHourRounds(): number[] {
  return shuffle(Array.from({ length: 12 }, (_, i) => i + 1)).slice(0, ROUNDS);
}

function generateActivityRounds(): number[] {
  // Return indices into ACTIVITIES, pick 10 of 11
  return shuffle(Array.from({ length: ACTIVITIES.length }, (_, i) => i)).slice(0, ROUNDS);
}

function wrongActivities(correctIdx: number, count: number): number[] {
  const pool = Array.from({ length: ACTIVITIES.length }, (_, i) => i).filter(i => i !== correctIdx);
  return shuffle(pool).slice(0, count);
}

// --- Draggable Clock ---

interface DraggableClockProps {
  size: number;
  selectedHour: number;
  onHourChange: (hour: number) => void;
  period?: 'am' | 'pm';
}

function DraggableClock({ size, selectedHour, onHourChange, period }: DraggableClockProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);

  const isAm = period === 'am';
  const isPm = period === 'pm';
  const faceColor = isAm ? '#FFFDE7' : isPm ? '#1a1a3e' : 'white';
  const strokeColor = isAm ? '#F9CA24' : isPm ? '#4b4b8a' : '#e0e0f0';
  const dotColor = isAm ? '#e0d0a0' : isPm ? '#5a5a8a' : '#d0d0e0';
  const numberColor = isAm ? '#5a4a2a' : isPm ? '#c0c0e0' : '#3a3a5a';
  const minuteHandColor = isAm ? '#FF9F43' : isPm ? '#45aaf2' : '#45aaf2';
  const hourHandColor = isAm ? '#e05050' : isPm ? '#c084fc' : '#a55eea';
  const centerColor = isAm ? '#e05050' : isPm ? '#c084fc' : '#a55eea';

  const getHourFromPosition = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    const x = clientX - rect.left - rect.width / 2;
    const y = clientY - rect.top - rect.height / 2;
    let angle = Math.atan2(y, x) * 180 / Math.PI + 90;
    if (angle < 0) angle += 360;
    let hour = Math.round(angle / 30);
    if (hour === 0) hour = 12;
    return hour;
  }, []);

  const handleStart = useCallback((clientX: number, clientY: number) => {
    dragging.current = true;
    const h = getHourFromPosition(clientX, clientY);
    if (h) onHourChange(h);
  }, [getHourFromPosition, onHourChange]);

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!dragging.current) return;
    const h = getHourFromPosition(clientX, clientY);
    if (h) onHourChange(h);
  }, [getHourFromPosition, onHourChange]);

  const handleEnd = useCallback(() => { dragging.current = false; }, []);

  const cx = 50;
  const cy = 50;
  const hourAngle = ((selectedHour % 12) * 30 - 90) * Math.PI / 180;
  const handX = cx + 20 * Math.cos(hourAngle);
  const handY = cy + 20 * Math.sin(hourAngle);

  return (
    <svg ref={svgRef} viewBox="0 0 100 100" width={size} height={size}
      style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.1))', cursor: 'pointer', touchAction: 'none' }}
      onPointerDown={e => { e.preventDefault(); handleStart(e.clientX, e.clientY); }}
      onPointerMove={e => handleMove(e.clientX, e.clientY)}
      onPointerUp={handleEnd} onPointerLeave={handleEnd}
    >
      {/* Sky ring */}
      {period && <circle cx={cx} cy={cy} r="48" fill={isAm ? '#E3F2FD' : '#0d0d2b'} />}

      <circle cx={cx} cy={cy} r="46" fill={faceColor} stroke={strokeColor} strokeWidth="2.5" />

      {/* Sun/moon */}
      {isAm && (
        <>
          <circle cx={cx} cy={8} r="5" fill="#F9CA24" opacity="0.9" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => {
            const rad = deg * Math.PI / 180;
            return <line key={deg} x1={cx + 7 * Math.cos(rad)} y1={8 + 7 * Math.sin(rad)}
              x2={cx + 9.5 * Math.cos(rad)} y2={8 + 9.5 * Math.sin(rad)}
              stroke="#F9CA24" strokeWidth="1" strokeLinecap="round" opacity="0.7" />;
          })}
        </>
      )}
      {isPm && (
        <>
          <circle cx={cx - 1} cy={8} r="4.5" fill="#c0c0e0" opacity="0.9" />
          <circle cx={cx + 1.5} cy={6.5} r="3.5" fill="#0d0d2b" />
          <circle cx={cx - 12} cy={6} r="0.8" fill="#e0e0ff" opacity="0.7" />
          <circle cx={cx + 10} cy={10} r="0.6" fill="#e0e0ff" opacity="0.5" />
          <circle cx={cx + 15} cy={5} r="0.7" fill="#e0e0ff" opacity="0.6" />
        </>
      )}

      {/* Minute dots */}
      {Array.from({ length: 60 }, (_, i) => {
        if (i % 5 === 0) return null;
        const angle = (i * 6 - 90) * Math.PI / 180;
        return <circle key={i} cx={cx + 41 * Math.cos(angle)} cy={cy + 41 * Math.sin(angle)} r="0.5" fill={dotColor} />;
      })}
      {/* Hour numbers */}
      {Array.from({ length: 12 }, (_, i) => {
        const num = i + 1;
        const a = (num * 30 - 90) * Math.PI / 180;
        return <text key={num} x={cx + 37 * Math.cos(a)} y={cy + 37 * Math.sin(a)}
          textAnchor="middle" dominantBaseline="central"
          fill={numberColor} fontSize="8" fontWeight="800" fontFamily="'Nunito', sans-serif"
        >{num}</text>;
      })}
      {/* AM/PM label */}
      {period && (
        <text x={cx} y={cy + 14} textAnchor="middle" dominantBaseline="central"
          fill={isAm ? '#c0a040' : '#8080b0'} fontSize="5" fontWeight="800" fontFamily="'Nunito', sans-serif" opacity="0.7"
        >{isAm ? 'AM' : 'PM'}</text>
      )}
      {/* Minute hand — at 12 */}
      <line x1={cx} y1={cy} x2={cx} y2={cy - 30}
        stroke={minuteHandColor} strokeWidth="2" strokeLinecap="round" />
      {/* Hour hand — draggable */}
      <line x1={cx} y1={cy} x2={handX} y2={handY}
        stroke={hourHandColor} strokeWidth="3.5" strokeLinecap="round" />
      <circle cx={handX} cy={handY} r="8" fill="transparent" />
      <circle cx={cx} cy={cy} r="2.5" fill={centerColor} />
      <circle cx={cx} cy={cy} r="1.2" fill={faceColor} />
      <circle cx={handX} cy={handY} r="4" fill={hourHandColor} opacity="0.15" />
    </svg>
  );
}

// --- Option Button (reusable for levels 2 and 4) ---

interface OptionButtonProps {
  label: string;
  isEliminated: boolean;
  isCorrect: boolean;
  state: GameState;
  onClick: () => void;
  animDelay: number;
}

function OptionButton({ label, isEliminated, isCorrect, state, onClick, animDelay }: OptionButtonProps) {
  if (isEliminated) return (
    <button disabled style={{
      background: '#f8f8fc', border: '2.5px solid #e8e8f0', borderRadius: '14px',
      padding: '14px 20px', fontSize: 'clamp(1.1rem, 3.5vw, 1.4rem)', fontWeight: 800,
      fontFamily: 'inherit', color: '#ccc', cursor: 'default', textAlign: 'center',
      textDecoration: 'line-through', opacity: 0.5,
    }}>
      {label}
    </button>
  );

  const isCorrectAndSelected = state === 'correct' && isCorrect;

  return (
    <button
      onClick={onClick}
      disabled={state === 'correct'}
      style={{
        background: isCorrectAndSelected ? '#e8ffe8' : 'white',
        border: `2.5px solid ${isCorrectAndSelected ? '#26de81' : '#e0e0f0'}`,
        borderRadius: '14px',
        padding: '14px 20px',
        fontSize: 'clamp(1.1rem, 3.5vw, 1.4rem)',
        fontWeight: 800,
        fontFamily: 'inherit',
        color: isCorrectAndSelected ? '#1a8a4a' : 'var(--color-text)',
        cursor: state === 'correct' ? 'default' : 'pointer',
        transition: 'all 0.2s',
        textAlign: 'center',
        boxShadow: '0 3px 12px rgba(0,0,0,0.06)',
        animation: `popIn 0.4s cubic-bezier(0.34,1.56,0.64,1) ${animDelay}s both`,
      }}
      onPointerEnter={e => {
        if (state !== 'correct') {
          e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
          e.currentTarget.style.borderColor = '#a55eea';
        }
      }}
      onPointerLeave={e => {
        e.currentTarget.style.transform = '';
        if (state !== 'correct') e.currentTarget.style.borderColor = '#e0e0f0';
      }}
    >
      {label}
    </button>
  );
}

// --- Main Game ---

type GameState = 'playing' | 'correct' | 'trying-again' | 'complete';

export default function ClockNext() {
  const [level, setLevel] = useState<Level>(getStoredLevel);
  const [roundIndices, setRoundIndices] = useState<number[]>([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [completed, setCompleted] = useState(0);
  const [state, setState] = useState<GameState>('playing');
  const [options, setOptions] = useState<number[]>([]);
  const [eliminatedOptions, setEliminatedOptions] = useState<Set<number>>(new Set());
  const [dragHour, setDragHour] = useState(12);
  const [encouragement, setEncouragement] = useState('');
  const [shakeKey, setShakeKey] = useState(0);
  const [animKey, setAnimKey] = useState(0);
  const [stars, setStars] = useState(getStoredStars);
  const [sessionStars, setSessionStars] = useState(0);

  const isActivityLevel = level >= 3;

  const initRound = useCallback((indices: number[], idx: number, lvl: Level) => {
    const val = indices[idx];
    if (val == null) return;
    setEliminatedOptions(new Set());
    setDragHour(12);
    setEncouragement('');
    setState('playing');
    setAnimKey(k => k + 1);

    if (lvl <= 2) {
      // Levels 1-2: val is an hour number
      const wrong = wrongHours(val, 2);
      setOptions(shuffle([val, ...wrong]));
    } else {
      // Levels 3-4: val is an activity index
      const wrong = wrongActivities(val, 2);
      setOptions(shuffle([val, ...wrong]));
    }
  }, []);

  const generateAndInit = useCallback((lvl: Level) => {
    const indices = lvl <= 2 ? generateHourRounds() : generateActivityRounds();
    setRoundIndices(indices);
    setCurrentRound(0);
    setCompleted(0);
    setSessionStars(0);
    initRound(indices, 0, lvl);
  }, [initRound]);

  // Initialize on mount
  useState(() => { generateAndInit(level); });

  const currentIndex = roundIndices[currentRound] as number | undefined;
  const currentActivity = isActivityLevel && currentIndex != null ? ACTIVITIES[currentIndex] : null;
  // For levels 1-2, currentIndex IS the hour
  const currentHour = !isActivityLevel ? currentIndex : currentActivity?.hour;

  const addStar = useCallback(() => {
    setStars(s => {
      const next = s + 1;
      setStored(STORAGE_KEY_STARS, String(next));
      return next;
    });
    setSessionStars(s => s + 1);
  }, []);

  const advanceRound = useCallback(() => {
    addStar();
    const newCompleted = completed + 1;
    setCompleted(newCompleted);
    if (newCompleted >= ROUNDS) {
      setState('complete');
    } else {
      const next = currentRound + 1;
      setCurrentRound(next);
      initRound(roundIndices, next, level);
    }
  }, [completed, currentRound, roundIndices, initRound, addStar, level]);

  // Generic answer handler — answer is either an hour (L1-2) or activity index (L3-4)
  const handleAnswer = useCallback((answer: number) => {
    if (state !== 'playing' && state !== 'trying-again') return;

    let correct: number;
    if (level <= 2) {
      correct = currentHour!;
    } else {
      correct = currentIndex!;
    }

    if (answer === correct) {
      setState('correct');
      setTimeout(advanceRound, 800);
    } else {
      setEliminatedOptions(prev => new Set([...prev, answer]));
      setEncouragement(ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)]);
      setShakeKey(k => k + 1);
      setState('trying-again');
    }
  }, [state, level, currentHour, currentIndex, advanceRound]);

  const handleDragSubmit = useCallback(() => {
    if (currentHour == null) return;
    handleAnswer(dragHour);
  }, [currentHour, dragHour, handleAnswer]);

  // Level 3: compare dragHour to activity's hour, but route through the index-based answer system
  const handleDragSubmitActivity = useCallback((correctHour: number) => {
    if (currentIndex == null) return;
    if (dragHour === correctHour) {
      // Correct — pass the right index so handleAnswer sees a match
      handleAnswer(currentIndex);
    } else {
      // Wrong — pass -1 so it triggers the wrong path without eliminating a real option
      handleAnswer(-1);
    }
  }, [currentIndex, dragHour, handleAnswer]);

  const handleLevelChange = (newLevel: Level) => {
    setLevel(newLevel);
    setStored(STORAGE_KEY_LEVEL, String(newLevel));
    generateAndInit(newLevel);
  };

  // --- Completion screen ---
  if (state === 'complete') {
    return (
      <div style={{
        height: '100dvh', background: 'var(--color-bg)', fontFamily: 'var(--font-family)',
        padding: '24px 16px', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: '20px',
        overflow: 'hidden', boxSizing: 'border-box',
      }}>
        <div style={{ fontSize: 'clamp(4rem, 15vw, 8rem)', animation: 'popIn 0.5s cubic-bezier(0.34,1.56,0.64,1)' }}>🎉</div>
        <h2 style={{
          fontSize: 'clamp(1.6rem, 5vw, 2.4rem)', fontWeight: 900,
          background: 'linear-gradient(135deg, #a55eea, #45aaf2)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          textAlign: 'center', animation: 'popIn 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.1s both',
        }}>Amazing! ⭐ +{sessionStars}</h2>
        <p style={{ color: '#8a8a9b', fontSize: '1rem', fontWeight: 800, animation: 'popIn 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.15s both' }}>
          Total stars: ⭐ {stars}
        </p>
        <button onClick={() => generateAndInit(level)} style={{
          background: 'linear-gradient(135deg, #a55eea, #4b7bec)', color: 'white', border: 'none',
          borderRadius: '50px', padding: '14px 32px', fontSize: '1.1rem', fontWeight: 800,
          cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 6px 20px #a55eea35',
          animation: 'popIn 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.2s both',
        }}>Play Again!</button>
      </div>
    );
  }

  if (currentIndex == null) return null;

  const clockSize = Math.min(240, typeof window !== 'undefined' ? window.innerWidth * 0.55 : 240);

  // --- Render game content by level ---
  let gameContent: React.ReactNode;

  if (level === 1) {
    // LEVEL 1: Text → drag clock hand
    gameContent = (
      <>
        <div key={`text-${animKey}`} style={{
          background: 'white', border: '2.5px solid #a55eea', borderRadius: '16px',
          padding: '18px 28px', boxShadow: '0 4px 16px #a55eea20',
          animation: 'popIn 0.4s cubic-bezier(0.34,1.56,0.64,1)',
        }}>
          <p style={{ fontSize: 'clamp(1.4rem, 5vw, 2rem)', fontWeight: 900, color: 'var(--color-text)', margin: 0, textAlign: 'center' }}>
            {formatHourText(currentHour!)}
          </p>
        </div>
        <p style={{ color: '#8a8a9b', fontSize: '0.95rem', fontWeight: 800, textAlign: 'center', margin: 0 }}>
          Move the hand!
        </p>
        <div style={{ animation: 'popIn 0.4s cubic-bezier(0.34,1.56,0.64,1) 0.1s both' }}>
          <DraggableClock size={clockSize} selectedHour={dragHour} onHourChange={setDragHour} />
        </div>
        <p style={{ fontSize: '1.1rem', fontWeight: 800, color: '#8a8a9b', margin: 0 }}>{formatHourText(dragHour)}</p>
        <EncouragementAndAction encouragement={encouragement} shakeKey={shakeKey} state={state} onSubmit={handleDragSubmit} />
      </>
    );
  } else if (level === 2) {
    // LEVEL 2: Clock → pick time from 3 text options
    gameContent = (
      <>
        <div key={`clock-${animKey}`} style={{ animation: 'popIn 0.4s cubic-bezier(0.34,1.56,0.64,1)' }}>
          <Clock hour={currentHour!} minute={0} size={clockSize} />
        </div>
        <p style={{ color: '#8a8a9b', fontSize: '1rem', fontWeight: 800, textAlign: 'center', margin: 0 }}>What time is it?</p>
        <EncouragementSlot encouragement={encouragement} shakeKey={shakeKey} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', maxWidth: '340px' }}>
          {options.map((hour, i) => (
            <OptionButton key={`${animKey}-${hour}`} label={formatHourText(hour)}
              isEliminated={eliminatedOptions.has(hour)} isCorrect={hour === currentHour!}
              state={state} onClick={() => handleAnswer(hour)} animDelay={i * 0.08} />
          ))}
        </div>
      </>
    );
  } else if (level === 3) {
    // LEVEL 3: Activity text → drag clock hand (clock shows AM/PM)
    const act = currentActivity!;
    gameContent = (
      <>
        <div key={`act-${animKey}`} style={{
          background: 'white', border: '2.5px solid #a55eea', borderRadius: '16px',
          padding: '14px 24px', boxShadow: '0 4px 16px #a55eea20',
          animation: 'popIn 0.4s cubic-bezier(0.34,1.56,0.64,1)',
          textAlign: 'center',
        }}>
          <span style={{ fontSize: 'clamp(1.8rem, 6vw, 2.4rem)' }}>{act.emoji}</span>
          <p style={{ fontSize: 'clamp(1.2rem, 4vw, 1.6rem)', fontWeight: 900, color: 'var(--color-text)', margin: '4px 0 0' }}>
            {act.name}
          </p>
        </div>
        <p style={{ color: '#8a8a9b', fontSize: '0.9rem', fontWeight: 800, textAlign: 'center', margin: 0 }}>
          When is this? Move the hand!
        </p>
        <div style={{ animation: 'popIn 0.4s cubic-bezier(0.34,1.56,0.64,1) 0.1s both' }}>
          <DraggableClock size={clockSize} selectedHour={dragHour} onHourChange={setDragHour} period={act.period} />
        </div>
        <p style={{ fontSize: '1rem', fontWeight: 800, color: '#8a8a9b', margin: 0 }}>{formatHourText(dragHour)}</p>
        <EncouragementAndAction encouragement={encouragement} shakeKey={shakeKey} state={state}
          onSubmit={() => handleDragSubmitActivity(act.hour)} />
      </>
    );
  } else {
    // LEVEL 4: Clock with AM/PM → pick activity from 3 text options
    const act = currentActivity!;
    gameContent = (
      <>
        <div key={`clock-${animKey}`} style={{ animation: 'popIn 0.4s cubic-bezier(0.34,1.56,0.64,1)' }}>
          <Clock hour={act.hour} minute={0} size={clockSize} period={act.period} />
        </div>
        <p style={{ color: '#8a8a9b', fontSize: '1rem', fontWeight: 800, textAlign: 'center', margin: 0 }}>
          What do we do now?
        </p>
        <EncouragementSlot encouragement={encouragement} shakeKey={shakeKey} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', maxWidth: '340px' }}>
          {options.map((actIdx, i) => {
            const a = ACTIVITIES[actIdx];
            return (
              <OptionButton key={`${animKey}-${actIdx}`} label={`${a.emoji} ${a.name}`}
                isEliminated={eliminatedOptions.has(actIdx)} isCorrect={actIdx === currentIndex}
                state={state} onClick={() => handleAnswer(actIdx)} animDelay={i * 0.08} />
            );
          })}
        </div>
      </>
    );
  }

  return (
    <div style={{
      height: '100dvh', background: 'var(--color-bg)', fontFamily: 'var(--font-family)',
      padding: '24px 16px 20px', boxSizing: 'border-box',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '12px' }}>
        <h1 style={{
          fontSize: 'clamp(1.8rem, 6vw, 2.8rem)', fontWeight: 900, margin: 0,
          background: 'linear-gradient(135deg, #a55eea, #45aaf2)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.5px',
        }}>🕐 Read O'Clock</h1>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
        <div style={{
          display: 'flex', background: 'white', borderRadius: '50px', padding: '3px',
          boxShadow: 'var(--shadow)', border: '2px solid var(--color-border)',
        }}>
          {([1, 2, 3, 4] as Level[]).map(lvl => (
            <button key={lvl} onClick={() => handleLevelChange(lvl)}
              style={{
                border: 'none', borderRadius: '50px', padding: '6px 12px',
                fontSize: '0.8rem', fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer',
                transition: 'all 0.2s',
                background: level === lvl ? 'linear-gradient(135deg, #a55eea, #4b7bec)' : 'transparent',
                color: level === lvl ? 'white' : '#8a8a9b',
                boxShadow: level === lvl ? '0 2px 8px #a55eea40' : 'none',
              }}
            >{lvl}</button>
          ))}
        </div>
        <div style={{ background: 'linear-gradient(135deg, #a55eea, #4b7bec)', color: 'white', borderRadius: '50px', padding: '3px 12px', fontSize: '0.8rem', fontWeight: 800 }}>
          {completed + 1} / {ROUNDS}
        </div>
        <div style={{ background: 'linear-gradient(135deg, #F9CA24, #FF9F43)', color: 'white', borderRadius: '50px', padding: '3px 10px', fontSize: '0.8rem', fontWeight: 800 }}>
          ⭐ {stars}
        </div>
      </div>

      {/* Game area */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: '12px', maxWidth: '500px', margin: '0 auto', width: '100%', minHeight: 0,
      }}>
        {gameContent}
      </div>

      {/* Progress bar */}
      <div style={{ maxWidth: '340px', margin: '12px auto 0', height: '8px', background: '#f0f0f8', borderRadius: '4px', overflow: 'hidden', width: '100%' }}>
        <div style={{ height: '100%', width: `${(completed / ROUNDS) * 100}%`, background: 'linear-gradient(135deg, #a55eea, #4b7bec)', borderRadius: '4px', transition: 'width 0.4s ease-out' }} />
      </div>
    </div>
  );
}

// --- Small helper components ---

function EncouragementSlot({ encouragement, shakeKey }: { encouragement: string; shakeKey: number }) {
  return (
    <div style={{ height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {encouragement && (
        <p key={shakeKey} style={{ color: '#FF9F43', fontSize: '0.85rem', fontWeight: 800, margin: 0, animation: 'popIn 0.3s cubic-bezier(0.34,1.56,0.64,1)' }}>
          {encouragement}
        </p>
      )}
    </div>
  );
}

function EncouragementAndAction({ encouragement, shakeKey, state, onSubmit }: {
  encouragement: string; shakeKey: number; state: GameState; onSubmit: () => void;
}) {
  return (
    <>
      <EncouragementSlot encouragement={encouragement} shakeKey={shakeKey} />
      {state === 'correct' ? (
        <div style={{ fontSize: '1.8rem', animation: 'popIn 0.3s cubic-bezier(0.34,1.56,0.64,1)' }}>⭐</div>
      ) : (
        <button onClick={onSubmit} style={{
          background: 'linear-gradient(135deg, #a55eea, #4b7bec)', color: 'white', border: 'none',
          borderRadius: '50px', padding: '12px 32px', fontSize: '1rem', fontWeight: 800,
          cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 6px 20px #a55eea35',
        }}>Check!</button>
      )}
    </>
  );
}
