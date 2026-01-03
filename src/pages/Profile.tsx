import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
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
    Save,
    Lock,
    Key,
    Camera
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

    const [profile, setProfile] = useState<any>(null);
    const [displayName, setDisplayName] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [email, setEmail] = useState(user?.email || '');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [saving, setSaving] = useState(false);
    const [updatingAccount, setUpdatingAccount] = useState(false);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (!user) return;

        const fetchProfile = async () => {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', user.id)
                .maybeSingle();

            if (data) {
                setProfile(data);
                setDisplayName(data.display_name || data.username || '');
                setAvatarUrl(data.avatar_url || '');
            }
        };

        fetchProfile();
    }, [user]);

    const handleSignOut = async () => {
        await signOut();
        navigate('/');
        toast.success('Signed out successfully');
    };

    const handleUploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);

            if (!event.target.files || event.target.files.length === 0) {
                throw new Error('You must select an image to upload.');
            }

            const file = event.target.files[0];
            const fileExt = file.name.split('.').pop();
            const filePath = `${user?.id}/avatar.${fileExt}`;
            const limit = 2 * 1024 * 1024; // 2MB

            if (file.size > limit) {
                throw new Error('File is too large. Max size is 2MB.');
            }

            // Upload the file to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file, {
                    upsert: true,
                    contentType: file.type
                });

            if (uploadError) {
                throw uploadError;
            }

            // Get the public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            setAvatarUrl(publicUrl);

            // Auto-save to profile
            if (user) {
                const { error: updateError } = await supabase
                    .from('profiles')
                    .update({
                        avatar_url: publicUrl,
                        updated_at: new Date().toISOString()
                    })
                    .eq('user_id', user.id);

                if (updateError) throw updateError;
            }

            toast.success('Avatar uploaded successfully!');
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleSaveProfile = async () => {
        if (!user) return;
        setSaving(true);

        const { error } = await supabase
            .from('profiles')
            .update({
                display_name: displayName,
                avatar_url: avatarUrl,
                updated_at: new Date().toISOString()
            })
            .eq('user_id', user.id);

        if (error) {
            toast.error('Failed to update profile: ' + error.message);
        } else {
            toast.success('Profile updated');
        }
        setSaving(false);
    };

    const handleUpdateAccount = async () => {
        setUpdatingAccount(true);

        const updates: any = {};
        if (email !== user?.email) updates.email = email;
        if (password) {
            if (password !== confirmPassword) {
                toast.error('Passwords do not match');
                setUpdatingAccount(false);
                return;
            }
            updates.password = password;
        }

        if (Object.keys(updates).length === 0) {
            setUpdatingAccount(false);
            return;
        }

        const { error } = await supabase.auth.updateUser(updates);

        if (error) {
            toast.error('Account update failed: ' + error.message);
        } else {
            toast.success('Account updated successfully (Check your email if you changed it)');
            setPassword('');
            setConfirmPassword('');
        }
        setUpdatingAccount(false);
    };

    const userInitials = displayName?.slice(0, 2).toUpperCase() || user?.email?.slice(0, 2).toUpperCase() || 'TB';

    return (
        <EtherealShadow
            color="rgba(60, 60, 60, 1)"
            animation={{ scale: 80, speed: 70 }}
            noise={{ opacity: 0.5, scale: 1.2 }}
            sizing="fill"
            className="min-h-screen"
            grayscale={true}
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
                        <h1 className="text-3xl font-bold text-white uppercase tracking-wider">Account Settings</h1>
                        <p className="text-white/50 text-base">
                            Personalize your presence and secure your account.
                        </p>
                    </div>

                    <Separator className="bg-white/10" />

                    {/* Profile Section */}
                    <div className="py-2">
                        <SectionColumns
                            title="Visual Identity"
                            description="How other traders see you in the marketplace and rooms."
                        >
                            <div className="space-y-6">
                                <div className="flex items-center gap-6">
                                    <div className="relative group">
                                        <Avatar className="h-24 w-24 border-2 border-white/20 shadow-xl transition-all group-hover:border-white/40">
                                            <AvatarImage src={avatarUrl || `https://avatar.vercel.sh/${user?.email}`} />
                                            <AvatarFallback className="bg-neutral-800 text-white text-3xl font-bold">
                                                {userInitials}
                                            </AvatarFallback>
                                        </Avatar>
                                        <label
                                            htmlFor="avatar-upload"
                                            className={`absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-all cursor-pointer rounded-full ${uploading ? 'opacity-100' : ''}`}
                                        >
                                            {uploading ? (
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <Camera className="w-6 h-6 text-white" />
                                            )}
                                        </label>
                                        <input
                                            type="file"
                                            id="avatar-upload"
                                            accept="image/*"
                                            onChange={handleUploadAvatar}
                                            disabled={uploading}
                                            className="hidden"
                                        />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <Label className="text-white/70 text-sm">Profile Picture</Label>
                                        <p className="text-white/40 text-sm">
                                            Click on the avatar to upload a new image from your device.
                                        </p>
                                        <p className="text-white/30 text-[10px] italic">Supported formats: JPG, PNG. Max 2MB.</p>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-white/70 text-sm">Display Name</Label>
                                    <div className="relative group">
                                        <Input
                                            placeholder="Enter display name"
                                            value={displayName}
                                            onChange={(e) => setDisplayName(e.target.value)}
                                            className="bg-black/50 border-white/20 text-white placeholder:text-white/20 pl-9 transition-all focus:border-white/40"
                                        />
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-white/60" />
                                    </div>
                                    <p className="text-white/30 text-xs">This is how you'll appear on leaderboard and in rooms.</p>
                                </div>

                                <Button
                                    onClick={handleSaveProfile}
                                    disabled={saving}
                                    className="bg-white text-black hover:bg-neutral-200 transition-all font-semibold px-8"
                                >
                                    {saving ? 'Saving...' : 'Update Profile'}
                                </Button>
                            </div>
                        </SectionColumns>

                        <Separator className="bg-white/10" />

                        <SectionColumns
                            title="Account Security"
                            description="Change your login credentials. Email changes require verification."
                        >
                            <div className="space-y-6">
                                <div className="space-y-1.5">
                                    <Label className="text-white/70 text-sm">Email Address</Label>
                                    <div className="relative group">
                                        <Input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="bg-black/50 border-white/20 text-white placeholder:text-white/20 pl-9 transition-all focus:border-white/40"
                                        />
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-white/60" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-white/70 text-sm">New Password</Label>
                                        <div className="relative group">
                                            <Input
                                                type="password"
                                                placeholder="••••••••"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="bg-black/50 border-white/20 text-white placeholder:text-white/20 pl-9 transition-all focus:border-white/40"
                                            />
                                            <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-white/60" />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-white/70 text-sm">Confirm Password</Label>
                                        <div className="relative group">
                                            <Input
                                                type="password"
                                                placeholder="••••••••"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="bg-black/50 border-white/20 text-white placeholder:text-white/20 pl-9 transition-all focus:border-white/40"
                                            />
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-white/60" />
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    onClick={handleUpdateAccount}
                                    disabled={updatingAccount}
                                    variant="outline"
                                    className="border-white/20 text-white hover:bg-white/10 font-semibold px-8"
                                >
                                    {updatingAccount ? 'Updating...' : 'Update Account'}
                                </Button>
                            </div>
                        </SectionColumns>
                    </div>

                    <Separator className="bg-white/10" />

                    {/* Meta Info */}
                    <div className="py-4">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs text-white/30">
                            <div className="flex items-center gap-2">
                                <Shield className="w-3 h-3 text-green-500/50" />
                                Verified Trader Status: ACTIVE
                            </div>
                            <div className="font-mono">
                                ID: {user?.id}
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-white/5">
                        <Button
                            variant="ghost"
                            onClick={handleSignOut}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/5 flex items-center gap-2 px-0"
                        >
                            <LogOut className="w-4 h-4" />
                            Sign Out and Clear Session
                        </Button>
                    </div>
                </div>
            </div>
        </EtherealShadow>
    );
}
