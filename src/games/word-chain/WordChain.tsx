import { useState, useEffect, useCallback } from 'react';
import {
  LEVEL1_WORDS, LEVEL2_WORDS,
  LEVEL1_ADJ, LEVEL2_ADJ,
  getChangedLetters,
} from './words';

type Level = 1 | 2;

const STORAGE_KEY = 'wordChainLevel';

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

const CHAIN_LENGTH = 10;

function findChain(level: Level, forcedStart: string | null = null): string[] {
  const words = level === 1 ? LEVEL1_WORDS : LEVEL2_WORDS;
  const adj = level === 1 ? LEVEL1_ADJ : LEVEL2_ADJ;

  let best: string[] = [];
  const starts = forcedStart && adj[forcedStart]
    ? [forcedStart, ...shuffle(words.filter(w => w !== forcedStart)).slice(0, 39)]
    : shuffle(words).slice(0, 40);

  for (const start of starts) {
    if (!adj[start]) continue;
    const chain = [start];
    const used = new Set([start]);

    function dfs(): boolean {
      if (chain.length === CHAIN_LENGTH) return true;
      const neighbors = shuffle(adj[chain[chain.length - 1]] || []);
      for (const next of neighbors) {
        if (used.has(next)) continue;
        chain.push(next);
        used.add(next);
        if (dfs()) return true;
        chain.pop();
        used.delete(next);
      }
      return false;
    }

    if (dfs()) return [...chain];
    if (chain.length > best.length) best = [...chain];
  }

  return best.length > 0 ? best : [starts[0]];
}

const PALETTE = [
  '#FF6B6B', '#FF9F43', '#F9CA24', '#26de81',
  '#45aaf2', '#a55eea', '#fd9644', '#2bcbba',
  '#fc5c65', '#4b7bec', '#20bf6b', '#eb3b5a',
  '#0fb9b1', '#8854d0', '#fa8231',
];

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz'.split('');

const CARD_COLORS = [
  { bg: '#FFF5F5', border: '#FF6B6B', shadow: '#FF6B6B30' },
  { bg: '#FFF9F0', border: '#FF9F43', shadow: '#FF9F4330' },
  { bg: '#FFFDE7', border: '#F9CA24', shadow: '#F9CA2430' },
  { bg: '#F0FFF4', border: '#26de81', shadow: '#26de8130' },
  { bg: '#EBF5FB', border: '#45aaf2', shadow: '#45aaf230' },
  { bg: '#F5F0FF', border: '#a55eea', shadow: '#a55eea30' },
];

