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

// Minimal, single-glyph monoline icons — one visual idea per city, no clutter.
function SkylineGlyph({ stroke }: { stroke: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className="w-9 h-9">
      <path d="M10 34 V20 M18 34 V12 L21 8 L24 12 V34 M32 34 V17 M38 34 V24" stroke={stroke} strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 34 H40" stroke={stroke} strokeWidth="2.25" strokeLinecap="round" />
    </svg>
  );
}

function CoastGlyph({ stroke }: { stroke: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className="w-9 h-9">
      <circle cx="24" cy="16" r="6" stroke={stroke} strokeWidth="2.25" />
      <path d="M8 30 Q14 25 20 30 T32 30 T44 30" stroke={stroke} strokeWidth="2.25" strokeLinecap="round" />
      <path d="M8 37 Q14 32 20 37 T32 37 T44 37" stroke={stroke} strokeWidth="2.25" strokeLinecap="round" opacity="0.55" />
    </svg>
  );
}

function CausewayGlyph({ stroke }: { stroke: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className="w-9 h-9">
      <path d="M6 28 Q12 18 18 28 T30 28 T42 28" stroke={stroke} strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 33 H42" stroke={stroke} strokeWidth="2.25" strokeLinecap="round" />
    </svg>
  );
}

function TrackGlyph({ stroke }: { stroke: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className="w-9 h-9">
      <rect x="9" y="14" width="30" height="20" rx="10" stroke={stroke} strokeWidth="2.25" />
      <rect x="15" y="19" width="18" height="10" rx="5" stroke={stroke} strokeWidth="1.75" opacity="0.5" />
    </svg>
  );
}

// Subtle running-route arc, shared across all variants for visual consistency.
function RouteArc({ stroke }: { stroke: string }) {
  return (
    <svg viewBox="0 0 300 40" fill="none" className="absolute bottom-6 left-0 w-full h-8" preserveAspectRatio="none">
      <path d="M20 28 Q150 6 280 28" stroke={stroke} strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.5" />
    </svg>
  );
}

function CommunityEmblem({
  gradient,
  accent,
  glyph,
  className
}: {
  gradient: string;
  accent: string;
  glyph: React.ReactNode;
  className: string;
}) {
  return (
    <div className={`${gradient} rounded-sm flex items-center justify-center overflow-hidden relative ${className}`}>
      <RouteArc stroke={accent} />
      <div className="w-16 h-16 rounded-full bg-white/80 shadow-sm flex items-center justify-center relative z-10">
        {glyph}
      </div>
    </div>
  );
}

export function CommunitySketch({ name = '', className = 'w-full h-48' }: CommunitySketchProps) {
  const isRiyadh = name.includes('الرياض') || name.includes('R7');
  const isJeddah = name.includes('جدة') || name.includes('ساحل');
  const isKhobar = name.includes('الخبر') || name.includes('شرق');

  if (isRiyadh) {
    return (
      <CommunityEmblem
        gradient="bg-gradient-to-br from-amber-50 to-orange-50"
        accent="#C2410C"
        glyph={<SkylineGlyph stroke="#C2410C" />}
        className={className}
      />
    );
  }

  if (isJeddah) {
    return (
      <CommunityEmblem
        gradient="bg-gradient-to-br from-sky-50 to-cyan-50"
        accent="#0369A1"
        glyph={<CoastGlyph stroke="#0369A1" />}
        className={className}
      />
    );
  }

  if (isKhobar) {
    return (
      <CommunityEmblem
        gradient="bg-gradient-to-br from-emerald-50 to-teal-50"
        accent="#047857"
        glyph={<CausewayGlyph stroke="#047857" />}
        className={className}
      />
    );
  }

  return (
    <CommunityEmblem
      gradient="bg-gradient-to-br from-stone-50 to-stone-100"
      accent="#57534E"
      glyph={<TrackGlyph stroke="#57534E" />}
      className={className}
    />
  );
}
