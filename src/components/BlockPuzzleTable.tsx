/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Mengimpor modul React, Hooks (useState, useEffect, useCallback, useRef), dan tipe data yang diperlukan
import React, { useState, useEffect, useCallback, useRef } from 'react';
// Mengimpor fungsi utilitas suara kasino (klik chip, suara menang, suara kalah)
import { playChipClick, playWinChime, playLoseSound } from '../utils/soundEngine';
// Mengimpor ikon Lucide untuk mempercantik antarmuka pengguna minigame
import { Sparkles, Trophy, RotateCcw, Zap, Flame } from 'lucide-react';

// Mendefinisikan antarmuka properti (props) yang diterima oleh komponen BlockPuzzleTable
interface BlockPuzzleTableProps {
  balance: number; // Saldo koin kasino pemain saat ini
  onUpdateBalance: (newBalance: number | ((prev: number) => number)) => void; // Fungsi untuk memperbarui saldo
  showToast: (msg: string, icon?: string) => void; // Fungsi untuk menampilkan pesan toast notifikasi
  winRate: number; // Tingkat kemenangan (win rate) global kasino
  onRewardCoins: (amount: number) => void; // Fungsi callback untuk memberikan reward koin saat kombo terjadi
  onTriggerParticles?: () => void; // Fungsi opsional untuk memicu efek partikel visual kemenangan
}

// Mendefinisikan tipe data untuk struktur bentuk balok di tray
interface BlockShape {
  id: string; // ID unik string untuk setiap balok
  matrix: boolean[][]; // Matriks 2D boolean yang merepresentasikan bentuk balok
  color: string; // Kelas Tailwind CSS atau style warna neon balok
}

// Daftar palet warna neon cerah yang bervariasi dengan efek gradasi dan bayangan
const NEON_COLORS = [
  'bg-pink-500 shadow-[0_0_12px_rgba(236,72,153,0.8)] border-t border-l border-white/40 border-b border-r border-black/60',
  'bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.8)] border-t border-l border-white/40 border-b border-r border-black/60',
  'bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.8)] border-t border-l border-white/40 border-b border-r border-black/60',
  'bg-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.8)] border-t border-l border-white/40 border-b border-r border-black/60',
  'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)] border-t border-l border-white/40 border-b border-r border-black/60',
  'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.8)] border-t border-l border-white/40 border-b border-r border-black/60'
];

// Daftar pustaka bentuk-bentuk balok klasik gaya Block Blast
const SHAPE_TEMPLATES: boolean[][][] = [
  [[true]], // Titik 1x1
  [[true, true]], // Garis horizontal 2
  [[true], [true]], // Garis vertikal 2
  [[true, true, true]], // Garis horizontal 3
  [[true], [true], [true]], // Garis vertikal 3
  [[true, true, true, true]], // Garis horizontal 4
  [[true], [true], [true], [true]], // Garis vertikal 4
  [[true, true], [true, true]], // Kotak 2x2
  [[true, true, true], [true, true, true], [true, true, true]], // Kotak 3x3
  [[true, false], [true, true]], // Bentuk L kecil
  [[true, true, true], [true, false, false]], // Bentuk L besar
  [[true, true, true], [false, true, false]] // Bentuk T
];

// Fungsi utilitas untuk menghasilkan 3 balok acak baru untuk tray di bawah papan
const generateRandomShapes = (): BlockShape[] => {
  // Membuat array kosong untuk menampung 3 balok
  const shapes: BlockShape[] = [];
  // Melakukan perulangan sebanyak 3 kali untuk mengisi tray
  for (let i = 0; i < 3; i++) {
    // Memilih templat matriks secara acak dari daftar SHAPE_TEMPLATES
    const template = SHAPE_TEMPLATES[Math.floor(Math.random() * SHAPE_TEMPLATES.length)];
    // Memilih warna neon secara acak dari NEON_COLORS
    const color = NEON_COLORS[Math.floor(Math.random() * NEON_COLORS.length)];
    // Menambahkan objek balok dengan ID acak unik ke dalam array
    shapes.push({
      id: `shape-${Math.random().toString(36).substr(2, 9)}`,
      matrix: template,
      color: color
    });
  }
  // Mengembalikan array yang berisi 3 balok acak
  return shapes;
};

