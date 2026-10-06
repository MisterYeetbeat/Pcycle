import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

export interface DropdownMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  description?: string;
  badge?: string;
  type?: 'action' | 'checkbox' | 'radio' | 'divider' | 'header';
  checked?: boolean;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

interface DropdownMenuProps {
  label: string;
  icon?: React.ReactNode;
  items: DropdownMenuItem[];
  align?: 'left' | 'right';
  variant?: 'default' | 'subtle' | 'primary' | 'compact';
  badgeCount?: number;
  className?: string;
  headerTitle?: string;
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({
  label,
  icon,
  items,
  align = 'left',
  variant = 'default',
  badgeCount,
  className = '',
  headerTitle,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen]);

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/20';
      case 'subtle':
        return 'bg-transparent border-transparent text-neutral-400 hover:text-white hover:bg-neutral-800/60';
      case 'compact':
        return 'bg-neutral-900/90 border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700 py-1 px-2.5 text-[11px]';
      case 'default':
      default:
        return 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700 py-1.5 px-3 text-xs';
    }
  };

  return (
    <div className={`relative inline-block text-left ${className}`} ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-2 rounded-xl border font-mono font-medium transition cursor-pointer select-none ${getVariantStyles()} ${
          isOpen ? 'ring-1 ring-emerald-500/40 border-neutral-700 text-white' : ''
        }`}
        aria-expanded={isOpen}
      >
        {icon && <span className="shrink-0">{icon}</span>}
        <span className="truncate">{label}</span>
        {badgeCount !== undefined && badgeCount > 0 && (
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
            {badgeCount}
          </span>
        )}
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-neutral-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-white' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          className={`absolute z-50 mt-2 min-w-[220px] max-w-[320px] rounded-xl border border-neutral-800 bg-neutral-950/95 p-1.5 shadow-2xl backdrop-blur-md font-mono text-xs ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
          style={{ animation: 'fadeIn 120ms ease-out' }}
        >
          {headerTitle && (
            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-500 border-b border-neutral-800/80 mb-1">
              {headerTitle}
            </div>
          )}

          <div className="space-y-0.5 max-h-[360px] overflow-y-auto select-none">
            {items.map((item) => {
              if (item.type === 'divider') {
                return <div key={item.id} className="my-1 border-t border-neutral-800/80" />;
              }

              if (item.type === 'header') {
                return (
                  <div
                    key={item.id}
                    className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-500"
                  >
                    {item.label}
                  </div>
                );
              }

              const isCheckbox = item.type === 'checkbox';
              const isRadio = item.type === 'radio';

              return (
                <button
                  key={item.id}
                  disabled={item.disabled}
                  onClick={() => {
                    if (item.onClick) item.onClick();
                    if (!isCheckbox) {
                      setIsOpen(false);
                    }
                  }}
                  className={`w-full flex items-center justify-between gap-3 px-2.5 py-1.5 rounded-lg text-left transition cursor-pointer ${
                    item.disabled
                      ? 'opacity-40 cursor-not-allowed text-neutral-600'
                      : item.active || item.checked
                      ? 'bg-neutral-800/90 text-white font-semibold'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {/* Checkbox indicator */}
                    {isCheckbox && (
                      <div
                        className={`h-3.5 w-3.5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                          item.checked
                            ? 'bg-emerald-500 border-emerald-500 text-neutral-950'
                            : 'border-neutral-700 bg-neutral-900 text-transparent'
                        }`}
                      >
                        <Check className="h-2.5 w-2.5 stroke-[3]" />
                      </div>
                    )}

                    {/* Radio indicator */}
                    {isRadio && (
                      <div
                        className={`h-3.5 w-3.5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                          item.checked
                            ? 'border-emerald-500 text-emerald-400'
                            : 'border-neutral-700'
                        }`}
                      >
                        {item.checked && (
                          <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        )}
                      </div>
                    )}

                    {item.icon && <span className="shrink-0">{item.icon}</span>}

                    <div className="truncate">
                      <div className="truncate">{item.label}</div>
                      {item.description && (
                        <div className="text-[10px] text-neutral-500 font-normal truncate">
                          {item.description}
                        </div>
                      )}
                    </div>
                  </div>

                  {item.badge && (
                    <span className="shrink-0 px-1.5 py-0.2 rounded text-[9px] font-bold bg-neutral-800 text-neutral-300 border border-neutral-700">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
