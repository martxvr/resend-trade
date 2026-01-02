
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { X, ArrowRight, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface JoinRoomModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function JoinRoomModal({ isOpen, onClose }: JoinRoomModalProps) {
    const navigate = useNavigate();
    const [roomId, setRoomId] = useState('');

    const handleJoin = (e: React.FormEvent) => {
        e.preventDefault();
        if (!roomId.trim()) {
            toast.error("Please enter a Room ID");
            return;
        }

        navigate(`/room/${roomId.trim()}`);
        onClose();
        setRoomId('');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md flex items-center justify-center z-[100] p-4">
            <div className="bg-card border border-border/50 rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-border/10 flex items-center justify-between">
                    <h2 className="font-display text-lg font-semibold text-foreground">
                        Join Room
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-muted-foreground" />
                    </button>
                </div>

                <div className="p-6">
                    <form onSubmit={handleJoin} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">Room ID / Strategy ID</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    value={roomId}
                                    onChange={e => setRoomId(e.target.value)}
                                    placeholder="e.g. 123e4567-e89b..."
                                    className="pl-9 bg-background/50 border-border/50"
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                className="w-full py-3 bg-foreground text-background font-medium rounded-xl hover:bg-foreground/90 flex items-center justify-center gap-2 transition-all"
                            >
                                Go to Room <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
