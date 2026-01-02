
import { CheckCircle2 } from "lucide-react";

const Pricing = () => {
    return (
        <section id="pricing" className="py-24 relative overflow-hidden">
            {/* Spline Background with Margin-Top */}
            <div className="spline-container absolute top-0 left-0 w-full h-full z-0 pointer-events-none mt-[200px]">
                <iframe
                    src="https://my.spline.design/glowingplanetparticles-nhVHji30IRoa5HBGe8yeDiTs"
                    frameBorder="0"
                    width="100%"
                    height="100%"
                    id="aura-spline"
                    className="w-full h-full"
                />
            </div>

            {/* Gradient Overlays for Fade Effect with Margin-Top */}
            <div className="absolute inset-0 z-1 pointer-events-none mt-[200px]">
                <div className="absolute top-0 left-0 w-full h-48 bg-gradient-to-b from-background via-background/80 to-transparent" />
                <div className="absolute bottom-0 left-0 w-full h-48 bg-gradient-to-t from-background via-background/80 to-transparent" />
            </div>

            <div className="container px-6 relative z-10">
                <div className="text-center mb-16 animate-fade-up">
                    <span className="inline-block py-1 px-3 rounded-full bg-secondary/50 border border-border/50 text-xs font-medium text-muted-foreground mb-4">
                        Transparent Pricing
                    </span>
                    <h2 className="text-4xl md:text-5xl font-display font-medium mb-4">
                        Simple, transparent pricing
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                        Start creating your edge today without any hidden fees.
                    </p>
                </div>

                <div className="max-w-md mx-auto animate-fade-up-delay-1">
                    <div className="card-glow p-8 bg-card/10 border border-white/5 backdrop-blur-md relative group">
                        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                        <div className="mb-8">
                            <h3 className="text-xl font-medium mb-2">Free</h3>
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-bold">$0</span>
                                <span className="text-muted-foreground">/month</span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-4">
                                Perfect for getting started with consistent trading.
                            </p>
                        </div>

                        <div className="space-y-4 mb-8">
                            {[
                                "Unlimited Public Strategies",
                                "Basic Analytics",
                                "1 Personal Strategy"
                            ].map((feature) => (
                                <div key={feature} className="flex items-center gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-accent-green shrink-0" />
                                    <span className="text-sm text-foreground/80">{feature}</span>
                                </div>
                            ))}
                        </div>

                        <a
                            href="/auth"
                            className="block w-full text-center py-3 rounded-xl bg-white text-black font-medium hover:bg-white/90 transition-colors btn-glow"
                        >
                            Get Started
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Pricing;