export default function WordChain() {
  const [level, setLevel] = useState<Level>(getStoredLevel);
  const [chain, setChain] = useState<string[]>([]);
  const [animKey, setAnimKey] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);

  const generate = useCallback((lvl: Level, startWord: string | null = null) => {
    setIsGenerating(true);
    setTimeout(() => {
      const c = findChain(lvl, startWord);
      setChain(c);
      setAnimKey(k => k + 1);
      setIsGenerating(false);
    }, 30);
  }, []);

  useEffect(() => { generate(level); }, [generate, level]);

  const handleLevelChange = (newLevel: Level) => {
    setLevel(newLevel);
    try { localStorage.setItem(STORAGE_KEY, String(newLevel)); } catch { /* noop */ }
    generate(newLevel);
  };

  const covered = new Set(chain.join('').split(''));
  const coveredCount = covered.size;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #FEF9F2 0%, #F0F7FF 50%, #FBF0FF 100%)',
      fontFamily: "var(--font-family, 'Nunito', sans-serif)",
      padding: '24px 16px 40px',
      boxSizing: 'border-box',
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <h1 style={{
          fontSize: 'clamp(2rem, 6vw, 3rem)',
          fontWeight: 900,
          margin: 0,
          background: 'linear-gradient(135deg, #a55eea, #45aaf2)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '-0.5px',
        }}>
          🔗 Word Chain
        </h1>
        <p style={{
          color: '#8a8a9b',
          fontSize: '1rem',
          fontWeight: 700,
          margin: '6px 0 0',
          letterSpacing: '0.3px',
        }}>
          Each word changes just <span style={{ color: '#a55eea' }}>one sound</span>!
        </p>
      </div>

      {/* Controls */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '14px',
        marginBottom: '32px',
        flexWrap: 'wrap',
      }}>
        {/* Level selector */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0',
          background: 'white',
          borderRadius: '50px',
          padding: '4px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
          border: '2px solid #f0f0f8',
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
                background: level === lvl
                  ? 'linear-gradient(135deg, #a55eea, #4b7bec)'
                  : 'transparent',
                color: level === lvl ? 'white' : '#8a8a9b',
                boxShadow: level === lvl ? '0 2px 8px #a55eea40' : 'none',
              }}
            >
              {lvl === 1 ? 'Level 1' : 'Level 2'}
            </button>
          ))}
        </div>

        {/* Refresh button */}
        <button
          onClick={() => generate(level, chain[chain.length - 1] || null)}
          disabled={isGenerating}
          style={{
            background: 'linear-gradient(135deg, #a55eea, #4b7bec)',
            color: 'white', border: 'none', borderRadius: '50px',
            padding: '12px 28px', fontSize: '1rem', fontWeight: 800,
            cursor: isGenerating ? 'default' : 'pointer',
            boxShadow: '0 6px 20px #a55eea35',
            fontFamily: 'inherit', letterSpacing: '0.4px',
            opacity: isGenerating ? 0.7 : 1,
            transition: 'all 0.2s',
          }}
        >
          {isGenerating ? '⏳ Making...' : '🔀 New Chain!'}
        </button>
      </div>

      {/* Level description */}
      <p style={{
        textAlign: 'center',
        color: '#b0b0c8',
        fontSize: '0.8rem',
        fontWeight: 700,
        marginTop: '-20px',
        marginBottom: '24px',
      }}>
        {level === 1
          ? 'Simple 3-letter words'
          : 'Now with CH, SH, TH sounds!'}
      </p>

      {/* Chain length note if shorter than requested */}
      {!isGenerating && chain.length < CHAIN_LENGTH && chain.length > 0 && (
        <p style={{ textAlign: 'center', color: '#FF9F43', fontWeight: 700, fontSize: '0.85rem', marginBottom: '16px' }}>
          ✨ Found a chain of {chain.length} words
        </p>
      )}

      {/* Word Chain */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '6px',
        maxWidth: '900px',
        margin: '0 auto 36px',
        minHeight: '80px',
      }}>
        {chain.map((word, i) => {
          const changed = i > 0 ? getChangedLetters(chain[i - 1], word) : new Set<number>();
          const cc = CARD_COLORS[i % CARD_COLORS.length];
          const accentColor = PALETTE[i % PALETTE.length];

          return (
            <div key={`${animKey}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {i === 0 ? (
                <span style={{ fontSize: '1.3rem', visibility: 'hidden' }}>→</span>
              ) : (
                <span style={{
                  color: '#d0d0e0',
                  fontSize: '1.3rem',
                  fontWeight: 900,
                  animation: `fadeIn 0.3s ease-out ${i * 0.07 + 0.05}s both`,
                }}>
                  →
                </span>
              )}
              <div
                style={{
                  background: cc.bg,
                  border: `2.5px solid ${cc.border}`,
                  borderRadius: '14px',
                  padding: '10px 14px',
                  boxShadow: `0 4px 14px ${cc.shadow}`,
                  fontSize: 'clamp(1.4rem, 4vw, 1.9rem)',
                  fontWeight: 900,
                  letterSpacing: '5px',
                  display: 'flex',
                  animation: `popIn 0.45s cubic-bezier(0.34,1.56,0.64,1) ${i * 0.07}s both`,
                  cursor: 'default',
                  userSelect: 'none',
                }}
              >
                {word.split('').map((letter, li) => {
                  const isChanged = changed.has(li);
                  return (
                    <span
                      key={li}
                      style={{
                        color: isChanged ? 'white' : '#3a3a5a',
                        background: isChanged ? accentColor : 'transparent',
                        borderRadius: '7px',
                        padding: isChanged ? '0 4px' : '0 2px',
                        display: 'inline-block',
                        transition: 'all 0.2s',
                        textTransform: 'uppercase',
                        fontSize: isChanged ? '105%' : '100%',
                      }}
                    >
                      {letter}
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
        {isGenerating && (
          <div style={{ color: '#b0b0c8', fontWeight: 700, fontSize: '1rem', animation: 'pulse 1s infinite' }}>
            Building chain…
          </div>
        )}
      </div>

      {/* Alphabet Coverage */}
      {chain.length > 0 && (
        <div style={{
          maxWidth: '580px',
          margin: '0 auto',
          background: 'white',
          borderRadius: '24px',
          padding: '20px 24px',
          boxShadow: '0 4px 24px rgba(90,90,160,0.10)',
          border: '2px solid #f0f0fa',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '14px' }}>
            <span style={{ fontSize: '1.2rem' }}>🌈</span>
            <h3 style={{
              margin: 0, fontWeight: 900, color: '#5a5a7a',
              fontSize: '1rem', letterSpacing: '0.3px',
            }}>
              Letters Used
            </h3>
            <span style={{
              background: 'linear-gradient(135deg, #a55eea, #4b7bec)',
              color: 'white', borderRadius: '50px',
              padding: '2px 10px', fontSize: '0.8rem', fontWeight: 800,
            }}>
              {coveredCount} / 26
            </span>
          </div>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '5px',
            justifyContent: 'center',
          }}>
            {ALPHABET.map((l, i) => {
              const hit = covered.has(l);
              const color = PALETTE[i % PALETTE.length];
              return (
                <div
                  key={l}
                  title={hit ? `"${l}" appears in the chain!` : `"${l}" not used yet`}
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '9px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 900,
                    fontSize: '0.9rem',
                    background: hit ? color : '#f3f3f8',
                    color: hit ? 'white' : '#c8c8d8',
                    boxShadow: hit ? `0 3px 8px ${color}50` : 'none',
                    transition: 'all 0.4s',
                    textTransform: 'uppercase',
                    animation: hit ? `popIn 0.4s cubic-bezier(0.34,1.56,0.64,1) ${i * 0.02}s both` : 'none',
                  }}
                >
                  {l}
                </div>
              );
            })}
          </div>
          <p style={{
            textAlign: 'center',
            color: '#a0a0b8',
            fontSize: '0.78rem',
            fontWeight: 700,
            marginTop: '12px',
            marginBottom: 0,
          }}>
            {coveredCount >= 20
              ? '🎉 Amazing coverage!'
              : coveredCount >= 15
              ? '⭐ Great coverage!'
              : 'Try more words to cover more letters!'}
          </p>
        </div>
      )}
    </div>
  );
}
