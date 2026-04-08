import { useState, useCallback, useRef } from 'react';
import Clock from './Clock';

type Level = 1 | 2;

const STORAGE_KEY = 'clockNextLevel';
const ROUNDS = 10;

const HOUR_WORDS: Record<number, string> = {
  1: 'one', 2: 'two', 3: 'three', 4: 'four', 5: 'five', 6: 'six',
  7: 'seven', 8: 'eight', 9: 'nine', 10: 'ten', 11: 'eleven', 12: 'twelve',
};

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

/** Generate wrong answers that aren't the correct one */
function wrongHours(correct: number, count: number): number[] {
  const pool = Array.from({ length: 12 }, (_, i) => i + 1).filter(h => h !== correct);
  return shuffle(pool).slice(0, count);
}

function formatHourText(hour: number): string {
  return `${HOUR_WORDS[hour]} o'clock`;
}

/** Generate rounds: each shows a clock at hour H, answer is H+1 */
function generateRounds(): number[] {
  // Pick 10 random starting hours (1-12), can repeat
  return shuffle(Array.from({ length: 12 }, (_, i) => i + 1)).slice(0, ROUNDS);
}

// --- Level 2: Draggable Clock ---

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
      {/* Clock face */}
      <circle cx={cx} cy={cy} r="46" fill="white" stroke="#e0e0f0" strokeWidth="2.5" />

      {/* Minute dots */}
      {Array.from({ length: 60 }, (_, i) => {
        if (i % 5 === 0) return null;
        const angle = (i * 6 - 90) * Math.PI / 180;
        return (
          <circle key={i} cx={cx + 41 * Math.cos(angle)} cy={cy + 41 * Math.sin(angle)} r="0.5" fill="#d0d0e0" />
        );
      })}

      {/* Hour numbers */}
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

      {/* Minute hand — always at 12 (straight up) */}
      <line x1={cx} y1={cy} x2={cx} y2={cy - 30}
        stroke="#45aaf2" strokeWidth="2" strokeLinecap="round" />

      {/* Hour hand — draggable */}
      <line x1={cx} y1={cy} x2={handX} y2={handY}
        stroke="#a55eea" strokeWidth="3.5" strokeLinecap="round" />

      {/* Drag target circle — invisible but makes touch easier */}
      <circle cx={handX} cy={handY} r="8" fill="transparent" />

      {/* Center dot */}
      <circle cx={cx} cy={cy} r="2.5" fill="#a55eea" />
      <circle cx={cx} cy={cy} r="1.2" fill="white" />

      {/* "Drag me" hint ring */}
      <circle cx={handX} cy={handY} r="4" fill="#a55eea" opacity="0.15" />
    </svg>
  );
}

// --- Main Game ---

interface Round {
  shownHour: number;  // The hour displayed on the clock
  correctAnswer: number; // What comes next (shownHour + 1, wrapping 12→1)
}

type GameState = 'playing' | 'correct' | 'wrong' | 'complete';

