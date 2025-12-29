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
  myBiases: Record<string, 'neutral' | 'bullish' | 'bearish'>;
  onBiasChange: (timeframe: string, newBias: 'neutral' | 'bullish' | 'bearish') => void;
  canInteract: boolean;
  isOwner: boolean;
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
  isOwner,
  onReset,
  stats
}: RoomBiasTrackerProps) => {
  const { ref, isInView } = useInView({ threshold: 0.1 });
  const { playBiasSound, isMuted } = useBiasSound();

  const cycleBias = (timeframe: string) => {
    if (!canInteract) return;

    const currentBias = myBiases[timeframe] || "neutral";
    const nextBias: 'neutral' | 'bullish' | 'bearish' =
      currentBias === "neutral" ? "bullish" :
        currentBias === "bullish" ? "bearish" : "neutral";

    playBiasSound(nextBias);
    onBiasChange(timeframe, nextBias);
  };

  const getBiasStyles = (bias: 'neutral' | 'bullish' | 'bearish', canClick: boolean) => {
    const baseStyles = canClick
      ? "hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
      : "cursor-not-allowed";

    switch (bias) {
      case "bullish":
        return `border-success/30 bg-success/10 text-success shadow-[0_0_40px_-15px_hsl(var(--success)/0.3)] ${canClick ? 'hover:border-success/50 hover:bg-success/20' : 'opacity-70'} ${baseStyles}`;
      case "bearish":
        return `border-destructive/30 bg-destructive/10 text-destructive shadow-[0_0_40px_-15px_hsl(var(--destructive)/0.3)] ${canClick ? 'hover:border-destructive/50 hover:bg-destructive/20' : 'opacity-70'} ${baseStyles}`;
      default:
        return `border-white/10 bg-white/5 text-muted-foreground ${canClick ? 'hover:border-white/20 hover:bg-white/10 hover:text-foreground' : 'opacity-70'} ${baseStyles}`;
    }
  };

  const getOverallBias = (): 'neutral' | 'bullish' | 'bearish' => {
    if (stats.bullishCount > stats.bearishCount) return "bullish";
    if (stats.bearishCount > stats.bullishCount) return "bearish";
    return "neutral";
  };

  const overallBias = getOverallBias();

  const getOverallBiasStyles = (bias: 'neutral' | 'bullish' | 'bearish') => {
    switch (bias) {
      case "bullish":
        return "border-success/30 text-success bg-success/5 shadow-[0_0_60px_-20px_hsl(var(--success)/0.3)]";
      case "bearish":
        return "border-destructive/30 text-destructive bg-destructive/5 shadow-[0_0_60px_-20px_hsl(var(--destructive)/0.3)]";
      default:
        return "border-white/10 text-white/50 bg-white/5";
    }
  };

  // Build timeframe biases array
  const timeframeBiases: TimeframeBias[] = timeframes.map(tf => ({
    label: tf,
    bias: myBiases[tf] || "neutral"
  }));

  return (
    <div ref={ref}>
      {/* Timeframe Grid - Matches homepage BiasTracker exactly */}
      <div
        className={`mb-16 grid gap-3 transition-all duration-1000 delay-100 md:gap-4 ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
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
                  ? "radial-gradient(circle at center, hsl(var(--success) / 0.15), transparent 70%)"
                  : tf.bias === "bearish"
                    ? "radial-gradient(circle at center, hsl(var(--destructive) / 0.15), transparent 70%)"
                    : "radial-gradient(circle at center, rgba(255, 255, 255, 0.05), transparent 70%)"
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
        className={`mb-12 flex flex-col items-center transition-all duration-1000 delay-200 ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
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
          className={`flex flex-col items-center gap-8 transition-all duration-1000 delay-300 ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
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
      {!canInteract && (
        <p className="mt-8 text-center text-xs text-muted-foreground/60">
          You are in view mode — only owners and co-owners can change biases
        </p>
      )}
    </div>
  );
};

export default RoomBiasTracker;