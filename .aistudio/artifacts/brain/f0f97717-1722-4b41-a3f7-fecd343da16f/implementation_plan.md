# Implementation Plan - BlockPuzzleTable Game Feel & Interaction Overhaul

We will overhaul `BlockPuzzleTable.tsx` to match the exact tactile feel, responsiveness, and visual polish of authentic Block Blast games.

## Proposed Changes

### 1. Enhanced Drag UX & Y-Offset (`src/components/BlockPuzzleTable.tsx`)
- Apply a `-60px` to `-70px` Y-offset during drag so the finger/cursor stays above the dragged block and never obscures target cells on the 8x8 grid.
- Recalculate `hoverCell` in `handlePointerMove` using the offset pointer position so ghost shadow placement is pixel-perfect.

### 2. Real-Time Ghost Shadow & 3D Glossy Styling
- Render high-fidelity translucent ghost shadows with glowing borders on target grid cells when hovering valid placements.
- Upgrade grid and tray tiles with 3D glossy textures (rounded corners, inner bevel highlights on top-left, darker bottom-right shadows).

### 3. Drop Mechanics: Snap & Elastic Bounce
- Add custom CSS keyframe animation `snapBounce` (`scale(1.15) -> scale(0.95) -> scale(1)`) triggered on newly placed cells upon drop.

### 4. Tile-Based Particle Shatter & Screen Shake
- Remove center splash overlay.
- Implement per-tile pop/shatter animation on cleared cells during line clears.
- Trigger screen shake (`screenShake`) animation on the board container when clearing 2 or more lines (combo >= 2).

### 5. Line-by-Line Indonesian Comments
- Add comprehensive line-by-line Indonesian comments on all modified and new code sections.

## Verification Plan

### Automated Verification
- Run `npm run tsc --noEmit` and `compile_applet` to verify zero TypeScript or build errors.

### Manual Verification
- Open Block Puzzle in the app.
- Drag pieces from tray and verify the Y-offset lifts the piece above the cursor/finger.
- Verify real-time ghost shadow on target grid cells.
- Drop pieces and verify snap-bounce animation.
- Clear lines to verify tile shatter effect and screen shake on combos.
