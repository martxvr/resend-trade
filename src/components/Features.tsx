import { Timer, MousePointerClick, TrendingUp, RotateCcw } from "lucide-react";
import { useInView } from "@/hooks/useInView";

const Features = () => {
  const { ref, isInView } = useInView({ threshold: 0.1 });

  const features = [
    {
      icon: Timer,
      title: "Multi-timeframe analysis",
      description: "Track bias across 1D, 4H, 1H, 15M, and 5M timeframes simultaneously. See the complete picture."
    },
    {
      icon: MousePointerClick,
      title: "One-click switching",
      description: "Cycle through bullish, bearish, and neutral states instantly. No complex interfaces."
    },
    {
      icon: TrendingUp,
      title: "Aggregate scoring",
      description: "Get an overall market bias based on the weighted average of all your timeframe assessments."
    },
    {
      icon: RotateCcw,
      title: "Reset and iterate",
      description: "Clear all biases with one click. Start fresh for each trading session."
    }
  ];

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
        
        <div className="grid gap-px border border-border md:grid-cols-2">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className={`group relative border-border bg-background p-10 md:p-14 transition-all duration-700 ${
                isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              } ${index < 2 ? 'border-b' : ''} ${index % 2 === 0 ? 'md:border-r' : ''}`}
              style={{ transitionDelay: `${index * 100 + 200}ms` }}
            >
              {/* Hover highlight */}
              <div className="absolute inset-0 bg-secondary opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              
              <div className="relative">
                <feature.icon className="mb-6 h-5 w-5 text-muted-foreground transition-colors duration-300 group-hover:text-foreground" strokeWidth={1.5} />
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