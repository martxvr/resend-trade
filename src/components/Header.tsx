const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto flex h-14 items-center justify-between px-6">
        <a href="/" className="text-lg font-semibold tracking-tight">
          TradeBias
        </a>
        
        <nav className="hidden items-center gap-8 md:flex">
          <a href="#features" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Features
          </a>
          <a href="#how-it-works" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            How it works
          </a>
          <a href="#tracker" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Tracker
          </a>
        </nav>

        <div className="flex items-center gap-4">
          <a href="#tracker" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Log in
          </a>
          <a 
            href="#tracker" 
            className="border border-border bg-foreground px-4 py-1.5 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
          >
            Get Started
          </a>
        </div>
      </div>
    </header>
  );
};

export default Header;
