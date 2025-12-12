import { ArrowRight } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative min-h-[85vh] flex items-center">
      {/* Subtle grid background */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div className="h-full w-full" style={{
          backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px),
                            linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }} />
      </div>
      
      <div className="container relative mx-auto px-6">
        <div className="max-w-3xl">
          {/* Eyebrow */}
          <p className="mb-8 text-sm tracking-[0.2em] uppercase text-muted-foreground animate-fade-up">
            Precision trading tools
          </p>
          
          {/* Hero headline with editorial serif */}
          <h1 className="mb-8 font-display text-5xl font-medium tracking-tight leading-[1.1] md:text-6xl lg:text-7xl animate-fade-up-delay-1">
            Bias tracking
            <br />
            <span className="text-muted-foreground">for traders</span>
          </h1>
          
          {/* Subheadline */}
          <p className="mb-12 max-w-lg text-lg text-muted-foreground leading-relaxed animate-fade-up-delay-2">
            Eliminate emotional trading. Track your market bias across 
            multiple timeframes and make decisions with clarity.
          </p>
          
          {/* CTAs */}
          <div className="flex items-center gap-8 animate-fade-up-delay-3">
            <a 
              href="#tracker" 
              className="group inline-flex items-center gap-2 border border-foreground bg-foreground px-6 py-3 text-sm font-medium text-background transition-all duration-300 hover:bg-transparent hover:text-foreground"
            >
              Start Tracking
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </a>
            <a 
              href="#how-it-works" 
              className="link-hover text-sm text-muted-foreground transition-colors duration-300 hover:text-foreground pb-0.5"
            >
              How it works
            </a>
          </div>
        </div>
      </div>
      
      {/* Decorative line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
    </section>
  );
};

export default Hero;