import { useState, useCallback, useRef } from 'react';
import Clock from './Clock';

type Level = 1 | 2;

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

function getStored(key: string, fallback: string): string {
  try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
}
function setStored(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch { /* noop */ }
}

function getStoredLevel(): Level {
  return getStored(STORAGE_KEY_LEVEL, '1') === '2' ? 2 : 1;
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

function generateRounds(): number[] {
  return shuffle(Array.from({ length: 12 }, (_, i) => i + 1)).slice(0, ROUNDS);
}

// --- Draggable Clock ---

interface DraggableClockProps {
  size: number;
  selectedHour: number;
  onHourChange: (hour: number) => void;
}

function DraggableClock({ size, selectedHour, onHourChange }: DraggableClockProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);

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

  const handleEnd = useCallback(() => {
    dragging.current = false;
  }, []);

  const cx = 50;
  const cy = 50;
  const hourAngle = ((selectedHour % 12) * 30 - 90) * Math.PI / 180;
  const handX = cx + 20 * Math.cos(hourAngle);
  const handY = cy + 20 * Math.sin(hourAngle);

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 100 100"
      width={size}
      height={size}
      style={{
        filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.1))',
        cursor: 'pointer',
        touchAction: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
      onPointerDown={e => { e.preventDefault(); handleStart(e.clientX, e.clientY); }}
      onPointerMove={e => handleMove(e.clientX, e.clientY)}
      onPointerUp={handleEnd}
      onPointerLeave={handleEnd}
    >
      <circle cx={cx} cy={cy} r="46" fill="white" stroke="#e0e0f0" strokeWidth="2.5" />
      {Array.from({ length: 60 }, (_, i) => {
        if (i % 5 === 0) return null;
        const angle = (i * 6 - 90) * Math.PI / 180;
        return (
          <circle key={i} cx={cx + 41 * Math.cos(angle)} cy={cy + 41 * Math.sin(angle)} r="0.5" fill="#d0d0e0" />
        );
      })}
      {Array.from({ length: 12 }, (_, i) => {
        const num = i + 1;
        const a = (num * 30 - 90) * Math.PI / 180;
        return (
          <text key={num} x={cx + 37 * Math.cos(a)} y={cy + 37 * Math.sin(a)}
            textAnchor="middle" dominantBaseline="central"
            fill="#3a3a5a" fontSize="8" fontWeight="800" fontFamily="'Nunito', sans-serif"
          >{num}</text>
        );
      })}
      <line x1={cx} y1={cy} x2={cx} y2={cy - 30}
        stroke="#45aaf2" strokeWidth="2" strokeLinecap="round" />
      <line x1={cx} y1={cy} x2={handX} y2={handY}
        stroke="#a55eea" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx={handX} cy={handY} r="8" fill="transparent" />
      <circle cx={cx} cy={cy} r="2.5" fill="#a55eea" />
      <circle cx={cx} cy={cy} r="1.2" fill="white" />
      <circle cx={handX} cy={handY} r="4" fill="#a55eea" opacity="0.15" />
    </svg>
  );
}

// --- Main Game ---

type GameState = 'playing' | 'correct' | 'trying-again' | 'complete';

