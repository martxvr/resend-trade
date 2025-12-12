import { useState } from "react";

type BiasState = "neutral" | "bullish" | "bearish";

interface TimeframeBias {
  label: string;
  bias: BiasState;
}

const BiasTracker = () => {
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
        return "border-success/50 bg-success/10 text-success";
      case "bearish":
        return "border-destructive/50 bg-destructive/10 text-destructive";
      default:
        return "border-border bg-secondary text-muted-foreground";
    }
  };

  const getOverallBiasStyles = (bias: BiasState) => {
    switch (bias) {
      case "bullish":
        return "border-success text-success";
      case "bearish":
        return "border-destructive text-destructive";
      default:
        return "border-border text-muted-foreground";
    }
  };

  return (
    <section id="tracker" className="border-t border-border py-24">
      <div className="container mx-auto px-6">
        <h2 className="mb-4 text-3xl font-semibold tracking-tight md:text-4xl">
          Trading Bias Tracker
        </h2>
        <p className="mb-12 max-w-xl text-muted-foreground">
          Click buttons to cycle through market bias states.
        </p>

        {/* Timeframe Grid */}
        <div className="mb-12 grid grid-cols-5 gap-3 md:gap-4">
          {timeframes.map((tf, index) => (
            <button
              key={tf.label}
              onClick={() => cycleBias(index)}
              className={`flex flex-col items-center justify-center border p-4 md:p-6 transition-all duration-200 hover:scale-[1.02] ${getBiasStyles(tf.bias)}`}
            >
              <span className="text-xl font-semibold md:text-2xl">{tf.label}</span>
              <span className="mt-1 text-xs uppercase tracking-wider opacity-80">
                {tf.bias}
              </span>
            </button>
          ))}
        </div>

        {/* Overall Bias */}
        <div className="mb-8 flex flex-col items-center">
          <div className={`border px-8 py-4 text-center ${getOverallBiasStyles(getOverallBias())}`}>
            <span className="text-xs uppercase tracking-widest">Overall Bias</span>
            <span className="mt-1 block text-xl font-semibold uppercase">
              {getOverallBias()}
            </span>
          </div>
          
          <p className="mt-4 text-sm text-muted-foreground">
            Bullish: {bullishCount} · Bearish: {bearishCount} · Neutral: {neutralCount}
          </p>
        </div>

        {/* Legend & Reset */}
        <div className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-6 text-sm">
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 bg-success" />
              Bullish
            </span>
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 bg-destructive" />
              Bearish
            </span>
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 bg-muted" />
              Neutral
            </span>
          </div>

          <button
            onClick={resetAll}
            className="border border-border px-6 py-2 text-sm text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
          >
            Reset
          </button>
        </div>
      </div>
    </section>
  );
};

export default BiasTracker;
