import { Timer, MousePointerClick, TrendingUp, RotateCcw } from "lucide-react";
import { useInView } from "@/hooks/useInView";

const Features = () => {
  const { ref, isInView } = useInView({ threshold: 0.1 });

  const features = [
    {
      icon: Timer,
      title: "Multi-timeframe analysis",
      description: "Track bias across 1D, 4H, 1H, 15M, and 5M timeframes simultaneously. See the complete picture.",
      accentColor: "accent-purple"
    },
    {
      icon: MousePointerClick,
      title: "One-click switching",
      description: "Cycle through bullish, bearish, and neutral states instantly. No complex interfaces.",
      accentColor: "accent-green"
    },
    {
      icon: TrendingUp,
      title: "Aggregate scoring",
      description: "Get an overall market bias based on the weighted average of all your timeframe assessments.",
      accentColor: "accent-amber"
    },
    {
      icon: RotateCcw,
      title: "Reset and iterate",
      description: "Clear all biases with one click. Start fresh for each trading session.",
      accentColor: "accent-blue"
    }
  ];

  const getGlowColor = (accentColor: string) => {
    const colors: Record<string, string> = {
      "accent-purple": "hsl(var(--accent-purple) / 0.15)",
      "accent-green": "hsl(var(--accent-green) / 0.15)",
      "accent-amber": "hsl(var(--accent-amber) / 0.15)",
      "accent-blue": "hsl(var(--accent-blue) / 0.15)",
    };
    return colors[accentColor] || colors["accent-purple"];
  };

  const getIconColor = (accentColor: string) => {
    const colors: Record<string, string> = {
      "accent-purple": "text-accent-purple",
      "accent-green": "text-accent-green",
      "accent-amber": "text-accent-amber",
      "accent-blue": "text-accent-blue",
    };
    return colors[accentColor] || "text-accent-purple";
  };

  return (
    <section id="features" className="py-32">
      <div className="container mx-auto px-6">
        <div 
          ref={ref}
          className={`transition-all duration-1000 ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          <p className="mb-4 text-sm tracking-[0.2em] uppercase text-muted-foreground">
            Features
          </p>
          <h2 className="mb-6 font-display text-4xl font-medium tracking-tight md:text-5xl">
            Built for precision
          </h2>
          <p className="mb-20 max-w-lg text-muted-foreground leading-relaxed">
            A minimal interface designed to keep you focused on what matters — your market analysis.
          </p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className={`group relative overflow-hidden rounded-2xl border border-border/50 bg-card/50 p-8 md:p-10 transition-all duration-500 hover:border-border ${
                isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: `${index * 100 + 200}ms` }}
            >
              {/* Hover glow effect */}
              <div 
                className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                style={{
                  background: `radial-gradient(400px circle at 50% 0%, ${getGlowColor(feature.accentColor)}, transparent 60%)`
                }}
              />
              
              <div className="relative">
                {/* Icon with glow container */}
                <div className="mb-6 inline-flex">
                  <div 
                    className="icon-glow h-12 w-12 transition-transform duration-300 group-hover:scale-110"
                    style={{
                      '--glow-color': getGlowColor(feature.accentColor)
                    } as React.CSSProperties}
                  >
                    <feature.icon 
                      className={`h-5 w-5 transition-all duration-300 ${getIconColor(feature.accentColor)} group-hover:scale-110`} 
                      strokeWidth={1.5} 
                    />
                  </div>
                </div>
                
                <h3 className="mb-4 text-lg font-medium">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;