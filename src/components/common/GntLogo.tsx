import React from 'react';

interface GntLogoProps {
  variant?: 'full' | 'mark' | 'icon';
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  showSubtitle?: boolean;
}

export const GntLogo: React.FC<GntLogoProps> = ({
  variant = 'full',
  size = 'md',
  className = '',
}) => {
  // Height presets for different placements
  const sizeClasses = {
    sm: 'h-7 max-w-[150px]',
    md: 'h-9 max-w-[200px]',
    lg: 'h-12 max-w-[260px]',
    xl: 'h-16 max-w-[340px]',
    '2xl': 'h-24 max-w-[480px]',
  };

  const heightClass = sizeClasses[size] || 'h-9';

  if (variant === 'icon') {
    return (
      <div
        className={`relative inline-flex items-center justify-center rounded-xl bg-white border border-slate-200/80 shadow-xs overflow-hidden p-1 ${className}`}
        style={{ aspectRatio: '1/1' }}
        title="TAX WORLDD"
      >
        <img
          src="/taxworldd-icon.png"
          alt="TAX WORLDD Icon"
          className="w-full h-full object-contain select-none pointer-events-none"
          draggable={false}
        />
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center justify-center select-none ${className}`}>
      <img
        src="/taxworldd-logo.png"
        alt="TAX WORLDD"
        className={`${heightClass} w-auto object-contain select-none pointer-events-none transition-all duration-200`}
        draggable={false}
      />
    </div>
  );
};

