const Features = () => {
  const features = [
    {
      title: "Multi-timeframe analysis",
      description: "Track bias across 1D, 4H, 1H, 15M, and 5M timeframes simultaneously. See the complete picture of market direction."
    },
    {
      title: "One-click switching",
      description: "Cycle through bullish, bearish, and neutral states instantly. No complex interfaces or distractions."
    },
    {
      title: "Aggregate scoring",
      description: "Get an overall market bias based on the weighted average of all your timeframe assessments."
    },
    {
      title: "Reset and iterate",
      description: "Clear all biases with one click. Start fresh for each trading session without losing your workflow."
    }
  ];

  return (
    <section id="features" className="border-t border-border py-24">
      <div className="container mx-auto px-6">
        <h2 className="mb-4 text-3xl font-semibold tracking-tight md:text-4xl">
          Built for precision
        </h2>
        <p className="mb-16 max-w-xl text-muted-foreground">
          A minimal interface designed to keep you focused on what matters — your market analysis.
        </p>
        
        <div className="grid gap-px bg-border md:grid-cols-2">
          {features.map((feature, index) => (
            <div key={index} className="bg-background p-8 md:p-12">
              <h3 className="mb-3 text-lg font-medium">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
