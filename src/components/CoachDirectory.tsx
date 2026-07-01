import { useState, useMemo } from 'react';
import { SketchAvatar } from './SketchAvatar';
import { Search, Star, Users, CheckCircle2, X } from 'lucide-react';
import { Coach } from '../types';

interface CoachDirectoryProps {
  coaches: Coach[];
  selectedCoach: Coach | null;
  onSelectCoach: (coach: Coach) => void;
  athleteGoal?: string;
}

// Lightweight local "fit" scorer: matches the athlete's goal text against a
// coach's declared specializations. Returns a 0-100 suitability score.
function scoreCoachFit(coach: Coach, goal: string): number {
  if (!goal) return 50;
  const g = goal.toLowerCase();
  let score = 40;
  coach.specializations.forEach((spec) => {
    const token = spec.toLowerCase().replace(/[()]/g, '');
    const parts = token.split(/[\s/]+/).filter(p => p.length > 1);
    if (parts.some(p => g.includes(p))) score += 22;
  });
  // Reward high rating slightly as a tie-breaker
  score += Math.round((coach.rating - 4.5) * 8);
  return Math.max(20, Math.min(99, score));
}

export default function CoachDirectory({
  coaches,
  selectedCoach,
  onSelectCoach,
  athleteGoal
}: CoachDirectoryProps) {
  const [query, setQuery] = useState('');
  const [specFilter, setSpecFilter] = useState<string>('all');

  // Unique specialization chips
  const allSpecs = useMemo(() => {
    const set = new Set<string>();
    coaches.forEach(c => c.specializations.forEach(s => set.add(s)));
    return Array.from(set);
  }, [coaches]);

  const ranked = useMemo(() => {
    return coaches
      .map(c => ({ coach: c, fit: scoreCoachFit(c, athleteGoal || '') }))
      .filter(({ coach }) =>
        coach.name.toLowerCase().includes(query.toLowerCase()) &&
        (specFilter === 'all' || coach.specializations.includes(specFilter))
      )
      .sort((a, b) => b.fit - a.fit);
  }, [coaches, query, specFilter, athleteGoal]);

  const topFitId = ranked.length > 0 ? ranked[0].coach.id : null;

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-3xl font-bold text-stone-950 tracking-tight mb-2 font-display">اختر مدربك</h1>
        <p className="text-stone-500 text-sm">تصفّح المدربين المعتمدين واختر الأنسب لهدفك ومستواك. المرشّح الأعلى توافقاً معلّم لك بناءً على هدفك الحالي.</p>
      </div>

      {/* Search + specialization filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 bg-white border border-stone-200 rounded-sm flex items-center">
          <Search className="w-4 h-4 text-stone-400 mr-3 shrink-0" />
          <input
            type="text"
            placeholder="ابحث عن مدرب بالاسم..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent border-none text-xs outline-none px-2 py-2.5 text-stone-800 placeholder-stone-400"
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 hover:bg-stone-100 text-stone-400 rounded-full ml-2">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setSpecFilter('all')}
            className={`shrink-0 px-3 py-1.5 text-[11px] font-bold rounded-sm border transition-colors ${
              specFilter === 'all' ? 'bg-emerald-950 text-white border-emerald-950' : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300'
            }`}
          >
            الكل
          </button>
          {allSpecs.map(spec => (
            <button
              key={spec}
              onClick={() => setSpecFilter(spec)}
              className={`shrink-0 px-3 py-1.5 text-[11px] font-bold rounded-sm border transition-colors ${
                specFilter === spec ? 'bg-emerald-950 text-white border-emerald-950' : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300'
              }`}
            >
              {spec}
            </button>
          ))}
        </div>
      </div>

      {ranked.length === 0 ? (
        <div className="bg-white p-12 border border-stone-200 text-center text-stone-500 text-xs rounded-sm">
          لا يوجد مدرب مطابق لبحثك حالياً.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {ranked.map(({ coach, fit }) => {
            const isSelected = selectedCoach?.id === coach.id;
            const isBestFit = coach.id === topFitId;
            return (
              <div
                key={coach.id}
                className={`bg-white border rounded-sm p-5 flex flex-col justify-between transition-all ${
                  isSelected ? 'border-emerald-600 ring-1 ring-emerald-600/30' : 'border-stone-200 hover:border-stone-300'
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <SketchAvatar name={coach.name} avatarUrl={coach.avatar} className="w-12 h-12" />
                      <div>
                        <h4 className="font-semibold text-stone-900 text-sm">{coach.name}</h4>
                        <div className="flex items-center gap-2 text-[11px] text-stone-400 mt-0.5">
                          <span className="flex items-center gap-0.5"><Star className="w-3 h-3 text-amber-500 fill-amber-500" />{coach.rating}</span>
                          <span className="flex items-center gap-0.5"><Users className="w-3 h-3" />{coach.athletesCount}</span>
                        </div>
                      </div>
                    </div>
                    {isBestFit && !isSelected && (
                      <span className="text-[9px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-sm shrink-0">
                        الأنسب لك
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {coach.specializations.map((spec, i) => (
                      <span key={i} className="text-[10px] text-stone-600 bg-stone-100 px-2 py-0.5 rounded-sm">{spec}</span>
                    ))}
                  </div>

                  <p className="text-[11px] text-stone-500 leading-relaxed">{coach.bio}</p>

                  <div className="flex items-center justify-between text-[10px] text-stone-400 border-t border-stone-100 pt-2">
                    <span>{coach.experience}</span>
                    <span>{coach.region}</span>
                    <span className="font-bold text-stone-700">{coach.pricePerMonth} ر.س/شهر</span>
                  </div>

                  {/* Fit meter */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-stone-400">
                      <span>نسبة التوافق مع هدفك</span>
                      <span className="font-bold text-emerald-800">{fit}%</span>
                    </div>
                    <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-700 rounded-full" style={{ width: `${fit}%` }} />
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onSelectCoach(coach)}
                  disabled={isSelected}
                  className={`w-full mt-4 py-2.5 text-xs font-bold rounded-sm transition-colors ${
                    isSelected
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 cursor-default flex items-center justify-center gap-1.5'
                      : 'bg-emerald-950 text-white hover:bg-emerald-900'
                  }`}
                >
                  {isSelected ? (<><CheckCircle2 className="w-3.5 h-3.5" /> مدربك الحالي</>) : 'اختيار هذا المدرب'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