export default function ClockNext() {
  const [level, setLevel] = useState<Level>(getStoredLevel);
  const [rounds, setRounds] = useState<Round[]>(() => generateRoundData());
  const [currentRound, setCurrentRound] = useState(0);
  const [completed, setCompleted] = useState(0);
  const [state, setState] = useState<GameState>('playing');
  const [options, setOptions] = useState<number[]>(() => [] as number[]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [dragHour, setDragHour] = useState(12);
  const [retryQueue, setRetryQueue] = useState<number[]>([]);
  const [animKey, setAnimKey] = useState(0);

  function generateRoundData(): Round[] {
    return generateRounds().map(h => ({
      shownHour: h,
      correctAnswer: h === 12 ? 1 : h + 1,
    }));
  }

  // Initialize options when round changes
  const initRound = useCallback((roundData: Round[], idx: number) => {
    const round = roundData[idx];
    if (!round) return;
    const wrong = wrongHours(round.correctAnswer, 2);
    setOptions(shuffle([round.correctAnswer, ...wrong]));
    setSelectedOption(null);
    setDragHour(12); // Reset drag position
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

  const handleAnswer = useCallback((answer: number) => {
    if (state !== 'playing' || !round) return;

    if (answer === round.correctAnswer) {
      setState('correct');
      setSelectedOption(answer);
      setTimeout(() => {
        const newCompleted = completed + 1;
        setCompleted(newCompleted);

        if (newCompleted >= ROUNDS) {
          // Check retry queue
          if (retryQueue.length > 0) {
            // Re-ask missed questions
            const retryRounds = retryQueue.map(h => ({
              shownHour: h,
              correctAnswer: h === 12 ? 1 : h + 1,
            }));
            setRounds(retryRounds);
            setCurrentRound(0);
            setCompleted(ROUNDS - retryRounds.length);
            setRetryQueue([]);
            initRound(retryRounds, 0);
          } else {
            setState('complete');
          }
        } else {
          const next = currentRound + 1;
          setCurrentRound(next);
          initRound(rounds, next);
        }
      }, 800);
    } else {
      setState('wrong');
      setSelectedOption(answer);
      // Add to retry queue
      setRetryQueue(q => [...q, round.shownHour]);
      setTimeout(() => {
        // Show correct answer briefly, then move on
        setSelectedOption(round.correctAnswer);
        setTimeout(() => {
          const newCompleted = completed + 1;
          setCompleted(newCompleted);
          if (newCompleted >= ROUNDS) {
            const updatedRetry = [...retryQueue, round.shownHour];
            const retryRounds = updatedRetry.map(h => ({
              shownHour: h,
              correctAnswer: h === 12 ? 1 : h + 1,
            }));
            setRounds(retryRounds);
            setCurrentRound(0);
            setCompleted(ROUNDS - retryRounds.length);
            setRetryQueue([]);
            initRound(retryRounds, 0);
          } else {
            const next = currentRound + 1;
            setCurrentRound(next);
            initRound(rounds, next);
          }
        }, 1000);
      }, 600);
    }
  }, [state, round, completed, currentRound, rounds, retryQueue, initRound]);

  const handleLevel2Submit = useCallback(() => {
    if (!round) return;
    handleAnswer(dragHour);
  }, [round, dragHour, handleAnswer]);

  const restart = useCallback(() => {
    const r = generateRoundData();
    setRounds(r);
    setCurrentRound(0);
    setCompleted(0);
    setRetryQueue([]);
    initRound(r, 0);
  }, [initRound]);

  const handleLevelChange = (newLevel: Level) => {
    setLevel(newLevel);
    try { localStorage.setItem(STORAGE_KEY, String(newLevel)); } catch { /* noop */ }
    restart();
  };

  // Completion screen
  if (state === 'complete') {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'var(--color-bg)',
        fontFamily: 'var(--font-family)',
        padding: '24px 16px 40px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '24px',
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

  const clockSize = Math.min(240, typeof window !== 'undefined' ? window.innerWidth * 0.55 : 240);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--color-bg)',
      fontFamily: 'var(--font-family)',
      padding: '24px 16px 40px',
      boxSizing: 'border-box',
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h1 style={{
          fontSize: 'clamp(1.8rem, 6vw, 2.8rem)',
          fontWeight: 900,
          margin: 0,
          background: 'linear-gradient(135deg, #a55eea, #45aaf2)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '-0.5px',
        }}>
          🕐 What Comes Next?
        </h1>
        <p style={{
          color: '#8a8a9b',
          fontSize: '0.95rem',
          fontWeight: 700,
          margin: '6px 0 0',
        }}>
          {level === 1
            ? 'Read the clock, pick the next hour!'
            : 'Read the time, set the clock!'}
        </p>
      </div>

      {/* Controls row */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '14px',
        marginBottom: '24px',
        flexWrap: 'wrap',
      }}>
        {/* Level selector */}
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

        {/* Progress */}
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
      </div>

      {/* Game area */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '28px',
        maxWidth: '500px',
        margin: '0 auto',
      }}>
        {level === 1 ? (
          /* LEVEL 1: Clock displayed → pick next hour from text */
          <>
            <div key={`clock-${animKey}`} style={{
              animation: 'popIn 0.4s cubic-bezier(0.34,1.56,0.64,1)',
            }}>
              <Clock hour={round.shownHour} minute={0} size={clockSize} />
            </div>

            <p style={{
              color: '#8a8a9b',
              fontSize: '1rem',
              fontWeight: 800,
              textAlign: 'center',
            }}>
              What comes after this?
            </p>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              width: '100%',
              maxWidth: '340px',
            }}>
              {options.map((hour, i) => {
                const isSelected = selectedOption === hour;
                const isCorrect = hour === round.correctAnswer;
                let bg = 'white';
                let border = '#e0e0f0';
                let color = 'var(--color-text)';

                if (state === 'correct' && isSelected) {
                  bg = '#e8ffe8';
                  border = '#26de81';
                  color = '#1a8a4a';
                } else if (state === 'wrong' && isSelected && !isCorrect) {
                  bg = '#ffe8e8';
                  border = '#FF6B6B';
                  color = '#cc4444';
                } else if (state === 'wrong' && isCorrect) {
                  bg = '#e8ffe8';
                  border = '#26de81';
                  color = '#1a8a4a';
                }

                return (
                  <button
                    key={`${animKey}-${hour}`}
                    onClick={() => handleAnswer(hour)}
                    disabled={state !== 'playing'}
                    style={{
                      background: bg,
                      border: `2.5px solid ${border}`,
                      borderRadius: '14px',
                      padding: '16px 20px',
                      fontSize: 'clamp(1.2rem, 4vw, 1.6rem)',
                      fontWeight: 800,
                      fontFamily: 'inherit',
                      color,
                      cursor: state === 'playing' ? 'pointer' : 'default',
                      transition: 'all 0.2s',
                      textAlign: 'center',
                      boxShadow: '0 3px 12px rgba(0,0,0,0.06)',
                      animation: `popIn 0.4s cubic-bezier(0.34,1.56,0.64,1) ${i * 0.08}s both`,
                    }}
                    onPointerEnter={e => {
                      if (state === 'playing') {
                        e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                        e.currentTarget.style.borderColor = '#a55eea';
                      }
                    }}
                    onPointerLeave={e => {
                      e.currentTarget.style.transform = '';
                      e.currentTarget.style.borderColor = state === 'playing' ? '#e0e0f0' : '';
                    }}
                  >
                    {formatHourText(hour)}
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          /* LEVEL 2: Text displayed → drag clock hand */
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
                {formatHourText(round.correctAnswer)}
              </p>
            </div>

            <p style={{
              color: '#8a8a9b',
              fontSize: '0.95rem',
              fontWeight: 800,
              textAlign: 'center',
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
              fontSize: '1.1rem',
              fontWeight: 800,
              color: dragHour === round.correctAnswer ? '#26de81' : '#8a8a9b',
              transition: 'color 0.2s',
            }}>
              {formatHourText(dragHour)}
            </p>

            {/* Submit button */}
            {state === 'playing' && (
              <button
                onClick={handleLevel2Submit}
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

            {/* Feedback */}
            {state === 'correct' && (
              <div style={{
                fontSize: '2rem',
                animation: 'popIn 0.3s cubic-bezier(0.34,1.56,0.64,1)',
              }}>
                ✅
              </div>
            )}
            {state === 'wrong' && (
              <div style={{
                textAlign: 'center',
                animation: 'popIn 0.3s cubic-bezier(0.34,1.56,0.64,1)',
              }}>
                <span style={{ fontSize: '2rem' }}>❌</span>
                <p style={{ color: '#FF6B6B', fontWeight: 800, fontSize: '0.95rem', marginTop: '8px' }}>
                  It was {formatHourText(round.correctAnswer)}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Progress bar */}
      <div style={{
        maxWidth: '340px',
        margin: '32px auto 0',
        height: '8px',
        background: '#f0f0f8',
        borderRadius: '4px',
        overflow: 'hidden',
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
