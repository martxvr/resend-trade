import { useState } from 'react';
import { Check, GripVertical, X } from 'lucide-react';

const AVAILABLE_TIMEFRAMES = [
  { value: '1m', label: '1m' },
  { value: '2m', label: '2m' },
  { value: '3m', label: '3m' },
  { value: '4m', label: '4m' },
  { value: '5m', label: '5m' },
  { value: '15m', label: '15m' },
  { value: '30m', label: '30m' },
  { value: '1h', label: '1h' },
  { value: '2h', label: '2h' },
  { value: '4h', label: '4h' },
  { value: '1D', label: '1D' },
  { value: '1W', label: '1W' },
  { value: '1M', label: '1M' },
  { value: '3M', label: '3M' },
  { value: '1Y', label: '1Y' },
];

const MAX_TIMEFRAMES = 7;

interface TimeframeSelectorProps {
  selected: string[];
  onChange: (timeframes: string[]) => void;
  readonly?: boolean;
}

export function TimeframeSelector({ selected, onChange, readonly = false }: TimeframeSelectorProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const toggleTimeframe = (tf: string) => {
    if (readonly) return;
    
    if (selected.includes(tf)) {
      onChange(selected.filter(t => t !== tf));
    } else if (selected.length < MAX_TIMEFRAMES) {
      onChange([...selected, tf]);
    }
  };

  const removeTimeframe = (tf: string) => {
    if (readonly) return;
    onChange(selected.filter(t => t !== tf));
  };

  const handleDragStart = (index: number) => {
    if (readonly) return;
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (readonly || draggedIndex === null || draggedIndex === index) return;

    const newOrder = [...selected];
    const [removed] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(index, 0, removed);
    
    setDraggedIndex(index);
    onChange(newOrder);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="space-y-6">
      {/* Selected timeframes (ordered) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-foreground">
            Selected Timeframes
          </label>
          <span className="text-xs text-muted-foreground">
            {selected.length}/{MAX_TIMEFRAMES}
          </span>
        </div>
        
        {selected.length === 0 ? (
          <div className="p-4 border border-dashed border-border/50 rounded-xl text-center text-sm text-muted-foreground">
            Select timeframes below
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {selected.map((tf, index) => (
              <div
                key={tf}
                draggable={!readonly}
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`
                  group flex items-center gap-1.5 px-3 py-2 bg-accent-purple/10 text-accent-purple 
                  border border-accent-purple/30 rounded-xl text-sm font-medium
                  ${!readonly ? 'cursor-grab active:cursor-grabbing' : ''}
                  ${draggedIndex === index ? 'opacity-50' : ''}
                  transition-all duration-200
                `}
              >
                {!readonly && (
                  <GripVertical className="w-3 h-3 opacity-50 group-hover:opacity-100" />
                )}
                <span>{tf}</span>
                {!readonly && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeTimeframe(tf);
                    }}
                    className="ml-1 opacity-50 hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Available timeframes */}
      {!readonly && (
        <div>
          <label className="block text-sm font-medium text-foreground mb-3">
            Available Timeframes
          </label>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_TIMEFRAMES.map(({ value, label }) => {
              const isSelected = selected.includes(value);
              const isDisabled = !isSelected && selected.length >= MAX_TIMEFRAMES;
              
              return (
                <button
                  key={value}
                  onClick={() => toggleTimeframe(value)}
                  disabled={isDisabled}
                  className={`
                    relative px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-200
                    ${isSelected 
                      ? 'bg-foreground text-background border-foreground' 
                      : isDisabled
                        ? 'bg-muted/10 text-muted-foreground border-border/30 cursor-not-allowed opacity-50'
                        : 'bg-card/50 text-foreground border-border/50 hover:border-border hover:bg-card'
                    }
                  `}
                >
                  {label}
                  {isSelected && (
                    <Check className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-accent-green text-white rounded-full p-0.5" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export { AVAILABLE_TIMEFRAMES, MAX_TIMEFRAMES };
