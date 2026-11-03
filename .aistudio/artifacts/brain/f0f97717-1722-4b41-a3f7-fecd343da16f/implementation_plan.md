# Implementation Plan - Plinko Minigame

We will implement the iconic **Plinko** arcade casino game featuring smooth HTML5 Canvas 2D physics simulation, triangle peg arrangement, configurable rows, risk levels, and Win Rate integration.

## Proposed Changes

### 1. Plinko Component (`src/components/PlinkoTable.tsx`)
- **Physics Engine (2D Canvas)**:
  - Smooth 60fps canvas animation loop managing active falling balls, velocity, gravity, peg collisions, and bin landing detection.
  - Precise peg triangle grid calculation based on row count (8 to 16 rows, default 12).
- **Configuration Controls**:
  - **Rows Selector**: 8, 10, 12, 14, 16 rows.
  - **Risk Level Selector**: Low, Medium, High.
  - **Dynamic Multipliers**: Generates multiplier slots at the bottom based on row count and risk level (smaller multipliers in center, massive multipliers up to x1000 at edges).
  - **Bet Amount & Drop Ball**: Input bet amount, click "Drop Ball", deducts balance, launches ball from top apex.
- **Sound & Effects Integration**:
  - Play chip drop / peg bounce clicks (`playChipClick`) via Web Audio API.
  - Trigger winning chimes and particle bursts (`ParticleOverlay`) when balls land in high multiplier bins.
- **Win Rate & Balance Integration**:
  - Dynamically updates player balance upon ball landing in multiplier bins.
  - Respects global `winRate` setting (0% - 100%) by introducing slight intelligent trajectory bias upon peg bounces.

### 2. Navigation Integration (`src/App.tsx`)
- Add Plinko game mode to `activeGame` state and game switcher tabs in header.

## Verification Plan

### Automated Verification
- Run `npm run tsc --noEmit` and `compile_applet` to ensure zero compilation errors.

### Manual Verification
- Switch to Plinko game mode.
- Change row count (8 to 16) and risk levels (Low, Medium, High) and verify dynamic multiplier updates.
- Drop ball and observe 2D physics bouncing off pegs into multiplier bins.
- Verify balance updates, sound effects, and win/loss notifications.
