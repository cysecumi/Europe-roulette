import React from 'react';
import { Keyboard, X } from 'lucide-react';

interface HotkeysModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HotkeysModal: React.FC<HotkeysModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const SHORTCUTS = [
    {
      category: 'Blackjack Royale (Aksi Kartu)',
      items: [
        { keys: ['Space', 'Enter'], desc: 'Bagi Kartu (Deal) / Putaran Baru' },
        { keys: ['H'], desc: 'Hit (Ambil kartu tambahan)' },
        { keys: ['S'], desc: 'Stand (Tahan kartu saat ini)' },
        { keys: ['D'], desc: 'Double Down (Gandakan taruhan & 1 kartu)' },
        { keys: ['1..6'], desc: 'Pasang chip $5 s/d $500 pada lingkaran bet' },
        { keys: ['C', 'R'], desc: 'Clear (Hapus) / Rebet (Ulangi taruhan)' }
      ]
    },
    {
      category: 'Roulette Royale (Aksi Meja & Putaran)',
      items: [
        { keys: ['Space', 'Enter'], desc: 'Mulai Putaran (SPIN)' },
        { keys: ['Z'], desc: 'Undo (Batalkan taruhan terakhir)' },
        { keys: ['C'], desc: 'Clear (Hapus semua taruhan)' },
        { keys: ['D'], desc: 'Double 2x (Gandakan semua taruhan)' },
        { keys: ['R'], desc: 'Rebet (Ulangi taruhan sebelumnya)' }
      ]
    },
    {
      category: 'Pasang Taruhan Cepat (Seksi Meja)',
      items: [
        { keys: ['0'], desc: 'Pasang taruhan pada Angka 0 (Zero)' },
        { keys: ['1'], desc: 'Pasang taruhan pada 1st 12 (Dozen 1)' },
        { keys: ['2'], desc: 'Pasang taruhan pada 2nd 12 (Dozen 2)' },
        { keys: ['3'], desc: 'Pasang taruhan pada 3rd 12 (Dozen 3)' },
        { keys: ['4'], desc: 'Pasang taruhan pada 1 - 18 (Low)' },
        { keys: ['5'], desc: 'Pasang taruhan pada EVEN (Genap)' },
        { keys: ['6'], desc: 'Pasang taruhan pada MERAH (Red)' },
        { keys: ['7'], desc: 'Pasang taruhan pada HITAM (Black)' },
        { keys: ['8'], desc: 'Pasang taruhan pada ODD (Ganjil)' },
        { keys: ['9'], desc: 'Pasang taruhan pada 19 - 36 (High)' }
      ]
    },
    {
      category: 'Pilihan Nilai Chip',
      items: [
        { keys: ['←', '→'], desc: 'Ganti nilai chip (Mundur / Maju)' },
        { keys: ['Shift + 1..6'], desc: 'Pilih chip $5, $10, $25, $50, $100, $500' }
      ]
    }
  ];

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
    >
      <div className="w-full max-w-lg bg-slate-900 border border-amber-500/40 rounded-3xl p-6 shadow-2xl relative text-slate-100">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 pb-4 mb-4 border-b border-white/10">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Keyboard className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold font-serif-royal text-amber-300">
              Shortcut Keyboard (Hotkeys)
            </h3>
            <p className="text-xs text-slate-400">
              Kendalikan taruhan dan putaran dengan tombol keyboard
            </p>
          </div>
        </div>

        {/* List of shortcuts */}
        <div className="space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-1">
          {SHORTCUTS.map(group => (
            <div key={group.category} className="space-y-2">
              <span className="text-[11px] uppercase tracking-wider font-bold text-amber-400/90 block">
                {group.category}
              </span>
              <div className="space-y-1.5 bg-black/40 rounded-2xl p-3 border border-white/5">
                {group.items.map(item => (
                  <div
                    key={item.desc}
                    className="flex items-center justify-between text-xs py-1 px-1.5 rounded hover:bg-white/5"
                  >
                    <span className="text-slate-300 font-medium">{item.desc}</span>
                    <div className="flex items-center gap-1">
                      {item.keys.map(k => (
                        <kbd
                          key={k}
                          className="px-2 py-0.5 rounded bg-slate-800 border border-amber-500/30 text-[11px] font-mono font-bold text-amber-300 shadow-sm"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Tip: Anda dapat langsung menekan tombol angka tanpa perlu klik mouse!
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow cursor-pointer transition-colors"
          >
            Mengerti
          </button>
        </div>
      </div>
    </div>
  );
};
