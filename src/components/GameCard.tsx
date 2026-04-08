import type { GameEntry } from '../games/registry';

const CARD_COLORS = [
  { bg: '#FFF5F5', border: '#FF6B6B', shadow: '#FF6B6B30' },
  { bg: '#FFF9F0', border: '#FF9F43', shadow: '#FF9F4330' },
  { bg: '#FFFDE7', border: '#F9CA24', shadow: '#F9CA2430' },
  { bg: '#F0FFF4', border: '#26de81', shadow: '#26de8130' },
  { bg: '#EBF5FB', border: '#45aaf2', shadow: '#45aaf230' },
  { bg: '#F5F0FF', border: '#a55eea', shadow: '#a55eea30' },
];

interface Props {
  game: GameEntry;
  index: number;
}

export default function GameCard({ game, index }: Props) {
  const colors = CARD_COLORS[index % CARD_COLORS.length];

  return (
    <a
      href={`#/${game.slug}`}
      style={{
        display: 'block',
        background: colors.bg,
        border: `2.5px solid ${colors.border}`,
        borderRadius: 'var(--radius)',
        padding: '24px 20px',
        textDecoration: 'none',
        color: 'inherit',
        boxShadow: `0 4px 16px ${colors.shadow}`,
        transition: 'transform 0.2s, box-shadow 0.2s',
        cursor: 'pointer',
        animation: `popIn 0.5s cubic-bezier(0.34,1.56,0.64,1) ${index * 0.1}s both`,
      }}
      onPointerEnter={e => {
        e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
        e.currentTarget.style.boxShadow = `0 8px 24px ${colors.shadow}`;
      }}
      onPointerLeave={e => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.boxShadow = `0 4px 16px ${colors.shadow}`;
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '8px',
      }}>
        <span style={{ fontSize: '2.2rem', lineHeight: 1 }}>{game.icon}</span>
        <h2 style={{
          fontSize: 'clamp(1.4rem, 5vw, 1.8rem)',
          fontWeight: 900,
          margin: 0,
          color: 'var(--color-text)',
        }}>
          {game.title}
        </h2>
      </div>
      <p style={{
        fontSize: '0.9rem',
        fontWeight: 700,
        color: 'var(--color-text-light)',
        lineHeight: 1.4,
      }}>
        {game.description}
      </p>
    </a>
  );
}
