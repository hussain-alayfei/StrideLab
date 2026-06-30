import React from 'react';

interface SketchAvatarProps {
  name?: string;
  avatarUrl?: string;
  className?: string;
}

export function getGender(avatarUrl?: string, name?: string): 'male' | 'female' {
  if (name) {
    const n = name.toLowerCase();
    if (
      n.includes('سارة') || 
      n.includes('sara') || 
      n.includes('sarah') ||
      n.includes('فاطمة') ||
      n.includes('نورة') ||
      n.includes('منى') ||
      n.includes('هند') ||
      n.includes('ريم') ||
      n.includes('ياسمين') ||
      n.includes('علياء') ||
      n.includes('هيفاء') ||
      n.includes('أمل') ||
      n.includes('عهود') ||
      n.includes('العنود') ||
      n.includes('خلود')
    ) {
      return 'female';
    }
  }
  if (avatarUrl) {
    if (avatarUrl.includes('img=47') || avatarUrl.includes('female') || avatarUrl.includes('47')) {
      return 'female';
    }
  }
  return 'male';
}

export function SketchAvatar({ name, avatarUrl, className = 'w-12 h-12' }: SketchAvatarProps) {
  const gender = getGender(avatarUrl, name);

  return (
    <div 
      className={`rounded-full bg-stone-100 border border-stone-200/40 shadow-sm flex items-center justify-center overflow-hidden transition-all duration-300 shrink-0 ${className}`}
      title={name}
      id={`sketch-avatar-${name ? encodeURIComponent(name) : 'unknown'}`}
    >
      {gender === 'female' ? (
        <svg 
          viewBox="0 0 100 100" 
          fill="none" 
          className="w-full h-full scale-105"
        >
          {/* Background circle */}
          <circle cx="50" cy="50" r="48" fill="#FCE7F3" />
          
          {/* Ponytail Back */}
          <path d="M22 42 C 12 40, 8 52, 14 62 C 18 66, 26 62, 25 51 C 24 40, 30 40, 34 45" fill="#312E81" />
          <circle cx="26" cy="42" r="4" fill="#F472B6" />
          
          {/* Hair Back of Head */}
          <path d="M28 65 C 22 52, 24 32, 40 24 C 46 21, 54 21, 60 23 C 68 26, 73 34, 72 46" fill="#312E81" />
          
          {/* Neck */}
          <path d="M43 72 L 45 56 C 45 56, 46 45, 55 45 C 64 45, 65 56, 65 56 L 67 72" fill="#FDBA74" />
          
          {/* Face */}
          <path d="M43 48 C 43 36, 67 36, 67 48 C 67 60, 43 60, 43 48 Z" fill="#FED7AA" />
          
          {/* Sporty Headband / Cap Visor */}
          <path d="M42 41 C 48 37, 62 37, 68 41 L 69 44 C 63 40, 47 40, 41 44 Z" fill="#EC4899" />
          
          {/* Athletic Sunglasses (Sporty Shield glasses) */}
          <path d="M47 46 H 63 L 61 51 C 57 54, 53 54, 49 51 Z" fill="#1E1B4B" />
          {/* Lens reflection */}
          <path d="M48 47 H 62 L 61 49 H 49 Z" fill="#38BDF8" opacity="0.7" />
          
          {/* Smile */}
          <path d="M51 57 C 53 59, 57 59, 59 57" stroke="#9A3412" strokeWidth="2" strokeLinecap="round" />
          
          {/* Athletic Top / Shirt */}
          <path d="M26 100 C 26 84, 36 74, 50 74 C 64 74, 74 84, 74 100" fill="#EC4899" />
          <path d="M44 74 L 50 83 L 56 74" fill="#FED7AA" />
          
          {/* Collar Accent */}
          <path d="M28 100 L 40 85" stroke="#FCE7F3" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
        </svg>
      ) : (
        <svg 
          viewBox="0 0 100 100" 
          fill="none" 
          className="w-full h-full scale-105"
        >
          {/* Background circle */}
          <circle cx="50" cy="50" r="48" fill="#E0F2FE" />
          
          {/* Hair Back of Head */}
          <path d="M30 46 C 30 26, 70 26, 70 46" fill="#1C1917" />
          <path d="M30 46 C 30 31, 40 21, 50 21 C 60 21, 70 31, 70 46 Z" fill="#1C1917" />
          <path d="M28 41 L 34 33 L 41 36 L 50 31 L 59 36 L 66 33 L 72 41 Z" fill="#1C1917" />
          
          {/* Neck */}
          <path d="M43 72 L 45 56 C 45 56, 46 45, 55 45 C 64 45, 65 56, 65 56 L 67 72" fill="#FDBA74" />
          
          {/* Face */}
          <path d="M43 48 C 43 36, 67 36, 67 48 C 67 60, 43 60, 43 48 Z" fill="#FED7AA" />
          
          {/* Sporty Visor / Cap */}
          <path d="M38 38 C 44 33, 56 33, 62 38 L 74 42 C 68 39, 44 39, 36 42 Z" fill="#047857" />
          
          {/* Athletic Sunglasses (Sporty Shield glasses) */}
          <path d="M47 46 H 63 L 61 51 C 57 54, 53 54, 49 51 Z" fill="#1E1B4B" />
          {/* Lens reflection */}
          <path d="M48 47 H 62 L 61 49 H 49 Z" fill="#34D399" opacity="0.7" />
          
          {/* Smile */}
          <path d="M51 57 C 53 59, 57 59, 59 57" stroke="#9A3412" strokeWidth="2" strokeLinecap="round" />
          
          {/* Athletic Top / Shirt */}
          <path d="M26 100 C 26 84, 36 74, 50 74 C 64 74, 74 84, 74 100" fill="#047857" />
          <path d="M44 74 L 50 83 L 56 74" fill="#FED7AA" />
          
          {/* Collar Accent */}
          <path d="M28 100 L 40 85" stroke="#E0F2FE" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
        </svg>
      )}
    </div>
  );
}

