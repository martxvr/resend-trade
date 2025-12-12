import { useState, useEffect } from "react";

const Header = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled 
          ? 'border-b border-border bg-background/90 backdrop-blur-md' 
          : 'border-b border-transparent bg-transparent'
      }`}
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-6">
        <a 
          href="/" 
          className="text-lg font-medium tracking-tight transition-opacity duration-300 hover:opacity-70"
        >
          TradeBias
        </a>
        
        <nav className="hidden items-center gap-10 md:flex">
          <a 
            href="#features" 
            className="link-hover text-sm text-muted-foreground transition-colors duration-300 hover:text-foreground pb-0.5"
          >
            Features
          </a>
          <a 
            href="#how-it-works" 
            className="link-hover text-sm text-muted-foreground transition-colors duration-300 hover:text-foreground pb-0.5"
          >
            How it works
          </a>
          <a 
            href="#tracker" 
            className="link-hover text-sm text-muted-foreground transition-colors duration-300 hover:text-foreground pb-0.5"
          >
            Tracker
          </a>
        </nav>

        <div className="flex items-center gap-6">
          <a 
            href="#tracker" 
            className="hidden text-sm text-muted-foreground transition-colors duration-300 hover:text-foreground md:block"
          >
            Log in
          </a>
          <a 
            href="#tracker" 
            className="border border-foreground px-5 py-2 text-sm font-medium transition-all duration-300 hover:bg-foreground hover:text-background"
          >
            Get Started
          </a>
        </div>
      </div>
    </header>
  );
};

export default Header;