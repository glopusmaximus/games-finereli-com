export default function UpdateBanner() {
  const reload = () => {
    // Tell SW to skip waiting, then reload
    navigator.serviceWorker?.controller?.postMessage({ type: 'SKIP_WAITING' });
    window.location.reload();
  };

  return (
    <div
      onClick={reload}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        background: 'linear-gradient(135deg, #FF9F43, #F9CA24)',
        color: '#3a3a5a',
        textAlign: 'center',
        padding: '10px 16px',
        fontSize: '0.9rem',
        fontWeight: 800,
        cursor: 'pointer',
        animation: 'slideDown 0.3s ease-out',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        fontFamily: 'var(--font-family)',
      }}
    >
      New games available! Tap to update.
    </div>
  );
}
