'use client';

import { useRouter } from 'next/navigation';
import type { IntelligenceType } from '@/types';

const INTELLIGENCE_GRID = [
  { code: 'mental' as IntelligenceType, name: 'Mental', icon: 'psychology', color: 'text-blue-400', bg: 'bg-blue-400/10' },
  { code: 'fisica' as IntelligenceType, name: 'Fisica', icon: 'fitness_center', color: 'text-orange-400', bg: 'bg-orange-400/10' },
  { code: 'emocional' as IntelligenceType, name: 'Emocional', icon: 'favorite', color: 'text-primary', bg: 'bg-primary/10' },
  { code: 'social' as IntelligenceType, name: 'Social', icon: 'groups', color: 'text-green-400', bg: 'bg-green-400/10' },
  { code: 'financiera' as IntelligenceType, name: 'Financiera', icon: 'monetization_on', color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  { code: 'creativa' as IntelligenceType, name: 'Tecno', icon: 'memory', color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
];

export function IntelligenceChips() {
  const router = useRouter();

  return (
    <section>
      <h2 className="text-lg font-bold text-white mb-4 px-1">
        Por Inteligencia
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {INTELLIGENCE_GRID.map((intel) => (
          <button
            key={intel.code}
            onClick={() => router.push(`/explorar/inteligencia/${intel.code}`)}
            className="group flex items-center gap-3 p-4 rounded-xl border transition-all duration-300 active:scale-[0.98] border-white/5 bg-gradient-to-br from-white/5 to-white/0 hover:from-primary/20 hover:to-primary/5"
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${intel.bg}`}>
              <span className={`material-icons-round text-xl ${intel.color}`}>
                {intel.icon}
              </span>
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-white">{intel.name}</p>
            </div>
            <span className="material-icons-round text-sm text-white/20 group-hover:translate-x-1 transition-transform duration-300">
              arrow_forward
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
