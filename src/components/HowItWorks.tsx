import { useInView } from "@/hooks/useInView";

const HowItWorks = () => {
  const { ref, isInView } = useInView({ threshold: 0.1 });

  const steps = [
    {
      step: "01",
      title: "Analyze your charts",
      description: "Review each timeframe on your preferred charting platform. Form your initial bias based on price action and structure."
    },
    {
      step: "02",
      title: "Set your bias",
      description: "Click each timeframe button to cycle through bullish, bearish, or neutral. Record your analysis systematically."
    },
    {
      step: "03",
      title: "Read the aggregate",
      description: "The overall bias updates automatically based on your inputs. Make trading decisions with multi-timeframe confluence."
    }
  ];

  return (
    <section id="how-it-works" className="border-t border-border py-32">
      <div className="container mx-auto px-6">
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

        <div className="grid gap-16 md:grid-cols-3 md:gap-8">
          {steps.map((item, index) => (
            <div 
              key={index}
              className={`group relative transition-all duration-700 ${
                isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: `${index * 150 + 200}ms` }}
            >
              {/* Step number */}
              <span className="mb-6 block font-display text-6xl font-medium text-secondary transition-colors duration-500 group-hover:text-muted-foreground">
                {item.step}
              </span>
              
              {/* Decorative line */}
              <div className="mb-6 h-px w-12 bg-border transition-all duration-500 group-hover:w-20 group-hover:bg-muted-foreground" />
              
              <h3 className="mb-4 text-lg font-medium">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;