interface CommunitySketchProps {
  name?: string;
  className?: string;
}

export function CommunitySketch({ name = '', className = 'w-full h-48' }: CommunitySketchProps) {
  const isRiyadh = name.includes('الرياض') || name.includes('R7');
  const isJeddah = name.includes('جدة') || name.includes('ساحل');
  const isKhobar = name.includes('الخبر') || name.includes('شرق');

  if (isRiyadh) {
    return (
      <div 
        className={`bg-gradient-to-br from-amber-50 to-orange-100/50 border border-stone-200 rounded-sm flex items-center justify-center p-4 overflow-hidden relative ${className}`}
        id="community-riyadh"
      >
        <div className="absolute inset-0 bg-grid-stone-100 opacity-20 pointer-events-none" />
        
        <svg viewBox="0 0 300 160" fill="none" className="w-full h-full max-h-48 z-10">
          {/* Warm Sun */}
          <circle cx="150" cy="85" r="45" fill="#FEE2E2" opacity="0.8" />
          <circle cx="150" cy="85" r="30" fill="#FEF3C7" opacity="0.9" />
          
          {/* Riyadh Kingdom Centre Tower Silhouette */}
          <g fill="#475569" opacity="0.9">
            <path d="M140 140 L 144 50 L 148 25 C 149 22, 151 22, 152 25 L 156 50 L 160 140 Z" />
            {/* The Ellipse cutout inside Kingdom Centre */}
            <path d="M147 38 C 147 32, 153 32, 153 38 C 153 45, 147 45, 147 38 Z" fill="#FEE2E2" />
          </g>

          {/* Faysaliah Tower on the side */}
          <path d="M110 140 L 115 70 L 117 65 L 119 70 L 124 140 Z" fill="#64748B" opacity="0.6" />
          <circle cx="117" cy="72" r="2.5" fill="#FBBF24" />

          {/* High-quality running track in the foreground */}
          <path d="M20 140 Q 150 110 280 140" stroke="#F43F5E" strokeWidth="6" strokeLinecap="round" />
          <path d="M20 145 Q 150 115 280 145" stroke="#FFFFFF" strokeWidth="1" strokeDasharray="5 5" opacity="0.8" />
          
          {/* Runners - Clean flat silhouettes */}
          {/* Runner 1 */}
          <g fill="#1E293B" transform="translate(70, 95) scale(0.65)">
            <circle cx="20" cy="15" r="4" />
            <path d="M20 20 L 22 35 L 26 48 M22 35 L 14 48" stroke="#1E293B" strokeWidth="3" strokeLinecap="round" />
            <path d="M20 22 L 28 30 L 35 24 M20 22 L 12 28 L 8 22" stroke="#1E293B" strokeWidth="3" strokeLinecap="round" />
          </g>

          {/* Runner 2 */}
          <g fill="#0F766E" transform="translate(190, 90) scale(0.6)">
            <circle cx="20" cy="15" r="4" />
            <path d="M20 20 L 18 35 L 12 48 M18 35 L 24 45 L 30 48" stroke="#0F766E" strokeWidth="3" strokeLinecap="round" />
            <path d="M20 22 L 12 30 L 8 36 M20 22 L 28 26 L 32 18" stroke="#0F766E" strokeWidth="3" strokeLinecap="round" />
          </g>

          {/* Riyadh Typography badge */}
          <rect x="110" y="115" width="80" height="18" rx="4" fill="#1E293B" />
          <text x="150" y="127" fill="#F8FAFC" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">RIYADH URBAN • R7</text>
        </svg>
      </div>
    );
  }

  if (isJeddah) {
    return (
      <div 
        className={`bg-gradient-to-br from-sky-50 to-emerald-100/40 border border-stone-200 rounded-sm flex items-center justify-center p-4 overflow-hidden relative ${className}`}
        id="community-jeddah"
      >
        <div className="absolute inset-0 bg-grid-stone-100 opacity-20 pointer-events-none" />
        
        <svg viewBox="0 0 300 160" fill="none" className="w-full h-full max-h-48 z-10">
          {/* Beautiful Ocean Sun */}
          <circle cx="220" cy="70" r="35" fill="#FEF3C7" />
          
          {/* Sea Waves */}
          <path d="M10 120 Q 80 110 150 120 T 290 120 L 290 150 L 10 150 Z" fill="#0EA5E9" opacity="0.2" />
          <path d="M10 128 Q 75 120 140 128 T 290 128 L 290 150 L 10 150 Z" fill="#0284C7" opacity="0.3" />

          {/* Coastal Palm Trees */}
          <g transform="translate(40, 50)">
            {/* Trunk */}
            <path d="M20 80 Q 15 50 10 20" stroke="#78350F" strokeWidth="3" fill="none" />
            {/* Leaves */}
            <path d="M10 20 Q -5 15 -15 25" stroke="#047857" strokeWidth="2.5" fill="none" />
            <path d="M10 20 Q 5 5 0 -10" stroke="#047857" strokeWidth="2.5" fill="none" />
            <path d="M10 20 Q 25 10 35 15" stroke="#047857" strokeWidth="2.5" fill="none" />
            <path d="M10 20 Q 15 30 20 40" stroke="#047857" strokeWidth="2.5" fill="none" />
          </g>
          
          <g transform="translate(65, 65) scale(0.7)">
            <path d="M20 80 Q 17 50 15 20" stroke="#78350F" strokeWidth="3" fill="none" />
            <path d="M15 20 Q 0 15 -10 22" stroke="#047857" strokeWidth="2.5" fill="none" />
            <path d="M15 20 Q 10 5 5 -8" stroke="#047857" strokeWidth="2.5" fill="none" />
            <path d="M15 20 Q 28 12 35 18" stroke="#047857" strokeWidth="2.5" fill="none" />
          </g>

          {/* Jeddah Coast Lighthouse Outline */}
          <path d="M250 120 L 254 70 L 262 70 L 266 120 Z" fill="#64748B" />
          <rect x="252" y="65" width="12" height="5" fill="#EF4444" />
          <polygon points="258,55 252,65 264,65" fill="#FBBF24" />

          {/* Red Corniche Running Track */}
          <path d="M10 135 L 290 135" stroke="#10B981" strokeWidth="5" strokeLinecap="round" />
          <path d="M10 135 L 290 135" stroke="#FFFFFF" strokeWidth="0.8" strokeDasharray="4 4" />

          {/* Beach Runners */}
          <g fill="#1E293B" transform="translate(120, 95) scale(0.65)">
            <circle cx="20" cy="15" r="4" />
            <path d="M20 20 L 22 35 L 26 48 M22 35 L 14 48" stroke="#1E293B" strokeWidth="3" strokeLinecap="round" />
            <path d="M20 22 L 28 30 L 35 24 M20 22 L 12 28 L 8 22" stroke="#1E293B" strokeWidth="3" strokeLinecap="round" />
          </g>

          {/* Coastal Badge */}
          <rect x="100" y="15" width="100" height="18" rx="4" fill="#0284C7" />
          <text x="150" y="27" fill="#F8FAFC" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">JEDDAH COASTAL RUN</text>
        </svg>
      </div>
    );
  }

  if (isKhobar) {
    return (
      <div 
        className={`bg-gradient-to-br from-emerald-50 to-teal-100/40 border border-stone-200 rounded-sm flex items-center justify-center p-4 overflow-hidden relative ${className}`}
        id="community-khobar"
      >
        <div className="absolute inset-0 bg-grid-stone-100 opacity-20 pointer-events-none" />
        
        <svg viewBox="0 0 300 160" fill="none" className="w-full h-full max-h-48 z-10">
          {/* Sun */}
          <circle cx="150" cy="50" r="24" fill="#FEF3C7" />
          
          {/* Causeway Bridge Arches (King Fahd Causeway) */}
          <path d="M20 110 Q 55 80 90 110" stroke="#94A3B8" strokeWidth="3" fill="none" />
          <path d="M90 110 Q 125 80 160 110" stroke="#94A3B8" strokeWidth="3" fill="none" />
          <path d="M160 110 Q 195 80 230 110" stroke="#94A3B8" strokeWidth="3" fill="none" />
          <path d="M230 110 Q 265 80 300 110" stroke="#94A3B8" strokeWidth="3" fill="none" />
          <line x1="10" y1="110" x2="290" y2="110" stroke="#64748B" strokeWidth="4" />

          {/* Waterfront park walking pier track */}
          <path d="M10 135 L 290 135" stroke="#059669" strokeWidth="6" strokeLinecap="round" />
          <path d="M10 135 L 290 135" stroke="#FFFFFF" strokeWidth="1" strokeDasharray="6 4" />

          {/* Seagulls */}
          <path d="M60 40 Q 65 35 70 40 Q 75 35 80 40" stroke="#475569" strokeWidth="1.2" fill="none" />
          <path d="M210 35 Q 215 30 220 35 Q 225 30 230 35" stroke="#475569" strokeWidth="1.2" fill="none" />

          {/* Runners */}
          <g fill="#064E3B" transform="translate(160, 92) scale(0.65)">
            <circle cx="20" cy="15" r="4" />
            <path d="M20 20 L 22 35 L 26 48 M22 35 L 14 48" stroke="#064E3B" strokeWidth="3" strokeLinecap="round" />
            <path d="M20 22 L 28 30 L 35 24" stroke="#064E3B" strokeWidth="3" strokeLinecap="round" />
          </g>

          {/* Khobar Badge */}
          <rect x="100" y="15" width="100" height="18" rx="4" fill="#047857" />
          <text x="150" y="27" fill="#F8FAFC" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">KHOBAR WATERFRONT</text>
        </svg>
      </div>
    );
  }

  // Default beautiful dynamic graphic for any other community
  return (
    <div 
      className={`bg-stone-50 border border-stone-200 rounded-sm flex items-center justify-center p-4 overflow-hidden relative ${className}`}
      id="community-default"
    >
      <svg viewBox="0 0 300 160" fill="none" className="w-full h-full max-h-48">
        <circle cx="150" cy="80" r="45" fill="#F5F5F4" />
        <circle cx="150" cy="80" r="30" fill="#E7E5E4" />
        
        {/* Dynamic Running Shoe Illustration */}
        <path d="M80 100 C 90 90, 110 75, 140 75 C 160 75, 190 85, 210 95 C 220 100, 210 115, 190 115 C 170 115, 140 120, 110 120 C 90 120, 80 110, 80 100 Z" fill="#14B8A6" opacity="0.8" />
        <path d="M120 75 L 115 90" stroke="#FFFFFF" strokeWidth="2" />
        <path d="M132 75 L 127 90" stroke="#FFFFFF" strokeWidth="2" />
        <path d="M144 76 L 139 91" stroke="#FFFFFF" strokeWidth="2" />
        <path d="M150 90 Q 170 95 190 110" stroke="#FFFFFF" strokeWidth="3" fill="none" />
        
        {/* Athletic track arcs */}
        <path d="M30 130 C 100 110, 200 110, 270 130" stroke="#115E59" strokeWidth="4" strokeLinecap="round" />
        <path d="M20 140 C 100 118, 200 118, 280 140" stroke="#0D9488" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  );
}
