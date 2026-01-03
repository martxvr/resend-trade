import { useEffect } from 'react';
import { ArrowRight } from "lucide-react";
import { ShinyButton } from "@/components/ui/shiny-button";

const Hero = () => {
  useEffect(() => {
    // Re-initialize Unicorn Studio after render
    if ((window as any).UnicornStudio) {
      (window as any).UnicornStudio.init();
    }
  }, []);

  return (
    <section className="relative min-h-[85vh] flex items-center overflow-hidden">
      {/* Unicorn Studio Background */}
      <div
        data-us-project="p7Ff6pfTrb5Gs59C7nLC"
        className="absolute inset-0 z-0 pointer-events-none"
      ></div>

      {/* Ambient glow effects */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-accent-purple/10 blur-[120px] animate-pulse-glow" />
      <div className="absolute bottom-1/4 -right-32 w-80 h-80 rounded-full bg-accent-green/8 blur-[100px] animate-pulse-glow" style={{ animationDelay: '1.5s' }} />

      {/* Subtle grid background */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div className="h-full w-full" style={{
          backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px),
                            linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }} />
      </div>

      {/* Floating decorative elements */}
      <div className="absolute top-1/3 right-[15%] hidden lg:block">
        <div className="float w-3 h-3 rounded-full bg-accent-purple/40" />
      </div>
      <div className="absolute bottom-1/3 right-[25%] hidden lg:block">
        <div className="float-delayed w-2 h-2 rounded-full bg-accent-green/40" />
      </div>
      <div className="absolute top-1/2 right-[10%] hidden lg:block">
        <div className="float w-1.5 h-1.5 rounded-full bg-accent-amber/40" style={{ animationDelay: '1s' }} />
      </div>

      <div className="container relative z-10 mx-auto px-6">
        <div className="max-w-3xl">
          {/* Eyebrow with accent */}
          <div className="mb-8 animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-secondary/50 px-4 py-1.5 text-sm tracking-wide text-muted-foreground backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-green animate-pulse" />
              Precision trading tools
            </span>
          </div>

          {/* Hero headline with editorial serif */}
          <h1 className="mb-8 font-display text-5xl font-medium tracking-tight leading-[1.1] md:text-6xl lg:text-7xl animate-fade-up-delay-1">
            <span className="tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40">Bias tracking</span>
            <br />
            <span className="tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40">for traders</span>
          </h1>

          {/* Subheadline */}
          <p className="mb-12 max-w-lg text-lg text-muted-foreground leading-relaxed animate-fade-up-delay-2">
            Eliminate emotional trading. Track your market bias across
            multiple timeframes and make decisions with clarity.
          </p>

          {/* CTAs */}
          <div className="flex items-center gap-8 animate-fade-up-delay-3">
            <ShinyButton
              onClick={() => document.getElementById('tracker')?.scrollIntoView({ behavior: 'smooth' })}
              className="py-5"
            >
              Start Tracking
            </ShinyButton>
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