# Roulette Royale Premium - Enhanced European Roulette

A luxury European Roulette web application delivering realistic 2D canvas wheel dynamics, multi-phase ball deflection and deceleration physics, classic casino table betting, and seamless chip controls.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following user preferences were confirmed during the interactive interview:
> - **Wheel Rendering**: Enhanced 2D canvas with premium lighting, polished wood & brass rim textures, and multi-stage ball physics (deceleration, fret deflection, pocket settling).
> - **Audio Profile**: Silent mode (no audio), keeping performance lightweight and distraction-free.
> - **Betting Scope**: Classic simple European table (Single Zero, Numbers 1–36, 12s, Columns, Red/Black, Even/Odd, Low/High) with refined casino typography, responsive felt styling, and stackable chips.

- **Confirmed Decision 1**: Modern React + TypeScript SPA architecture with modular canvas simulation, avoiding unnecessary heavy 3D engine overhead while achieving 60fps physics fidelity.
- **Confirmed Decision 2**: Local storage persistence for player bankroll and session history so progress is preserved across page refreshes, with a quick-reset/reload bankroll mechanism.

---

## 1. Overview & Core Concept

- **What It Does**: Provides an authentic casino European Roulette experience right in the browser. Players place bets across standard single numbers and outside bets using draggable or selectable casino chips ($5 to $500), trigger a realistic spin sequence where a simulated ball orbits and bounces into pockets, and receive instant payouts with round history tracking.
- **Target Audience**: Casual gaming enthusiasts who appreciate polished casino aesthetics, smooth tactile interactions, and clear statistical feedback.
- **Key Value**: Replaces the basic prototype with an ultra-fluid, responsive, high-DPI canvas wheel simulation, tactile chip stacking, and intuitive betting controls (Undo, Rebet, 2x Double, Clear).

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Bankroll & Chip Selection**: The user selects a chip denomination ($5, $10, $25, $50, $100, $500) from the rack.
2. **Bet Placement**: The user clicks cells on the green felt betting table (straight-up numbers, dozens, columns, even-money bets). Chips stack neatly with visual count badges.
3. **Bet Adjustments**: The user can Undo the last bet, Double all current bets (2x), Clear the board, or Rebet the previous round's layout.
4. **Spinning & Physics Sequence**: Clicking **SPIN** initiates the animation:
   - The wheel rotates with realistic inertia and friction.
   - The ball launches counter-clockwise on the outer ball-track at high velocity.
   - As speed decays, gravity draws the ball inward past bronze deflector frets (diamonds).
   - The ball bounces realistically before settling firmly into the winning numbered pocket.
5. **Result & Payout Celebration**: The winning number highlights on the table and history bar; winnings are animated into the bankroll with positive feedback badges.

### Visual Identity & Theme
- **Aesthetic Direction**: High-end European Monte Carlo casino aesthetic. Polished mahogany wood trim, deep imperial green baize felt (`#0B3B24` to `#062114`), polished brass/gold accents (`#E2C044`, `#F59E0B`), and crisp ivory markings.
- **Color Palette**:
  - Felt Canvas: Deep casino emerald green (`#0a3723` with radial gradient felt depth).
  - Wheel Rim & Accents: Lustrous brass and gold gradients (`#fef08a`, `#e2c044`, `#92400e`).
  - Roulette Colors: European standard French red (`#dc2626`), deep obsidian black (`#18181b`), and emerald zero (`#10b981`).
  - Text & Accents: Crisp white and champagne gold, with high-contrast tabular readouts.
- **Typography & Hierarchy**:
  - Display Font: `Playfair Display` serif for luxury casino headings.
  - Body & Numbers: `Plus Jakarta Sans` with `tabular-nums` for all bankroll and bet counters.
