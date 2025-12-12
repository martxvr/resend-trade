const HowItWorks = () => {
  const steps = [
    {
      step: "01",
      title: "Analyze your charts",
      description: "Review each timeframe on your preferred charting platform."
    },
    {
      step: "02",
      title: "Set your bias",
      description: "Click each timeframe button to cycle through bullish, bearish, or neutral."
    },
    {
      step: "03",
      title: "Read the aggregate",
      description: "The overall bias updates automatically based on your inputs."
    }
  ];

  return (
    <section id="how-it-works" className="border-t border-border py-24">
      <div className="container mx-auto px-6">
        <h2 className="mb-4 text-3xl font-semibold tracking-tight md:text-4xl">
          How it works
        </h2>
        <p className="mb-16 max-w-xl text-muted-foreground">
          Three simple steps. No learning curve.
        </p>

        <div className="grid gap-12 md:grid-cols-3">
          {steps.map((item, index) => (
            <div key={index}>
              <span className="mb-4 block text-sm text-muted-foreground">{item.step}</span>
              <h3 className="mb-2 text-lg font-medium">{item.title}</h3>
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
