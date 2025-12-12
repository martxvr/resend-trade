const Footer = () => {
  return (
    <footer className="border-t border-border/50 py-16">
      <div className="container mx-auto px-6">
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          {/* Brand */}
          <div>
            <span className="text-lg font-medium">TradeBias</span>
            <p className="mt-2 text-sm text-muted-foreground">
              Precision tools for serious traders.
            </p>
          </div>
          
          {/* Links */}
          <div className="flex items-center gap-8 text-sm text-muted-foreground">
            <a 
              href="#" 
              className="link-hover transition-colors duration-300 hover:text-foreground pb-0.5"
            >
              Privacy
            </a>
            <a 
              href="#" 
              className="link-hover transition-colors duration-300 hover:text-foreground pb-0.5"
            >
              Terms
            </a>
            <a 
              href="#" 
              className="link-hover transition-colors duration-300 hover:text-foreground pb-0.5"
            >
              Contact
            </a>
          </div>
        </div>
        
        {/* Divider */}
        <div className="my-10 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />
        
        {/* Bottom */}
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} TradeBias. All rights reserved.
          </div>
          
          {/* Decorative element */}
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-purple/50 animate-pulse" />
            <span className="h-1.5 w-1.5 rounded-full bg-accent-green/50 animate-pulse" style={{ animationDelay: '0.5s' }} />
            <span className="h-1.5 w-1.5 rounded-full bg-accent-amber/50 animate-pulse" style={{ animationDelay: '1s' }} />
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;