- **Spatial Composition**:
  - Desktop (1440px): Side-by-side layout with the dedicated Wheel Studio on the left (420px) and the expansive Casino Table and Control Dock on the right.
  - Mobile & Tablet: Vertical stacked view with responsive table scrolling and horizontal chip rack.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: High-DPI 2D Canvas vs. 3D WebGL**:
  - *Chosen Approach*: Enhanced 2D HTML5 Canvas with custom radial lighting, shadows, and calibrated kinematic ball physics.
  - *Why*: User confirmed preference for 2D canvas; delivers instantaneous load times, zero WebGL context loss issues, flawless mobile touch performance, and 60fps rendering.
  - *Alternatives Considered*: Three.js 3D scene (deferred as per user's explicit preference).
- **Decision 2: Realistic Kinematic Ball Simulation with Deflectors**:
  - *Chosen Approach*: Three-phase physics loop: Orbital decay -> Diamond deflector collision bounce -> Pocket descent and resonance lock.
  - *Why*: Eliminates the mechanical "preset ease-out" feel of the initial prototype, providing genuine tension and anticipation as the ball chatters over pocket frets.
- **Decision 3: Complete Bet Management State Machine**:
  - *Chosen Approach*: Immutable bet history stack supporting single-step Undo, bulk Clear, 2x Double, and 1-click Rebet of previous round bets.
  - *Why*: Standard casino table ergonomics that players expect for fluid betting rhythm.

---

## 4. Technical Architecture & Data Strategy

### System Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Roulette Royale Premium                         │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
           ┌─────────────────────────┴────────────────────────┐
           ▼                                                  ▼
┌─────────────────────────────┐                    ┌─────────────────────┐
│       WheelViewport         │                    │   BettingStation    │
│  - High-DPI Canvas          │                    │  - Felt Table Grid  │
│  - 60fps Physics Engine     │                    │  - Chip Stacking UI │
│  - Orbital Ball Dynamics    │                    │  - History Tracker  │
│  - Pocket Fret Deflection   │                    │  - Action Controls  │
└──────────────┬──────────────┘                    └──────────┬──────────┘
               │                                              │
               └──────────────────────┬───────────────────────┘
                                      ▼
                      ┌───────────────────────────────┐
                      │        Game State Core        │
                      │  - Bankroll & Current Bets    │
                      │  - Bet History & Undo Stack   │
                      │  - Spin Phase State Machine   │
                      │  - European Payout Evaluator  │
                      │  - LocalStorage Persistence   │
                      └───────────────────────────────┘
```

### Component Breakdown
1. **`App.tsx`**: Root game container handling game phase (`IDLE`, `SPINNING`, `SETTLED`), persistent balance, toast notifications, and layout grid.
2. **`components/RouletteWheel.tsx`**: Isolated 60fps Canvas component running the physics simulation (wheel rotational velocity, ball angular & radial velocity, deflector bounces, and pocket locking).
3. **`components/BettingTable.tsx`**: Classic European roulette grid with Straight-up (0–36), 1st/2nd/3rd Dozens, Columns 1–3, Even/Odd, Red/Black, and 1–18/19–36.
4. **`components/ChipRack.tsx`**: Interactive denomination selector ($5, $10, $25, $50, $100, $500) with luxury casino chip graphics.
5. **`components/ControlDock.tsx`**: Action buttons with state gates (`SPIN`, `UNDO`, `DOUBLE`, `CLEAR`, `REBET`).
6. **`components/HistoryBar.tsx`**: Rolling badge history of recent winning numbers with hot/cold summary.
7. **`components/WinModal.tsx`**: Clean celebratory popup on winning rounds displaying payout multiplier and total return.
8. **`utils/rouletteEngine.ts`**: Pure calculation logic for European wheel order, payouts, win evaluations, and random seed generation.

### Verification Plan
- Verify all chip placement, undo, double, and clear actions with bankroll synchronization.
- Verify ball physics across full spin cycles, ensuring the ball lands precisely in the calculated pocket slot without misalignment.
- Verify European payouts (35:1 straight, 2:1 dozens/columns, 1:1 outside bets).
- Run `compile_applet` and test responsiveness on mobile and desktop viewports.
