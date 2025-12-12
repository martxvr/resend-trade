const Hero = () => {
  return (
    <section className="relative min-h-[80vh] flex items-center">
      <div className="container mx-auto px-6">
        <div className="max-w-2xl">
          <h1 className="mb-6 text-5xl font-semibold tracking-tight md:text-6xl lg:text-7xl animate-fade-in">
            Bias tracking<br />
            for traders
          </h1>
          
          <p className="mb-10 text-lg text-muted-foreground md:text-xl animate-fade-in" style={{ animationDelay: '0.1s' }}>
            Eliminate emotional trading. Track your market bias across 
            multiple timeframes and make decisions with clarity.
          </p>
          
          <div className="flex items-center gap-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <a 
              href="#tracker" 
              className="border border-border bg-foreground px-6 py-2.5 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
            >
              Start Tracking
            </a>
            <a 
              href="#how-it-works" 
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              How it works →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
