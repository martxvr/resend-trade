import { useInView } from "@/hooks/useInView";
import { BackgroundSnippetDark } from "@/components/ui/background-snippets";

const HowItWorks = () => {
  const { ref, isInView } = useInView({ threshold: 0.1 });

  const steps = [
    {
      step: "01",
      title: "Analyze your charts",
      description: "Review each timeframe on your preferred charting platform. Form your initial bias based on price action and structure.",
      accentColor: "accent-purple"
    },
    {
      step: "02",
      title: "Set your bias",
      description: "Click each timeframe button to cycle through bullish, bearish, or neutral. Record your analysis systematically.",
      accentColor: "accent-green"
    },
    {
      step: "03",
      title: "Read the aggregate",
      description: "The overall bias updates automatically based on your inputs. Make trading decisions with multi-timeframe confluence.",
      accentColor: "accent-amber"
    }
  ];

  return (
    <section id="how-it-works" className="relative border-t border-border/50 py-32 overflow-hidden">
      <BackgroundSnippetDark className="!z-0" />
      <div className="container mx-auto px-6 relative z-10">
        <div
          ref={ref}
          className={`transition-all duration-1000 ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          <p className="mb-4 text-sm tracking-[0.2em] uppercase text-muted-foreground">
            Process
          </p>
          <h2 className="mb-6 font-display text-4xl font-medium tracking-tight md:text-5xl">
            How it works
          </h2>
          <p className="mb-20 max-w-lg text-muted-foreground leading-relaxed">
            Three simple steps. No learning curve.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3 md:gap-6">
          {steps.map((item, index) => (
            <div
              key={index}
              className={`group relative overflow-hidden rounded-2xl border border-border/50 bg-card/30 p-8 transition-all duration-500 hover:border-border hover:bg-card/50 ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
              style={{ transitionDelay: `${index * 150 + 200}ms` }}
            >
              {/* Top accent line */}
              <div
                className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-${item.accentColor}/50 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100`}
                style={{
                  background: `linear-gradient(to right, transparent, hsl(var(--${item.accentColor}) / 0.5), transparent)`
                }}
              />

              {/* Step number */}
              <span className="mb-6 block font-display text-5xl font-medium text-secondary-foreground/20 transition-all duration-500 group-hover:text-secondary-foreground/40">
                {item.step}
              </span>

              {/* Decorative line */}
              <div className="mb-6 h-px w-12 bg-border transition-all duration-500 group-hover:w-20 group-hover:bg-muted-foreground/50" />

              <h3 className="mb-4 text-lg font-medium">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {item.description}
              </p>

              {/* Floating indicator */}
              <div
                className="absolute top-6 right-6 h-2 w-2 rounded-full opacity-0 transition-all duration-500 group-hover:opacity-100 float"
                style={{ backgroundColor: `hsl(var(--${item.accentColor}))` }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;