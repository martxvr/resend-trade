import { useState } from "react";
import { useInView } from "@/hooks/useInView";
import { RotateCcw } from "lucide-react";
import { EtherealShadow } from "@/components/ui/ethereal-shadow";

type BiasState = "neutral" | "bullish" | "bearish";

interface TimeframeBias {
  label: string;
  bias: BiasState;
}

const BiasTracker = () => {
  const { ref, isInView } = useInView({ threshold: 0.1 });

  const [timeframes, setTimeframes] = useState<TimeframeBias[]>([
    { label: "1D", bias: "neutral" },
    { label: "4H", bias: "neutral" },
    { label: "1H", bias: "neutral" },
    { label: "15M", bias: "neutral" },
    { label: "5M", bias: "neutral" },
  ]);

  const cycleBias = (index: number) => {
    setTimeframes(prev => {
      const newTimeframes = [...prev];
      const currentBias = newTimeframes[index].bias;
      const nextBias: BiasState =
        currentBias === "neutral" ? "bullish" :
          currentBias === "bullish" ? "bearish" : "neutral";
      newTimeframes[index] = { ...newTimeframes[index], bias: nextBias };
      return newTimeframes;
    });
  };

  const resetAll = () => {
    setTimeframes(prev => prev.map(tf => ({ ...tf, bias: "neutral" })));
  };

  const bullishCount = timeframes.filter(tf => tf.bias === "bullish").length;
  const bearishCount = timeframes.filter(tf => tf.bias === "bearish").length;
  const neutralCount = timeframes.filter(tf => tf.bias === "neutral").length;

  const getOverallBias = (): BiasState => {
    if (bullishCount > bearishCount && bullishCount > neutralCount) return "bullish";
    if (bearishCount > bullishCount && bearishCount > neutralCount) return "bearish";
    return "neutral";
  };

  const getBiasStyles = (bias: BiasState) => {
    switch (bias) {
      case "bullish":
        return "border-success/40 bg-success/5 text-success shadow-[0_0_30px_-10px_hsl(var(--success)/0.3)] hover:border-success/60 hover:shadow-[0_0_40px_-10px_hsl(var(--success)/0.4)]";
      case "bearish":
        return "border-destructive/40 bg-destructive/5 text-destructive shadow-[0_0_30px_-10px_hsl(var(--destructive)/0.3)] hover:border-destructive/60 hover:shadow-[0_0_40px_-10px_hsl(var(--destructive)/0.4)]";
      default:
        return "border-border/50 bg-card/50 text-muted-foreground hover:border-border hover:bg-card/80";
    }
  };

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

  return (
    <EtherealShadow
      color="rgba(80, 80, 80, 1)"
      animation={{ scale: 100, speed: 90 }}
      noise={{ opacity: 0.6, scale: 1.2 }}
      sizing="fill"
    >
      <section id="tracker" className="border-t border-border/50 py-32">
        <div className="container mx-auto px-6">
          <div
            ref={ref}
            className={`transition-all duration-1000 ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
          >
            <p className="mb-4 text-sm tracking-[0.2em] uppercase text-muted-foreground">
              Tool
            </p>
            <h2 className="mb-6 font-display text-4xl font-medium tracking-tight md:text-5xl">
              Trading Bias Tracker
            </h2>
            <p className="mb-16 max-w-lg text-muted-foreground leading-relaxed">
              Click any timeframe to cycle through market bias states.
            </p>
          </div>

          {/* Timeframe Grid */}
          <div
            className={`mb-16 grid grid-cols-5 gap-3 transition-all duration-1000 delay-200 md:gap-4 ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
          >
            {timeframes.map((tf, index) => (
              <button
                key={tf.label}
                onClick={() => cycleBias(index)}
                className={`group relative flex flex-col items-center justify-center rounded-2xl border p-5 md:p-8 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${getBiasStyles(tf.bias)}`}
                style={{ transitionDelay: `${index * 50}ms` }}
              >
                {/* Glow effect on hover */}
                <div className="absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
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
              </button>
            ))}
          </div>

          {/* Overall Bias */}
          <div
            className={`mb-12 flex flex-col items-center transition-all duration-1000 delay-300 ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
          >
            <div className={`rounded-2xl border px-10 py-6 text-center transition-all duration-500 ${getOverallBiasStyles(getOverallBias())}`}>
              <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Overall Bias</span>
              <span className="mt-2 block text-2xl font-medium uppercase tracking-wide">
                {getOverallBias()}
              </span>
            </div>

            <div className="mt-6 flex items-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-success animate-pulse" style={{ animationDuration: '2s' }} />
                Bullish: {bullishCount}
              </span>
              <span className="text-border">·</span>
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" style={{ animationDuration: '2s', animationDelay: '0.5s' }} />
                Bearish: {bearishCount}
              </span>
              <span className="text-border">·</span>
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-muted" />
                Neutral: {neutralCount}
              </span>
            </div>
          </div>

          {/* Legend & Reset */}
          <div
            className={`flex flex-col items-center gap-8 transition-all duration-1000 delay-400 ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
          >
            <button
              onClick={resetAll}
              className="group btn-glow inline-flex items-center gap-2 rounded-xl border border-border/50 bg-card/30 px-6 py-2.5 text-sm text-muted-foreground transition-all duration-300 hover:border-border hover:bg-card/50 hover:text-foreground"
            >
              <RotateCcw className="h-3.5 w-3.5 transition-transform duration-500 group-hover:-rotate-180" />
              Reset All
            </button>
          </div>
        </div>
      </section>
    </EtherealShadow>
  );
};

export default BiasTracker;