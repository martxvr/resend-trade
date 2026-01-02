import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PremiumBackground } from '@/components/ui/premium-background';
import { ShinyButton } from '@/components/ui/shiny-button';
import SidebarLayout from '@/components/ui/sidebar-component';
import { toast } from 'sonner';
import { Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';
import AuroraBackground from '@/components/ui/aurora-background';

export default function CreatorWaitlist() {
    const { user } = useAuth();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [joined, setJoined] = useState(false);

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            toast.error('You must be logged in to join.');
            return;
        }

        setLoading(true);

        // We use user.email as default, but allow custom if input provided?
        // Actually simplicity: Just use the logged in user's ID.
        // The previous prompt implied "sign up", but they are already logged in to see this?
        // Let's assume this page replaces the "Creator Studio" tab.

        const emailToUse = email.trim() || user.email || '';

        const { error } = await supabase
            .from('creator_waitlist')
            .insert({
                user_id: user.id,
                email: emailToUse
            });

        setLoading(false);

        if (error) {
            if (error.code === '23505') { // Unique violation if we had a unique constraint, but we didn't add one.
                toast.success("You're already on the list!");
                setJoined(true);
            } else {
                toast.error('Failed to join waitlist. Please try again.');
                console.error(error);
            }
        } else {
            toast.success("You're on the list! We'll be in touch.");
            setJoined(true);
        }
    };

    return (
        <SidebarLayout>
            <div className="relative min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-6 overflow-hidden">
                {/* Background is handled by SidebarLayout usually having a background, or we can add one here */}
                <div className="absolute inset-0 z-0">
                    <AuroraBackground className="opacity-30" />
                </div>

                <div className="relative z-10 max-w-2xl w-full text-center space-y-8 animate-in fade-in zoom-in duration-700">

                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-muted-foreground mb-4">
                        <Sparkles className="w-4 h-4 text-[#8484ff] drop-shadow-[0_0_8px_rgba(132,132,255,0.5)]" />
                        <span>Creator Studio</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40 pb-4">
                        Coming Soon
                    </h1>

                    <p className="text-xl text-muted-foreground max-w-lg mx-auto leading-relaxed">
                        Build and monetize your own trading strategies.
                        <br className="hidden md:block" />
                        Join the exclusive waitlist to get early access.
                    </p>

                    <div className="pt-8 flex justify-center">
                        {joined ? (
                            <div className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 animate-in fade-in slide-in-from-bottom-4">
                                <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">You're on the list!</h3>
                                    <p className="text-emerald-500/80">We'll notify you when access opens.</p>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleJoin} className="w-full max-w-md flex flex-col sm:flex-row gap-4 items-center">
                                <Input
                                    type="email"
                                    placeholder={user?.email || "Enter your email"}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="bg-white/5 border-white/10 text-lg py-0 h-[60px] focus:ring-amber-400/50 flex-grow"
                                />
                                <div className="flex-shrink-0 h-[60px] flex items-center">
                                    <ShinyButton
                                        type="submit"
                                        disabled={loading}
                                    >
                                        {loading ? 'Joining...' : 'Join Waitlist'}
                                    </ShinyButton>
                                </div>
                            </form>
                        )}
                    </div>

                    <div className="pt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-left opacity-60">
                        <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                            <div className="font-bold text-white mb-1">Build</div>
                            <p className="text-sm text-muted-foreground">Create complex trading strategies with zero code.</p>
                        </div>
                        <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                            <div className="font-bold text-white mb-1">Monetize</div>
                            <p className="text-sm text-muted-foreground">Sell access to your room via subscription.</p>
                        </div>
                        <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                            <div className="font-bold text-white mb-1">Scale</div>
                            <p className="text-sm text-muted-foreground">Grow your community with built-in tools.</p>
                        </div>
                    </div>
                </div>
            </div>
        </SidebarLayout>
    );
}