// Komponen utama BlockPuzzleTable untuk minigame Block Blast klon kasino
export const BlockPuzzleTable: React.FC<BlockPuzzleTableProps> = ({
  balance,
  onUpdateBalance,
  showToast,
  winRate,
  onRewardCoins,
  onTriggerParticles
}) => {
  // State matriks papan permainan 8x8 (menyimpan string warna sel atau null jika kosong)
  const [grid, setGrid] = useState<(string | null)[][]>(() =>
    Array(8).fill(null).map(() => Array(8).fill(null))
  );

  // State tray yang berisi 3 balok aktif yang harus diletakkan pemain ke papan
  const [tray, setTray] = useState<BlockShape[]>(() => generateRandomShapes());

  // State skor permainan saat ini
  const [score, setScore] = useState<number>(0);

  // State status apakah permainan sudah berakhir (Game Over)
  const [isGameOver, setIsGameOver] = useState<boolean>(false);

  // State untuk menyimpan ID balok yang sedang aktif ditarik (drag)
  const [draggingShapeId, setDraggingShapeId] = useState<string | null>(null);

  // State koordinat mouse/touch saat proses drag sedang berlangsung
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);

  // State koordinat sel grid papan yang sedang disorot oleh ghost preview
  const [hoverCell, setHoverCell] = useState<{ r: number; c: number } | null>(null);

  // State untuk memicu animasi getaran papan (screen shake) saat terjadi combo eliminasi >= 2
  const [isScreenShaking, setIsScreenShaking] = useState<boolean>(false);

  // State untuk melacak sel-sel yang baru saja diletakkan atau dihancurkan (untuk animasi snap bounce & tile shatter)
  const [animatedCells, setAnimatedCells] = useState<{ r: number; c: number; type: 'drop' | 'shatter' }[]>([]);

  // Referensi ke elemen DOM kontainer papan grid untuk kalkulasi posisi drop yang presisi
  const gridRef = useRef<HTMLDivElement | null>(null);

  // Fungsi untuk memeriksa apakah suatu bentuk balok dapat diletakkan pada posisi (startR, startC) di grid
  const canPlaceShape = useCallback((shapeMatrix: boolean[][], startR: number, startC: number, currentGrid: (string | null)[][]): boolean => {
    // Mendapatkan jumlah baris pada matriks balok
    const sRows = shapeMatrix.length;
    // Mendapatkan jumlah kolom pada matriks balok
    const sCols = shapeMatrix[0].length;
    // Memeriksa setiap sel di dalam matriks balok
    for (let r = 0; r < sRows; r++) {
      for (let c = 0; c < sCols; c++) {
        // Jika sel balok bernilai true (terisi bagian balok)
        if (shapeMatrix[r][c]) {
          // Menghitung koordinat target pada grid papan
          const targetR = startR + r;
          const targetC = startC + c;
          // Validasi apakah koordinat target berada di luar batas grid 8x8
          if (targetR < 0 || targetR >= 8 || targetC < 0 || targetC >= 8) {
            return false;
          }
          // Validasi apakah sel target pada grid sudah terisi oleh balok lain
          if (currentGrid[targetR][targetC] !== null) {
            return false;
          }
        }
      }
    }
    // Mengembalikan true jika semua sel valid dan kosong
    return true;
  }, []);

  // Fungsi untuk memeriksa apakah masih ada setidaknya satu balok di tray yang dapat dimuat di papan
  const checkCanAnyShapeFit = useCallback((currentTray: BlockShape[], currentGrid: (string | null)[][]): boolean => {
    // Jika tray sudah kosong, maka masih dianggap bisa (karena akan spawn baru)
    if (currentTray.length === 0) return true;
    // Melakukan iterasi untuk setiap balok yang tersisa di tray
    for (const shape of currentTray) {
      // Memeriksa seluruh koordinat sel pada papan 8x8 (baris 0 sampai 7)
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          // Jika balok ini muat di posisi (r, c), kembalikan true
          if (canPlaceShape(shape.matrix, r, c, currentGrid)) {
            return true;
          }
        }
      }
    }
    // Jika tidak ada satu pun balok yang muat di posisi manapun, kembalikan false
    return false;
  }, [canPlaceShape]);

  // Fungsi untuk mereset permainan ke kondisi awal (New Game)
  const handleRestartGame = useCallback(() => {
    // Memutar efek suara klik chip kasino
    playChipClick();
    // Mengosongkan kembali matriks grid 8x8
    setGrid(Array(8).fill(null).map(() => Array(8).fill(null)));
    // Menghasilkan 3 balok acak baru untuk tray
    setTray(generateRandomShapes());
    // Mereset skor pemain menjadi 0
    setScore(0);
    // Mengubah status Game Over menjadi false
    setIsGameOver(false);
    // Mengosongkan status animasi sel
    setAnimatedCells([]);
    // Menampilkan notifikasi toast bahwa permainan dimulai ulang
    showToast('Game Puzzle dimulai ulang!', '🔄');
  }, [showToast]);

  // Fungsi event handler saat pemain mulai menyeret balok (pointer down)
  const handlePointerDown = (e: React.PointerEvent, shapeId: string) => {
    // Mencegah perilaku bawaan browser pada touch/pointer event
    e.preventDefault();
    // Menyimpan ID balok yang sedang ditarik
    setDraggingShapeId(shapeId);
    // Mengatur posisi awal drag berdasarkan koordinat pointer layar
    setDragPos({ x: e.clientX, y: e.clientY });
    // Memutar efek suara klik chip
    playChipClick();
  };

  // Fungsi event handler saat pemain menggerakkan pointer di layar (pointer move dengan Y-Offset 70px)
  const handlePointerMove = (e: React.PointerEvent) => {
    // Jika tidak ada balok yang sedang ditarik, hentikan eksekusi
    if (!draggingShapeId) return;
    // Memperbarui posisi koordinat drag saat ini
    setDragPos({ x: e.clientX, y: e.clientY });

    // Jika elemen referensi grid papan tersedia
    if (gridRef.current) {
      // Mendapatkan dimensi dan posisi bounding box elemen grid di layar
      const rect = gridRef.current.getBoundingClientRect();
      
      // Menerapkan Y-Offset sebesar 70 piksel ke atas agar kursor/jari pemain tidak menutupi sel target
      const adjustedY = e.clientY - 70;

      // Menghitung koordinat relatif x dan y terhadap pojok kiri atas grid dengan Y-offset
      const relX = e.clientX - rect.left;
      const relY = adjustedY - rect.top;

      // Jika koordinat penyesuaian berada di dalam area grid papan
      if (relX >= 0 && relX <= rect.width && relY >= 0 && relY <= rect.height) {
        // Menghitung ukuran satu sel grid dalam piksel
        const cellSize = rect.width / 8;
        // Menentukan indeks kolom target berdasarkan posisi relatif x
        const c = Math.floor(relX / cellSize);
        // Menentukan indeks baris target berdasarkan posisi relatif y
        const r = Math.floor(relY / cellSize);
        // Membatasi indeks baris dan kolom agar tetap dalam rentang 0 sampai 7
        const targetR = Math.max(0, Math.min(7, r));
        const targetC = Math.max(0, Math.min(7, c));
        // Memperbarui state sel yang sedang disorot (hoverCell) untuk real-time ghost shadow
        setHoverCell({ r: targetR, c: targetC });
      } else {
        // Jika kursor di luar grid, set hoverCell menjadi null
        setHoverCell(null);
      }
    }
  };

  // Fungsi event handler saat pemain melepaskan balok (pointer up / drop)
  const handlePointerUp = () => {
    // Jika tidak ada balok yang sedang ditarik, hentikan eksekusi
    if (!draggingShapeId) return;

    // Jika sel target hover valid dan berada di atas papan grid
    if (hoverCell) {
      // Mencari objek balok yang sedang ditarik dari dalam tray
      const shapeToPlace = tray.find(s => s.id === draggingShapeId);

      // Jika balok ditemukan di tray
      if (shapeToPlace) {
        // Memeriksa apakah balok valid dan muat diletakkan di posisi hoverCell
        if (canPlaceShape(shapeToPlace.matrix, hoverCell.r, hoverCell.c, grid)) {
          // Membuat salinan (deep copy) dari matriks grid saat ini
          const newGrid = grid.map(row => [...row]);
          // Mendapatkan jumlah baris bentuk balok
          const sRows = shapeToPlace.matrix.length;
          // Mendapatkan jumlah kolom bentuk balok
          const sCols = shapeToPlace.matrix[0].length;

          // Array untuk mencatat koordinat sel yang baru saja diisi (untuk animasi snap bounce)
          const newlyPlacedCoords: { r: number; c: number; type: 'drop' | 'shatter' }[] = [];

          // Mengisi sel grid dengan warna balok pada posisi yang sesuai
          for (let r = 0; r < sRows; r++) {
            for (let c = 0; c < sCols; c++) {
              if (shapeToPlace.matrix[r][c]) {
                const targetRow = hoverCell.r + r;
                const targetCol = hoverCell.c + c;
                newGrid[targetRow][targetCol] = shapeToPlace.color;
                newlyPlacedCoords.push({ r: targetRow, c: targetCol, type: 'drop' });
              }
            }
          }

          // Memicu state animasi snap bounce pada sel yang baru diletakkan
          setAnimatedCells(newlyPlacedCoords);
          // Menghapus animasi setelah durasi selesai (300ms)
          setTimeout(() => setAnimatedCells([]), 300);

          // Menghapus balok yang sudah diletakkan dari dalam tray
          const remainingTray = tray.filter(s => s.id !== draggingShapeId);

          // -------------------------------------------------------------
          // LOGIKA PEMINDAIAN DAN ELIMINASI BARIS & KOLOM (LINE CLEAR)
          // -------------------------------------------------------------
          // Array untuk mencatat indeks baris mana saja yang penuh
          const rowsToClear: number[] = [];
          // Array untuk mencatat indeks kolom mana saja yang penuh
          const colsToClear: number[] = [];

          // Memindai apakah ada baris yang seluruh 8 kolomnya terisi
          for (let r = 0; r < 8; r++) {
            if (newGrid[r].every(cell => cell !== null)) {
              rowsToClear.push(r);
            }
          }

          // Memindai apakah ada kolom yang seluruh 8 barisnya terisi
          for (let c = 0; c < 8; c++) {
            let isColFull = true;
            for (let r = 0; r < 8; r++) {
              if (newGrid[r][c] === null) {
                isColFull = false;
                break;
              }
            }
            if (isColFull) {
              colsToClear.push(c);
            }
          }

          // Menghitung total garis yang berhasil dibersihkan sekaligus (combo)
          const totalClearedLines = rowsToClear.length + colsToClear.length;

          // Jika ada baris atau kolom yang penuh untuk dibersihkan
          if (totalClearedLines > 0) {
            // Array untuk mencatat sel yang hancur (tile shatter animation)
            const shatterCoords: { r: number; c: number; type: 'drop' | 'shatter' }[] = [];

            // Mengosongkan sel-sel pada baris yang tercatat penuh
            rowsToClear.forEach(r => {
              for (let c = 0; c < 8; c++) {
                shatterCoords.push({ r, c, type: 'shatter' });
                newGrid[r][c] = null;
              }
            });

            // Mengosongkan sel-sel pada kolom yang tercatat penuh
            colsToClear.forEach(c => {
              for (let r = 0; r < 8; r++) {
                shatterCoords.push({ r, c, type: 'shatter' });
                newGrid[r][c] = null;
              }
            });

            // Memicu animasi tile shatter & menetapkan koordinat hancur
            setAnimatedCells(shatterCoords);
            setTimeout(() => setAnimatedCells([]), 400);

            // Jika terjadi kombo eliminasi 2 baris/kolom atau lebih, picu efek screen shake (getaran papan)
            if (totalClearedLines >= 2) {
              setIsScreenShaking(true);
              setTimeout(() => setIsScreenShaking(false), 500);
            }

            // Menghitung perolehan koin kasino berdasarkan jumlah combo baris/kolom:
            // 1 baris/kolom = 10 koin, 2 baris/kolom = 30 koin, 3+ baris/kolom = 60+ koin
            let earnedCoins = 10;
            if (totalClearedLines === 2) earnedCoins = 30;
            else if (totalClearedLines >= 3) earnedCoins = 60 + (totalClearedLines - 3) * 30;

            // Memanggil fungsi callback onRewardCoins untuk memberikan koin kasino ke pemain
            onRewardCoins(earnedCoins);
            // Memutar efek suara kemenangan combo
            playWinChime();
            // Memicu efek partikel visual luar jika tersedia
            onTriggerParticles?.();
            // Menampilkan notifikasi toast pencapaian combo line clear
            showToast(`Combo Clear! ${totalClearedLines} Garis +${earnedCoins} Koin 🪙`, '🔥');
            // Menambahkan poin skor permainan
            setScore(prev => prev + totalClearedLines * 100 + earnedCoins * 5);
          } else {
            // Jika tidak ada garis yang bersih, tambahkan skor dasar penempatan balok
            setScore(prev => prev + 10);
            playChipClick();
          }

          // Variabel penampung tray berikutnya (jika habis, spawn 3 balok baru)
          let nextTray = remainingTray;
          if (nextTray.length === 0) {
            nextTray = generateRandomShapes();
            showToast('Tray baru dimuat!', '✨');
          }

          // Memeriksa kondisi Game Over apakah sisa balok di tray masih bisa dimuat di grid
          if (!checkCanAnyShapeFit(nextTray, newGrid)) {
            setIsGameOver(true);
            playLoseSound();
            showToast('Game Over! Tidak ada ruang tersisa.', '💀');
          }

          // Memperbarui state grid papan dengan grid hasil eliminasi terbaru
          setGrid(newGrid);
          // Memperbarui state tray balok
          setTray(nextTray);
        } else {
          // Jika penempatan tidak valid (menabrak balok lain atau keluar batas)
          showToast('Posisi balok tidak valid!', '⚠️');
        }
      }
    }

    // Mereset state drag setelah interaksi selesai
    setDraggingShapeId(null);
    setDragPos(null);
    setHoverCell(null);
  };

  // Merender komponen antarmuka BlockPuzzleTable (Block Blast Clone dengan UX Juiciness)
  return (
    <div
      className="flex flex-col items-center justify-center w-full max-w-4xl mx-auto p-4 select-none touch-none"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Definisi CSS Keyframes kustom untuk Snap Bounce, Tile Shatter, dan Screen Shake */}
      <style>{`
        @keyframes snapBounce {
          0% { transform: scale(0.7); opacity: 0.6; }
          50% { transform: scale(1.18); }
          80% { transform: scale(0.92); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes tileShatter {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.25) rotate(8deg); opacity: 0.7; filter: brightness(1.5); }
          100% { transform: scale(0); opacity: 0; }
        }
        @keyframes screenShake {
          0%, 100% { transform: translate(0, 0); }
          20% { transform: translate(-4px, 3px); }
          40% { transform: translate(4px, -3px); }
          60% { transform: translate(-3px, -2px); }
          80% { transform: translate(3px, 2px); }
        }
        .animate-snap-bounce {
          animation: snapBounce 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        .animate-tile-shatter {
          animation: tileShatter 0.4s ease-out forwards;
        }
        .animate-screen-shake {
          animation: screenShake 0.4s ease-in-out;
        }
      `}</style>

      {/* Kontainer Kartu Utama Kasino */}
      <div className="relative w-full max-w-xl bg-gradient-to-b from-zinc-950 via-purple-950/30 to-zinc-950 border-2 border-amber-500/40 rounded-3xl p-6 shadow-2xl backdrop-blur-xl flex flex-col items-center">
        
        {/* Header Informasi Permainan (Skor & Saldo Koin) */}
        <div className="w-full flex items-center justify-between mb-5 px-2">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-950/80 border border-purple-500/60 flex items-center justify-center text-amber-400 shadow-[0_0_15px_rgba(168,85,247,0.5)]">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-wider uppercase text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100">
                Block Blast Casino
              </h2>
              <span className="text-[11px] text-slate-400 font-semibold">
                Skor: <strong className="text-amber-400 font-mono">{score}</strong>
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end px-3.5 py-1.5 rounded-2xl bg-black/60 border border-amber-500/30 shadow-inner">
            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
              Reward Koin
            </span>
            <span className="text-sm sm:text-base font-extrabold font-mono text-amber-400 tabular-nums">
              {balance} 🪙
            </span>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* PAPAN PERMAINAN GRID 8x8 DENGAN EFEK SCREEN SHAKE             */}
        {/* ------------------------------------------------------------- */}
        <div
          ref={gridRef}
          className={`relative grid grid-cols-8 gap-1.5 p-3 rounded-2xl bg-black/80 border-2 border-slate-700/60 shadow-[inset_0_4px_20px_rgba(0,0,0,0.9)] w-full max-w-[420px] aspect-square ${
            isScreenShaking ? 'animate-screen-shake' : ''
          }`}
        >
          {/* Melakukan perulangan untuk merender 64 sel grid (8 baris x 8 kolom) */}
          {grid.map((row, r) =>
            row.map((cellColor, c) => {
              // Memeriksa apakah sel ini termasuk dalam area ghost preview balok yang sedang disorot
              let isHoveredCell = false;
              if (draggingShapeId && hoverCell) {
                const shape = tray.find(s => s.id === draggingShapeId);
                if (shape) {
                  const sRows = shape.matrix.length;
                  const sCols = shape.matrix[0].length;
                  const relR = r - hoverCell.r;
                  const relC = c - hoverCell.c;
                  if (relR >= 0 && relR < sRows && relC >= 0 && relC < sCols && shape.matrix[relR][relC]) {
                    isHoveredCell = true;
                  }
                }
              }

              // Menentukan apakah penempatan di sel hover ini valid atau tidak
              const isPlacementValid = hoverCell && draggingShapeId && tray.find(s => s.id === draggingShapeId)
                ? canPlaceShape(tray.find(s => s.id === draggingShapeId)!.matrix, hoverCell.r, hoverCell.c, grid)
                : false;

              // Memeriksa status animasi sel (drop bounce atau tile shatter)
              const cellAnim = animatedCells.find(item => item.r === r && item.c === c);

              // Merender setiap sel grid individu dengan gaya 3D Glossy dan efek animasi
              return (
                <div
                  key={`cell-${r}-${c}`}
                  className={`w-full h-full rounded-lg transition-all duration-150 flex items-center justify-center ${
                    cellColor !== null
                      ? `${cellColor} ${
                          cellAnim?.type === 'drop'
                            ? 'animate-snap-bounce'
                            : cellAnim?.type === 'shatter'
                            ? 'animate-tile-shatter'
                            : 'scale-95 shadow-lg'
                        }` // Jika sel terisi balok dengan tekstur 3D glossy
                      : isHoveredCell
                      ? isPlacementValid
                        ? 'bg-emerald-500/40 border-2 border-emerald-400/80 shadow-[0_0_15px_rgba(52,211,153,0.7)] scale-95 rounded-lg' // Real-time ghost valid hijau
                        : 'bg-rose-500/40 border-2 border-rose-400/80 shadow-[0_0_15px_rgba(244,63,94,0.7)] scale-95 rounded-lg' // Real-time ghost tidak valid merah
                      : 'bg-zinc-900/60 border border-zinc-800/80 hover:bg-zinc-900' // Sel kosong standar
                  }`}
                />
              );
            })
          )}

          {/* Tampilan Overlay Game Over jika permainan berakhir */}
          {isGameOver && (
            <div className="absolute inset-0 z-40 rounded-2xl bg-black/90 backdrop-blur-md flex flex-col items-center justify-center gap-4 p-6 animate-fade-in">
              <div className="w-14 h-14 rounded-2xl bg-rose-950/80 border border-rose-500 flex items-center justify-center text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.6)]">
                <Flame className="w-7 h-7 animate-pulse" />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-black text-rose-400 tracking-wider uppercase">
                  Game Over
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  Tidak ada ruang tersisa untuk balok di tray!
                </p>
                <span className="inline-block mt-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 font-mono text-xs font-bold border border-amber-400/40">
                  Skor Akhir: {score}
                </span>
              </div>
              <button
                type="button"
                onClick={handleRestartGame}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(251,191,36,0.5)] hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" /> Main Lagi
              </button>
            </div>
          )}
        </div>

        {/* ------------------------------------------------------------- */}
        {/* TRAY PEMUNCUL BALOK DI BAGIAN BAWAH                           */}
        {/* ------------------------------------------------------------- */}
        <div className="w-full mt-6 grid grid-cols-3 gap-3 p-4 rounded-2xl bg-black/60 border border-slate-800/80 items-center justify-items-center min-h-[130px]">
          {tray.map(shape => {
            const isBeingDragged = draggingShapeId === shape.id;
            // Merender preview bentuk balok di dalam tray dengan tekstur 3D glossy
            return (
              <div
                key={shape.id}
                onPointerDown={e => handlePointerDown(e, shape.id)}
                className={`relative p-3 rounded-2xl bg-zinc-900/80 border border-slate-700/60 flex items-center justify-center cursor-grab active:cursor-grabbing hover:border-purple-500/60 transition-all ${
                  isBeingDragged ? 'opacity-30 scale-95' : 'opacity-100 shadow-md hover:scale-105'
                }`}
                style={{ minWidth: '90px', minHeight: '90px' }}
              >
                {/* Grid miniatur representasi bentuk balok di tray */}
                <div
                  className="grid gap-1"
                  style={{
                    gridTemplateColumns: `repeat(${shape.matrix[0].length}, minmax(0, 1fr))`
                  }}
                >
                  {shape.matrix.map((rArr, rIdx) =>
                    rArr.map((isFilled, cIdx) => (
                      <div
                        key={`mini-${rIdx}-${cIdx}`}
                        className={`w-4 h-4 rounded-md ${
                          isFilled ? `${shape.color}` : 'bg-transparent'
                        }`}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Floating Ghost Drag Element dengan Y-Offset -70px di atas sentuhan jari/kursor */}
        {draggingShapeId && dragPos && (() => {
          const shape = tray.find(s => s.id === draggingShapeId);
          if (!shape) return null;
          return (
            <div
              className="fixed pointer-events-none z-50 opacity-90 scale-115 transition-transform duration-75"
              style={{
                left: `${dragPos.x - 45}px`,
                top: `${dragPos.y - 75}px` // Y-Offset 75px ke atas agar jari tidak menutupi sel target
              }}
            >
              <div
                className="grid gap-1 p-2.5 rounded-2xl bg-black/60 backdrop-blur-md border border-amber-400/40 shadow-[0_10px_30px_rgba(0,0,0,0.8)]"
                style={{
                  gridTemplateColumns: `repeat(${shape.matrix[0].length}, minmax(0, 1fr))`
                }}
              >
                {shape.matrix.map((rArr, rIdx) =>
                  rArr.map((isFilled, cIdx) => (
                    <div
                      key={`drag-${rIdx}-${cIdx}`}
                      className={`w-6 h-6 rounded-lg ${
                        isFilled ? `${shape.color}` : 'bg-transparent'
                      }`}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })()}

      </div>
    </div>
  );
};
