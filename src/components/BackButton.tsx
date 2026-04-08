export default function BackButton() {
  return (
    <a
      href="#/"
      style={{
        position: 'fixed',
        top: '12px',
        left: '12px',
        zIndex: 100,
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(8px)',
        border: '2px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textDecoration: 'none',
        fontSize: '1.2rem',
        color: 'var(--color-text)',
        boxShadow: 'var(--shadow)',
        transition: 'transform 0.2s',
        cursor: 'pointer',
        fontFamily: 'var(--font-family)',
      }}
      onPointerEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; }}
      onPointerLeave={e => { e.currentTarget.style.transform = ''; }}
      aria-label="Back to games"
    >
      ←
    </a>
  );
}