export default function ClockNext() {
  const [level, setLevel] = useState<Level>(getStoredLevel);
  const [hours, setHours] = useState<number[]>(() => generateRounds());
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

  const initRound = useCallback((roundHours: number[], idx: number) => {
    const hour = roundHours[idx];
    if (hour == null) return;
    const wrong = wrongHours(hour, 2);
    setOptions(shuffle([hour, ...wrong]));
    setEliminatedOptions(new Set());
    setDragHour(12);
    setEncouragement('');
    setState('playing');
    setAnimKey(k => k + 1);
  }, []);

  // Initialize first round
  useState(() => {
    const h = generateRounds();
    setHours(h);
    initRound(h, 0);
  });

  const currentHour = hours[currentRound] as number | undefined;

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
      initRound(hours, next);
    }
  }, [completed, currentRound, hours, initRound, addStar]);

  const handleAnswer = useCallback((answer: number) => {
    if ((state !== 'playing' && state !== 'trying-again') || currentHour == null) return;

    if (answer === currentHour) {
      setState('correct');
      setTimeout(advanceRound, 800);
    } else {
      setEliminatedOptions(prev => new Set([...prev, answer]));
      setEncouragement(ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)]);
      setShakeKey(k => k + 1);
      setState('trying-again');
    }
  }, [state, currentHour, advanceRound]);

  const handleLevel1Submit = useCallback(() => {
    if (currentHour == null) return;
    handleAnswer(dragHour);
  }, [currentHour, dragHour, handleAnswer]);

  const restart = useCallback(() => {
    const h = generateRounds();
    setHours(h);
    setCurrentRound(0);
    setCompleted(0);
    setSessionStars(0);
    initRound(h, 0);
  }, [initRound]);

  const handleLevelChange = (newLevel: Level) => {
    setLevel(newLevel);
    setStored(STORAGE_KEY_LEVEL, String(newLevel));
    restart();
  };

  // --- Completion screen ---
  if (state === 'complete') {
    return (
      <div style={{
        height: '100dvh',
        background: 'var(--color-bg)',
        fontFamily: 'var(--font-family)',
        padding: '24px 16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '20px',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}>
        <div style={{
          fontSize: 'clamp(4rem, 15vw, 8rem)',
          animation: 'popIn 0.5s cubic-bezier(0.34,1.56,0.64,1)',
        }}>
          🎉
        </div>
        <h2 style={{
          fontSize: 'clamp(1.6rem, 5vw, 2.4rem)',
          fontWeight: 900,
          background: 'linear-gradient(135deg, #a55eea, #45aaf2)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textAlign: 'center',
          animation: 'popIn 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.1s both',
        }}>
          Amazing! ⭐ +{sessionStars}
        </h2>
        <p style={{
          color: '#8a8a9b',
          fontSize: '1rem',
          fontWeight: 800,
          animation: 'popIn 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.15s both',
        }}>
          Total stars: ⭐ {stars}
        </p>
        <button
          onClick={restart}
          style={{
            background: 'linear-gradient(135deg, #a55eea, #4b7bec)',
            color: 'white', border: 'none', borderRadius: '50px',
            padding: '14px 32px', fontSize: '1.1rem', fontWeight: 800,
            cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: '0 6px 20px #a55eea35',
            animation: 'popIn 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.2s both',
          }}
        >
          Play Again!
        </button>
      </div>
    );
  }

  if (currentHour == null) return null;

  const clockSize = Math.min(240, typeof window !== 'undefined' ? window.innerWidth * 0.55 : 240);

  return (
    <div style={{
      height: '100dvh',
      background: 'var(--color-bg)',
      fontFamily: 'var(--font-family)',
      padding: '24px 16px 20px',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '12px' }}>
        <h1 style={{
          fontSize: 'clamp(1.8rem, 6vw, 2.8rem)',
          fontWeight: 900,
          margin: 0,
          background: 'linear-gradient(135deg, #a55eea, #45aaf2)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '-0.5px',
        }}>
          🕐 Read O'Clock
        </h1>
      </div>

      {/* Controls row */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '16px',
      }}>
        <div style={{
          display: 'flex',
          background: 'white',
          borderRadius: '50px',
          padding: '4px',
          boxShadow: 'var(--shadow)',
          border: '2px solid var(--color-border)',
        }}>
          {([1, 2] as Level[]).map(lvl => (
            <button
              key={lvl}
              onClick={() => handleLevelChange(lvl)}
              style={{
                border: 'none',
                borderRadius: '50px',
                padding: '8px 18px',
                fontSize: '0.9rem',
                fontWeight: 800,
                fontFamily: 'inherit',
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: level === lvl ? 'linear-gradient(135deg, #a55eea, #4b7bec)' : 'transparent',
                color: level === lvl ? 'white' : '#8a8a9b',
                boxShadow: level === lvl ? '0 2px 8px #a55eea40' : 'none',
              }}
            >
              {lvl === 1 ? 'Level 1' : 'Level 2'}
            </button>
          ))}
        </div>
        <div style={{
          background: 'linear-gradient(135deg, #a55eea, #4b7bec)',
          color: 'white',
          borderRadius: '50px',
          padding: '4px 14px',
          fontSize: '0.85rem',
          fontWeight: 800,
        }}>
          {completed + 1} / {ROUNDS}
        </div>
        {/* Star counter */}
        <div style={{
          background: 'linear-gradient(135deg, #F9CA24, #FF9F43)',
          color: 'white',
          borderRadius: '50px',
          padding: '4px 12px',
          fontSize: '0.85rem',
          fontWeight: 800,
        }}>
          ⭐ {stars}
        </div>
      </div>

      {/* Game area — fills remaining space */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        maxWidth: '500px',
        margin: '0 auto',
        width: '100%',
        minHeight: 0,
      }}>
        {level === 2 ? (
          /* LEVEL 2: Clock displayed → pick what time it shows from text */
          <>
            <div key={`clock-${animKey}`} style={{
              animation: 'popIn 0.4s cubic-bezier(0.34,1.56,0.64,1)',
            }}>
              <Clock hour={currentHour} minute={0} size={clockSize} />
            </div>

            <p style={{
              color: '#8a8a9b',
              fontSize: '1rem',
              fontWeight: 800,
              textAlign: 'center',
              margin: 0,
            }}>
              What time is it?
            </p>

            {/* Encouragement message */}
            <div style={{ height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {encouragement && (
                <p key={shakeKey} style={{
                  color: '#FF9F43', fontSize: '0.85rem', fontWeight: 800, margin: 0,
                  animation: 'popIn 0.3s cubic-bezier(0.34,1.56,0.64,1)',
                }}>
                  {encouragement}
                </p>
              )}
            </div>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              width: '100%',
              maxWidth: '340px',
            }}>
              {options.map((hour, i) => {
                const isEliminated = eliminatedOptions.has(hour);
                const isCorrectAndSelected = state === 'correct' && hour === currentHour;

                if (isEliminated) return (
                  <button key={`${animKey}-${hour}`} disabled style={{
                    background: '#f8f8fc', border: '2.5px solid #e8e8f0', borderRadius: '14px',
                    padding: '16px 20px', fontSize: 'clamp(1.2rem, 4vw, 1.6rem)', fontWeight: 800,
                    fontFamily: 'inherit', color: '#ccc', cursor: 'default', textAlign: 'center',
                    textDecoration: 'line-through', opacity: 0.5,
                  }}>
                    {formatHourText(hour)}
                  </button>
                );

                return (
                  <button
                    key={`${animKey}-${hour}`}
                    onClick={() => handleAnswer(hour)}
                    disabled={state === 'correct'}
                    style={{
                      background: isCorrectAndSelected ? '#e8ffe8' : 'white',
                      border: `2.5px solid ${isCorrectAndSelected ? '#26de81' : '#e0e0f0'}`,
                      borderRadius: '14px',
                      padding: '16px 20px',
                      fontSize: 'clamp(1.2rem, 4vw, 1.6rem)',
                      fontWeight: 800,
                      fontFamily: 'inherit',
                      color: isCorrectAndSelected ? '#1a8a4a' : 'var(--color-text)',
                      cursor: state === 'correct' ? 'default' : 'pointer',
                      transition: 'all 0.2s',
                      textAlign: 'center',
                      boxShadow: '0 3px 12px rgba(0,0,0,0.06)',
                      animation: `popIn 0.4s cubic-bezier(0.34,1.56,0.64,1) ${i * 0.08}s both`,
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
                    {formatHourText(hour)}
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          /* LEVEL 1: Text displayed → drag clock hand */
          <>
            <div key={`text-${animKey}`} style={{
              background: 'white',
              border: '2.5px solid #a55eea',
              borderRadius: '16px',
              padding: '18px 28px',
              boxShadow: '0 4px 16px #a55eea20',
              animation: 'popIn 0.4s cubic-bezier(0.34,1.56,0.64,1)',
            }}>
              <p style={{
                fontSize: 'clamp(1.4rem, 5vw, 2rem)',
                fontWeight: 900,
                color: 'var(--color-text)',
                margin: 0,
                textAlign: 'center',
              }}>
                {formatHourText(currentHour)}
              </p>
            </div>

            <p style={{
              color: '#8a8a9b',
              fontSize: '0.95rem',
              fontWeight: 800,
              textAlign: 'center',
              margin: 0,
            }}>
              Move the purple hand!
            </p>

            <div style={{
              animation: `popIn 0.4s cubic-bezier(0.34,1.56,0.64,1) 0.1s both`,
            }}>
              <DraggableClock
                size={clockSize}
                selectedHour={dragHour}
                onHourChange={setDragHour}
              />
            </div>

            <p style={{
              fontSize: '1.1rem',
              fontWeight: 800,
              color: '#8a8a9b',
              margin: 0,
            }}>
              {formatHourText(dragHour)}
            </p>

            {/* Encouragement */}
            <div style={{ height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {encouragement && (
                <p key={shakeKey} style={{
                  color: '#FF9F43', fontSize: '0.85rem', fontWeight: 800, margin: 0,
                  animation: 'popIn 0.3s cubic-bezier(0.34,1.56,0.64,1)',
                }}>
                  {encouragement}
                </p>
              )}
            </div>

            {state === 'correct' ? (
              <div style={{ fontSize: '1.8rem', animation: 'popIn 0.3s cubic-bezier(0.34,1.56,0.64,1)' }}>
                ⭐
              </div>
            ) : (
              <button
                onClick={handleLevel1Submit}
                style={{
                  background: 'linear-gradient(135deg, #a55eea, #4b7bec)',
                  color: 'white', border: 'none', borderRadius: '50px',
                  padding: '14px 36px', fontSize: '1.1rem', fontWeight: 800,
                  cursor: 'pointer', fontFamily: 'inherit',
                  boxShadow: '0 6px 20px #a55eea35',
                }}
              >
                Check!
              </button>
            )}
          </>
        )}
      </div>

      {/* Progress bar */}
      <div style={{
        maxWidth: '340px',
        margin: '16px auto 0',
        height: '8px',
        background: '#f0f0f8',
        borderRadius: '4px',
        overflow: 'hidden',
        width: '100%',
      }}>
        <div style={{
          height: '100%',
          width: `${(completed / ROUNDS) * 100}%`,
          background: 'linear-gradient(135deg, #a55eea, #4b7bec)',
          borderRadius: '4px',
          transition: 'width 0.4s ease-out',
        }} />
      </div>
    </div>
  );
}
