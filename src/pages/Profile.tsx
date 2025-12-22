import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { EtherealShadow } from '@/components/ui/ethereal-shadow';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
    User,
    Mail,
    Shield,
    Bell,
    LogOut,
    ChevronLeft,
    TrendingUp,
    Clock,
    Target,
    Save
} from 'lucide-react';

interface SectionColumnsProps {
    title: string;
    description?: string;
    children: React.ReactNode;
}

function SectionColumns({ title, description, children }: SectionColumnsProps) {
    return (
        <div className="grid grid-cols-1 gap-x-10 gap-y-4 py-8 md:grid-cols-10">
            <div className="w-full space-y-1.5 md:col-span-4">
                <h3 className="text-lg font-semibold leading-none text-white">
                    {title}
                </h3>
                <p className="text-sm text-white/50 text-balance">
                    {description}
                </p>
            </div>
            <div className="md:col-span-6">{children}</div>
        </div>
    );
}

export default function Profile() {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();

    const [displayName, setDisplayName] = useState(user?.user_metadata?.display_name || '');
    const [defaultTimeframe, setDefaultTimeframe] = useState('1h');
    const [riskLevel, setRiskLevel] = useState('moderate');
    const [saving, setSaving] = useState(false);

    const handleSignOut = async () => {
        await signOut();
        navigate('/');
        toast.success('Signed out successfully');
    };

    const handleSaveChanges = async () => {
        setSaving(true);
        // Simulate save
        await new Promise(resolve => setTimeout(resolve, 1000));
        setSaving(false);
        toast.success('Settings saved');
    };

    const userInitials = user?.email?.slice(0, 2).toUpperCase() || 'TB';

    return (
        <EtherealShadow
            color="rgba(60, 60, 60, 1)"
            animation={{ scale: 80, speed: 70 }}
            noise={{ opacity: 0.5, scale: 1.2 }}
            sizing="fill"
            className="min-h-screen"
        >
            <div className="w-full px-4 py-10">
                {/* Back button */}
                <div className="max-w-4xl mx-auto mb-6">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Back to Dashboard
                    </button>
                </div>

                <div className="mx-auto w-full max-w-4xl space-y-8">
                    {/* Header */}
                    <div className="flex flex-col">
                        <h1 className="text-3xl font-bold text-white">Trader Profile</h1>
                        <p className="text-white/50 text-base">
                            Manage your account and trading preferences.
                        </p>
                    </div>

                    <Separator className="bg-white/10" />

                    {/* Profile Section */}
                    <div className="py-2">
                        <SectionColumns
                            title="Your Avatar"
                            description="Your profile picture helps identify you in trading rooms."
                        >
                            <div className="flex items-center gap-4">
                                <Avatar className="h-20 w-20 border-2 border-white/20">
                                    <AvatarImage src={`https://avatar.vercel.sh/${user?.email}`} />
                                    <AvatarFallback className="bg-neutral-800 text-white text-2xl font-bold">
                                        {userInitials}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="text-white/50 text-sm">
                                    Avatar auto-generated from email
                                </div>
                            </div>
                        </SectionColumns>

                        <Separator className="bg-white/10" />

                        <SectionColumns
                            title="Display Name"
                            description="This name will be shown in trading rooms and leaderboards."
                        >
                            <div className="w-full space-y-1">
                                <Label className="sr-only">Name</Label>
                                <div className="flex w-full items-center gap-2">
                                    <Input
                                        placeholder="Enter display name"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        className="bg-black/50 border-white/20 text-white placeholder:text-white/30"
                                    />
                                </div>
                                <p className="text-white/40 text-xs">Max 32 characters</p>
                            </div>
                        </SectionColumns>

                        <Separator className="bg-white/10" />

                        <SectionColumns
                            title="Email Address"
                            description="Your account email address."
                        >
                            <div className="flex w-full items-center gap-2">
                                <Input
                                    type="email"
                                    value={user?.email || ''}
                                    disabled
                                    className="bg-black/50 border-white/20 text-white/60 cursor-not-allowed"
                                />
                                <div className="flex items-center gap-1 text-green-400 text-xs">
                                    <Shield className="w-3 h-3" />
                                    Verified
                                </div>
                            </div>
                        </SectionColumns>

                        <Separator className="bg-white/10" />

                        <SectionColumns
                            title="User ID"
                            description="Your unique trader identifier."
                        >
                            <div className="font-mono text-sm text-white/40 bg-black/30 px-3 py-2 rounded-lg">
                                {user?.id || 'Not available'}
                            </div>
                        </SectionColumns>
                    </div>

                    <Separator className="bg-white/10" />

                    {/* Trading Preferences */}
                    <div className="flex flex-col">
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            <TrendingUp className="w-5 h-5" />
                            Trading Preferences
                        </h2>
                        <p className="text-white/50 text-base">
                            Customize your trading experience.
                        </p>
                    </div>

                    <div className="py-2">
                        <SectionColumns
                            title="Default Timeframe"
                            description="Your preferred chart timeframe when joining rooms."
                        >
                            <div className="flex flex-wrap gap-2">
                                {['5m', '15m', '1h', '4h', '1D'].map((tf) => (
                                    <button
                                        key={tf}
                                        onClick={() => setDefaultTimeframe(tf)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${defaultTimeframe === tf
                                                ? 'bg-white text-black'
                                                : 'bg-white/10 text-white/70 hover:bg-white/20'
                                            }`}
                                    >
                                        {tf}
                                    </button>
                                ))}
                            </div>
                        </SectionColumns>

                        <Separator className="bg-white/10" />

                        <SectionColumns
                            title="Risk Level"
                            description="Your preferred trading risk tolerance."
                        >
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { value: 'conservative', label: 'Conservative', color: 'text-green-400' },
                                    { value: 'moderate', label: 'Moderate', color: 'text-yellow-400' },
                                    { value: 'aggressive', label: 'Aggressive', color: 'text-red-400' },
                                ].map((risk) => (
                                    <button
                                        key={risk.value}
                                        onClick={() => setRiskLevel(risk.value)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${riskLevel === risk.value
                                                ? `bg-white/20 ${risk.color} border border-current`
                                                : 'bg-white/10 text-white/70 hover:bg-white/20'
                                            }`}
                                    >
                                        {risk.label}
                                    </button>
                                ))}
                            </div>
                        </SectionColumns>
                    </div>

                    <Separator className="bg-white/10" />

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                        <Button
                            onClick={handleSaveChanges}
                            disabled={saving}
                            className="bg-white text-black hover:bg-white/90 flex items-center gap-2"
                        >
                            <Save className="w-4 h-4" />
                            {saving ? 'Saving...' : 'Save Changes'}
                        </Button>

                        <Button
                            variant="outline"
                            onClick={handleSignOut}
                            className="border-red-500/50 text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                        >
                            <LogOut className="w-4 h-4" />
                            Sign Out
                        </Button>
                    </div>
                </div>
            </div>
        </EtherealShadow>
    );
}
