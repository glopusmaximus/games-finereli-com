# Yara's Games — Style Guide

Design language for all games on games.finereli.com. Extracted from the Word Chain game aesthetic — playful, colorful, readable, and friendly for young readers.

## Typography

- **Font:** Nunito (self-hosted for offline use)
- **Weights:** 700 (bold), 800 (heavy), 900 (black)
- **Game titles:** 900 weight, gradient text via `background-clip: text`
- **Body/labels:** 700 weight
- **Buttons/badges:** 800 weight
- **Letter spacing:** slight positive (0.3–0.5px) for labels, slight negative (-0.5px) for large headings

## Color Palette

### Core
| Token | Value | Usage |
|-------|-------|-------|
| `--color-primary` | `#a55eea` (purple) | Primary buttons, active states, gradient starts |
| `--color-primary-alt` | `#4b7bec` (indigo) | Gradient endpoints, secondary accents |

### Accent Colors (rotate through these for cards, items, progress)
| Name | Value |
|------|-------|
| Red | `#FF6B6B` |
| Orange | `#FF9F43` |
| Yellow | `#F9CA24` |
| Green | `#26de81` |
| Blue | `#45aaf2` |
| Purple | `#a55eea` |
| Teal | `#2bcbba` |
| Pink | `#fc5c65` |

### Backgrounds
- **Page:** `linear-gradient(160deg, #FEF9F2 0%, #F0F7FF 50%, #FBF0FF 100%)` — warm cream to soft blue to light purple
- **Cards:** White (`#ffffff`) with colored borders
- **Card variants:** Use accent colors at 10% opacity for card backgrounds (e.g., `#FFF5F5` for red)

### Text
| Token | Value | Usage |
|-------|-------|-------|
| `--color-text` | `#3a3a5a` | Primary text |
| `--color-text-light` | `#8a8a9b` | Descriptions, secondary |
| `--color-text-muted` | `#b0b0c8` | Disabled, placeholders |

## Gradients

```css
/* Header/title gradient */
background: linear-gradient(135deg, #a55eea, #45aaf2);

/* Primary button gradient */
background: linear-gradient(135deg, #a55eea, #4b7bec);

/* Update/warning banner */
background: linear-gradient(135deg, #FF9F43, #F9CA24);
```

## Cards

Cards are the primary visual unit. Each card:
- White or light-tinted background
- 2.5px solid colored border
- `border-radius: 14–16px`
- Soft colored shadow: `0 4px 14px {color}30`
- On hover: slight lift (`translateY(-4px)`) + scale (`1.02`) + stronger shadow

```css
.card {
  background: #FFF5F5;
  border: 2.5px solid #FF6B6B;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 16px #FF6B6B30;
  transition: transform 0.2s, box-shadow 0.2s;
}
```

## Buttons

### Primary (pill shape)
```css
.button-primary {
  background: linear-gradient(135deg, #a55eea, #4b7bec);
  color: white;
  border: none;
  border-radius: 50px;
  padding: 12px 28px;
  font-weight: 800;
  box-shadow: 0 6px 20px #a55eea35;
}
```

### Circular (increment/decrement)
```css
.button-circle {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: none;
  font-weight: 900;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

Use accent colors for button backgrounds. Disabled = `#e8e8f0` bg, `#bbb` text.

## Animations

Three shared animations defined in `App.css`:

### popIn
Bouncy entrance — scale up from 0.4 with overshoot.
```css
@keyframes popIn {
  0% { opacity: 0; transform: scale(0.4) translateY(10px); }
  70% { transform: scale(1.08) translateY(-3px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}
```
Use with `cubic-bezier(0.34,1.56,0.64,1)` easing and staggered delays (`index * 0.07s`).

### fadeIn
Simple opacity fade.

### pulse
Gentle opacity pulse for loading states.

### slideDown
Banner entrance from top.

## Layout Patterns

### Game grid (home page)
```css
display: grid;
grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
gap: 16px;
max-width: 800px;
```

### Centered content (game views)
```css
max-width: 900px;
margin: 0 auto;
padding: 24px 16px 40px;
```

### Inline items (word chains, letter grids)
```css
display: flex;
flex-wrap: wrap;
justify-content: center;
gap: 5–6px;
```

## Interactive Elements

- **Hover/pointer:** Scale up slightly, deepen shadow. Use `onPointerEnter`/`onPointerLeave` for touch+mouse.
- **Disabled:** Muted colors, `cursor: default`
- **Active feedback:** Immediate visual change (color shift, scale)
- **Transitions:** `0.2s` for interactions, `0.4s` for ambient state changes

## Badges & Pills

Small info badges use gradient backgrounds:
```css
.badge {
  background: linear-gradient(135deg, #a55eea, #4b7bec);
  color: white;
  border-radius: 50px;
  padding: 2px 10px;
  font-size: 0.8rem;
  font-weight: 800;
}
```

## Spacing

Use CSS custom properties:
- `--space-xs`: 6px
- `--space-sm`: 10px
- `--space-md`: 16px
- `--space-lg`: 24px
- `--space-xl`: 32px

## Adding a New Game

1. Create `src/games/my-game/MyGame.tsx`
2. Add entry to `src/games/registry.ts`
3. Use CSS custom properties from `theme.css` for consistency
4. Use shared animations from `App.css`
5. Game-specific styles can be inline or in a co-located CSS file
6. That's it — push and deploy

### Game component template:
```tsx
export default function MyGame() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--color-bg)',
      fontFamily: 'var(--font-family)',
      padding: '24px 16px 40px',
    }}>
      {/* Game header */}
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <h1 style={{
          fontSize: 'clamp(2rem, 6vw, 3rem)',
          fontWeight: 900,
          background: 'linear-gradient(135deg, #a55eea, #45aaf2)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          🎮 My Game
        </h1>
      </div>

      {/* Game content */}
    </div>
  );
}
```

## Mobile-First

- Use `clamp()` for responsive font sizes: `clamp(min, preferred, max)`
- Touch targets minimum 34px (letter tiles) to 40px (buttons)
- Use `min-height: 100dvh` for full-viewport layouts (with `100vh` fallback)
- Test on tablet — that's Yara's primary device
