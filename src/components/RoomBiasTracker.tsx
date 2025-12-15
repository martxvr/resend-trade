import { RotateCcw, Eye, Users2 } from "lucide-react";
import { useBiasSound } from "@/hooks/useBiasSound";
import { useInView } from "@/hooks/useInView";

type BiasState = "neutral" | "bullish" | "bearish";

interface TimeframeBias {
  label: string;
  bias: BiasState;
}

interface RoomBiasTrackerProps {
  timeframes: string[];
  myBiases: Record<string, BiasState>;
  onBiasChange: (timeframe: string, newBias: BiasState) => void;
  canInteract: boolean;
  participationMode: 'participate' | 'follow';
  isOwner: boolean;
  onToggleMode?: () => void;
  onReset?: () => void;
  stats: {
    bullishCount: number;
    bearishCount: number;
    neutralCount: number;
  };
}

const RoomBiasTracker = ({
  timeframes,
  myBiases,
  onBiasChange,
  canInteract,
  participationMode,
  isOwner,
  onToggleMode,
  onReset,
  stats
}: RoomBiasTrackerProps) => {
  const { ref, isInView } = useInView({ threshold: 0.1 });
  const { playBiasSound, isMuted } = useBiasSound();

  const cycleBias = (timeframe: string) => {
    if (!canInteract) return;
    
    const currentBias = myBiases[timeframe] || "neutral";
    const nextBias: BiasState = 
      currentBias === "neutral" ? "bullish" :
      currentBias === "bullish" ? "bearish" : "neutral";
    
    playBiasSound(nextBias);
    onBiasChange(timeframe, nextBias);
  };

  const getBiasStyles = (bias: BiasState, canClick: boolean) => {
    const baseStyles = canClick 
      ? "hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
      : "cursor-not-allowed";
    
    switch (bias) {
      case "bullish":
        return `border-success/40 bg-success/5 text-success shadow-[0_0_30px_-10px_hsl(var(--success)/0.3)] ${canClick ? 'hover:border-success/60 hover:shadow-[0_0_40px_-10px_hsl(var(--success)/0.4)]' : 'opacity-70'} ${baseStyles}`;
      case "bearish":
        return `border-destructive/40 bg-destructive/5 text-destructive shadow-[0_0_30px_-10px_hsl(var(--destructive)/0.3)] ${canClick ? 'hover:border-destructive/60 hover:shadow-[0_0_40px_-10px_hsl(var(--destructive)/0.4)]' : 'opacity-70'} ${baseStyles}`;
      default:
        return `border-border/50 bg-card/50 text-muted-foreground ${canClick ? 'hover:border-border hover:bg-card/80' : 'opacity-70'} ${baseStyles}`;
    }
  };

  const getOverallBias = (): BiasState => {
    if (stats.bullishCount > stats.bearishCount && stats.bullishCount > stats.neutralCount) return "bullish";
    if (stats.bearishCount > stats.bullishCount && stats.bearishCount > stats.neutralCount) return "bearish";
    return "neutral";
  };

  const overallBias = getOverallBias();

  const getOverallBiasStyles = (bias: BiasState) => {
    switch (bias) {
      case "bullish":
        return "border-success/50 text-success bg-success/5 shadow-[0_0_50px_-15px_hsl(var(--success)/0.4)]";
      case "bearish":
        return "border-destructive/50 text-destructive bg-destructive/5 shadow-[0_0_50px_-15px_hsl(var(--destructive)/0.4)]";
      default:
        return "border-border/50 text-muted-foreground bg-card/30";
    }
  };

  // Build timeframe biases array
  const timeframeBiases: TimeframeBias[] = timeframes.map(tf => ({
    label: tf,
    bias: myBiases[tf] || "neutral"
  }));

  return (
    <div ref={ref}>
      {/* Mode Indicator */}
      <div 
        className={`mb-8 flex items-center justify-center gap-4 transition-all duration-700 ${
          isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-300 ${
          participationMode === 'follow' 
            ? 'bg-accent-purple/10 border-accent-purple/30 text-accent-purple' 
            : 'bg-success/10 border-success/30 text-success'
        }`}>
          {participationMode === 'follow' ? (
            <>
              <Eye className="w-4 h-4" />
              <span className="text-sm font-medium">Follow Mode</span>
            </>
          ) : (
            <>
              <Users2 className="w-4 h-4" />
              <span className="text-sm font-medium">Participate Mode</span>
            </>
          )}
        </div>

        {isOwner && onToggleMode && (
          <button
            onClick={onToggleMode}
            className="px-3 py-1.5 text-xs font-medium text-muted-foreground border border-border/50 rounded-lg hover:border-border hover:text-foreground transition-all duration-200"
          >
            Switch to {participationMode === 'follow' ? 'Participate' : 'Follow'}
          </button>
        )}
      </div>

      {/* Timeframe Grid - Matches homepage BiasTracker exactly */}
      <div 
        className={`mb-16 grid gap-3 transition-all duration-1000 delay-100 md:gap-4 ${
          isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
        style={{
          gridTemplateColumns: `repeat(${Math.min(timeframes.length, 5)}, minmax(0, 1fr))`
        }}
      >
        {timeframeBiases.map((tf, index) => (
          <button
            key={tf.label}
            onClick={() => cycleBias(tf.label)}
            disabled={!canInteract}
            className={`group relative flex flex-col items-center justify-center rounded-2xl border p-5 md:p-8 transition-all duration-300 ${getBiasStyles(tf.bias, canInteract)}`}
            style={{ transitionDelay: `${index * 50}ms` }}
          >
            {/* Glow effect on hover */}
            <div 
              className={`absolute inset-0 rounded-2xl transition-opacity duration-300 ${canInteract ? 'opacity-0 group-hover:opacity-100' : 'opacity-0'}`}
              style={{
                background: tf.bias === "bullish" 
                  ? "radial-gradient(circle at center, hsl(var(--success) / 0.1), transparent 70%)"
                  : tf.bias === "bearish"
                  ? "radial-gradient(circle at center, hsl(var(--destructive) / 0.1), transparent 70%)"
                  : "radial-gradient(circle at center, hsl(var(--foreground) / 0.03), transparent 70%)"
              }}
            />
            
            <span className="relative text-xl font-medium md:text-2xl">{tf.label}</span>
            <span className="relative mt-2 text-[10px] uppercase tracking-[0.15em] opacity-70">
              {tf.bias}
            </span>

            {/* Disabled overlay indicator */}
            {!canInteract && (
              <div className="absolute inset-0 rounded-2xl bg-background/20 backdrop-blur-[1px]" />
            )}
          </button>
        ))}
      </div>

      {/* Overall Bias - Matches homepage exactly */}
      <div 
        className={`mb-12 flex flex-col items-center transition-all duration-1000 delay-200 ${
          isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <div className={`rounded-2xl border px-10 py-6 text-center transition-all duration-500 ${getOverallBiasStyles(overallBias)}`}>
          <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Your Overall Bias</span>
          <span className="mt-2 block text-2xl font-medium uppercase tracking-wide">
            {overallBias}
          </span>
        </div>
        
        <div className="mt-6 flex items-center gap-6 text-sm text-muted-foreground">
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-success animate-pulse" style={{ animationDuration: '2s' }} />
            Bullish: {stats.bullishCount}
          </span>
          <span className="text-border">·</span>
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" style={{ animationDuration: '2s', animationDelay: '0.5s' }} />
            Bearish: {stats.bearishCount}
          </span>
          <span className="text-border">·</span>
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-muted" />
            Neutral: {stats.neutralCount}
          </span>
        </div>
      </div>

      {/* Reset Button - Owner only */}
      {isOwner && onReset && (
        <div 
          className={`flex flex-col items-center gap-8 transition-all duration-1000 delay-300 ${
            isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <button
            onClick={onReset}
            className="group btn-glow inline-flex items-center gap-2 rounded-xl border border-border/50 bg-card/30 px-6 py-2.5 text-sm text-muted-foreground transition-all duration-300 hover:border-border hover:bg-card/50 hover:text-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5 transition-transform duration-500 group-hover:-rotate-180" />
            Reset All Biases
          </button>
        </div>
      )}

      {/* Interaction hint */}
      {canInteract && (
        <p className="mt-8 text-center text-xs text-muted-foreground">
          Click any timeframe to cycle: Neutral → Bullish → Bearish
        </p>
      )}
      {!canInteract && participationMode === 'follow' && (
        <p className="mt-8 text-center text-xs text-muted-foreground/60">
          This room is in follow mode — you can view but not change biases
        </p>
      )}
    </div>
  );
};

export default RoomBiasTracker;