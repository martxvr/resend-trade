import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

type BiasType = 'bullish' | 'bearish' | 'neutral';

interface TimeframeBiases {
  [timeframe: string]: BiasType;
}

interface TimeframeBiasGridProps {
  timeframes: string[];
  biases: TimeframeBiases;
  onBiasChange: (timeframe: string, bias: BiasType) => void;
  disabled?: boolean;
}

const biasConfig = {
  bullish: {
    label: 'Bull',
    icon: TrendingUp,
    color: 'text-accent-green',
    bg: 'bg-accent-green/15',
    border: 'border-accent-green/40',
    glow: 'shadow-[0_0_15px_rgba(34,197,94,0.25)]'
  },
  bearish: {
    label: 'Bear',
    icon: TrendingDown,
    color: 'text-red-400',
    bg: 'bg-red-400/15',
    border: 'border-red-400/40',
    glow: 'shadow-[0_0_15px_rgba(248,113,113,0.25)]'
  },
  neutral: {
    label: 'Neutral',
    icon: Minus,
    color: 'text-muted-foreground',
    bg: 'bg-muted/5',
    border: 'border-border/40',
    glow: ''
  }
};

const biasSequence: BiasType[] = ['neutral', 'bullish', 'bearish'];

export function TimeframeBiasGrid({ 
  timeframes, 
  biases, 
  onBiasChange, 
  disabled = false 
}: TimeframeBiasGridProps) {
  
  const cycleBias = (timeframe: string) => {
    if (disabled) return;
    
    const currentBias = biases[timeframe] || 'neutral';
    const currentIndex = biasSequence.indexOf(currentBias);
    const nextBias = biasSequence[(currentIndex + 1) % biasSequence.length];
    onBiasChange(timeframe, nextBias);
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
      {timeframes.map((tf) => {
        const bias = biases[tf] || 'neutral';
        const config = biasConfig[bias];
        const Icon = config.icon;

        return (
          <button
            key={tf}
            onClick={() => cycleBias(tf)}
            disabled={disabled}
            className={`
              group relative p-4 rounded-2xl border-2 transition-all duration-300 
              ${config.border} ${config.bg} ${config.glow}
              ${disabled 
                ? 'cursor-not-allowed opacity-60' 
                : 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]'
              }
            `}
          >
            {/* Timeframe label */}
            <div className="text-center mb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {tf}
              </span>
            </div>
            
            {/* Bias indicator */}
            <div className={`flex flex-col items-center gap-1 ${config.color}`}>
              <Icon className="w-6 h-6 transition-transform duration-200 group-hover:scale-110" />
              <span className="text-xs font-medium">{config.label}</span>
            </div>

            {/* Active indicator dot */}
            {bias !== 'neutral' && (
              <div 
                className={`absolute top-2 right-2 w-2 h-2 rounded-full animate-pulse
                  ${bias === 'bullish' ? 'bg-accent-green' : 'bg-red-400'}
                `} 
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

// Calculate aggregate bias from timeframe biases
export function calculateAggregateBias(biases: TimeframeBiases, timeframes: string[]): {
  overallBias: BiasType;
  bullishCount: number;
  bearishCount: number;
  neutralCount: number;
} {
  let bullishCount = 0;
  let bearishCount = 0;
  let neutralCount = 0;

  timeframes.forEach(tf => {
    const bias = biases[tf] || 'neutral';
    if (bias === 'bullish') bullishCount++;
    else if (bias === 'bearish') bearishCount++;
    else neutralCount++;
  });

  let overallBias: BiasType = 'neutral';
  if (bullishCount > bearishCount && bullishCount > neutralCount) {
    overallBias = 'bullish';
  } else if (bearishCount > bullishCount && bearishCount > neutralCount) {
    overallBias = 'bearish';
  }

  return { overallBias, bullishCount, bearishCount, neutralCount };
}

export { biasConfig, type BiasType, type TimeframeBiases };
