import { useState, useCallback, useRef } from 'react';
import Clock from './Clock';

type Level = 1 | 2;

const STORAGE_KEY = 'clockNextLevel';
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

function getStoredLevel(): Level {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === '2') return 2;
  } catch { /* noop */ }
  return 1;
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

interface Round {
  shownHour: number;
  correctAnswer: number;
}

type GameState = 'playing' | 'correct' | 'trying-again' | 'complete';

export default function ClockNext() {
  const [level, setLevel] = useState<Level>(getStoredLevel);
  const [rounds, setRounds] = useState<Round[]>(() => generateRoundData());
  const [currentRound, setCurrentRound] = useState(0);
  const [completed, setCompleted] = useState(0);
  const [state, setState] = useState<GameState>('playing');
  const [options, setOptions] = useState<number[]>([]);
  const [eliminatedOptions, setEliminatedOptions] = useState<Set<number>>(new Set());
  const [dragHour, setDragHour] = useState(12);
  const [encouragement, setEncouragement] = useState('');
  const [shakeKey, setShakeKey] = useState(0);
  const [animKey, setAnimKey] = useState(0);

  function generateRoundData(): Round[] {
    return generateRounds().map(h => ({
      shownHour: h,
      correctAnswer: h === 12 ? 1 : h + 1,
    }));
  }

  const initRound = useCallback((roundData: Round[], idx: number) => {
    const round = roundData[idx];
    if (!round) return;
    const wrong = wrongHours(round.correctAnswer, 2);
    setOptions(shuffle([round.correctAnswer, ...wrong]));
    setEliminatedOptions(new Set());
    setDragHour(12);
    setEncouragement('');
    setState('playing');
    setAnimKey(k => k + 1);
  }, []);

  // Initialize first round
  useState(() => {
    const r = generateRoundData();
    setRounds(r);
    initRound(r, 0);
  });

  const round = rounds[currentRound] as Round | undefined;

  const advanceRound = useCallback(() => {
    const newCompleted = completed + 1;
    setCompleted(newCompleted);

    if (newCompleted >= ROUNDS) {
      setState('complete');
    } else {
      const next = currentRound + 1;
      setCurrentRound(next);
      initRound(rounds, next);
    }
  }, [completed, currentRound, rounds, initRound]);

  const handleAnswer = useCallback((answer: number) => {
    if ((state !== 'playing' && state !== 'trying-again') || !round) return;

    if (answer === round.correctAnswer) {
      setState('correct');
      setTimeout(advanceRound, 800);
    } else {
      // Wrong: gentle encouragement, eliminate that option, stay on question
      setEliminatedOptions(prev => new Set([...prev, answer]));
      setEncouragement(ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)]);
      setShakeKey(k => k + 1);
      setState('trying-again');
      // Let them try again immediately
      setTimeout(() => setState('trying-again'), 10);
    }
  }, [state, round, advanceRound]);

  const handleLevel1Submit = useCallback(() => {
    if (!round) return;
    handleAnswer(dragHour);
  }, [round, dragHour, handleAnswer]);

  const restart = useCallback(() => {
    const r = generateRoundData();
    setRounds(r);
    setCurrentRound(0);
    setCompleted(0);
    initRound(r, 0);
  }, [initRound]);

  const handleLevelChange = (newLevel: Level) => {
    setLevel(newLevel);
    try { localStorage.setItem(STORAGE_KEY, String(newLevel)); } catch { /* noop */ }
    restart();
  };

  // --- Completion screen ---
  if (state === 'complete') {
    return (
      <div style={{
        minHeight: '100dvh',
        background: 'var(--color-bg)',
        fontFamily: 'var(--font-family)',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '20px',
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
          Amazing!
        </h2>
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

  if (!round) return null;

  const clockSize = Math.min(180, typeof window !== 'undefined' ? window.innerWidth * 0.45 : 180);

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'var(--color-bg)',
      fontFamily: 'var(--font-family)',
      padding: '12px 16px 16px',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Compact header */}
      <div style={{ textAlign: 'center', marginBottom: '8px' }}>
        <h1 style={{
          fontSize: 'clamp(1.4rem, 5vw, 2rem)',
          fontWeight: 900,
          margin: 0,
          background: 'linear-gradient(135deg, #a55eea, #45aaf2)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '-0.5px',
        }}>
          🕐 What Comes Next?
        </h1>
      </div>

      {/* Controls row — compact */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '12px',
      }}>
        <div style={{
          display: 'flex',
          background: 'white',
          borderRadius: '50px',
          padding: '3px',
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
                padding: '6px 14px',
                fontSize: '0.8rem',
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
          padding: '3px 12px',
          fontSize: '0.8rem',
          fontWeight: 800,
        }}>
          {completed + 1} / {ROUNDS}
        </div>
      </div>

      {/* Game area — fills remaining space */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '14px',
        maxWidth: '500px',
        margin: '0 auto',
        width: '100%',
      }}>
        {level === 2 ? (
          /* LEVEL 2: Clock displayed → pick next hour from text */
          <>
            <div key={`clock-${animKey}`} style={{
              animation: 'popIn 0.4s cubic-bezier(0.34,1.56,0.64,1)',
            }}>
              <Clock hour={round.shownHour} minute={0} size={clockSize} />
            </div>

            <p style={{
              color: '#8a8a9b',
              fontSize: '0.9rem',
              fontWeight: 800,
              textAlign: 'center',
              margin: 0,
            }}>
              What comes after this?
            </p>

            {/* Encouragement message */}
            <div style={{
              height: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {encouragement && (
                <p key={shakeKey} style={{
                  color: '#FF9F43',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  margin: 0,
                  animation: 'popIn 0.3s cubic-bezier(0.34,1.56,0.64,1)',
                }}>
                  {encouragement}
                </p>
              )}
            </div>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              width: '100%',
              maxWidth: '300px',
            }}>
              {options.map((hour, i) => {
                const isEliminated = eliminatedOptions.has(hour);
                const isCorrectAndSelected = state === 'correct' && hour === round.correctAnswer;

                if (isEliminated) return (
                  <button
                    key={`${animKey}-${hour}`}
                    disabled
                    style={{
                      background: '#f8f8fc',
                      border: '2.5px solid #e8e8f0',
                      borderRadius: '14px',
                      padding: '12px 16px',
                      fontSize: 'clamp(1.1rem, 3.5vw, 1.4rem)',
                      fontWeight: 800,
                      fontFamily: 'inherit',
                      color: '#ccc',
                      cursor: 'default',
                      textAlign: 'center',
                      textDecoration: 'line-through',
                      opacity: 0.5,
                    }}
                  >
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
                      padding: '12px 16px',
                      fontSize: 'clamp(1.1rem, 3.5vw, 1.4rem)',
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
              padding: '12px 24px',
              boxShadow: '0 4px 16px #a55eea20',
              animation: 'popIn 0.4s cubic-bezier(0.34,1.56,0.64,1)',
            }}>
              <p style={{
                fontSize: 'clamp(1.3rem, 4.5vw, 1.8rem)',
                fontWeight: 900,
                color: 'var(--color-text)',
                margin: 0,
                textAlign: 'center',
              }}>
                {formatHourText(round.correctAnswer)}
              </p>
            </div>

            <p style={{
              color: '#8a8a9b',
              fontSize: '0.85rem',
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

            {/* Show current selection */}
            <p style={{
              fontSize: '1rem',
              fontWeight: 800,
              color: dragHour === round.correctAnswer ? '#26de81' : '#8a8a9b',
              transition: 'color 0.2s',
              margin: 0,
            }}>
              {formatHourText(dragHour)}
            </p>

            {/* Encouragement message */}
            <div style={{
              height: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {encouragement && (
                <p key={shakeKey} style={{
                  color: '#FF9F43',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  margin: 0,
                  animation: 'popIn 0.3s cubic-bezier(0.34,1.56,0.64,1)',
                }}>
                  {encouragement}
                </p>
              )}
            </div>

            {/* Submit / feedback */}
            {state === 'correct' ? (
              <div style={{
                fontSize: '1.8rem',
                animation: 'popIn 0.3s cubic-bezier(0.34,1.56,0.64,1)',
              }}>
                ⭐
              </div>
            ) : (
              <button
                onClick={handleLevel1Submit}
                style={{
                  background: 'linear-gradient(135deg, #a55eea, #4b7bec)',
                  color: 'white', border: 'none', borderRadius: '50px',
                  padding: '12px 32px', fontSize: '1rem', fontWeight: 800,
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

      {/* Progress bar — at bottom */}
      <div style={{
        maxWidth: '300px',
        margin: '12px auto 0',
        height: '6px',
        background: '#f0f0f8',
        borderRadius: '3px',
        overflow: 'hidden',
        width: '100%',
      }}>
        <div style={{
          height: '100%',
          width: `${(completed / ROUNDS) * 100}%`,
          background: 'linear-gradient(135deg, #a55eea, #4b7bec)',
          borderRadius: '3px',
          transition: 'width 0.4s ease-out',
        }} />
      </div>
    </div>
  );
}
