import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRoom } from '@/hooks/useRoom';
import { useBiasSound } from '@/hooks/useBiasSound';
import { toast } from 'sonner';
import { ArrowLeft, Users, Copy, Volume2, VolumeX, TrendingUp, TrendingDown, Minus } from 'lucide-react';

type BiasType = 'bullish' | 'bearish' | 'neutral';

const biasConfig = {
  bullish: {
    label: 'Bullish',
    icon: TrendingUp,
    color: 'text-accent-green',
    bg: 'bg-accent-green/10',
    border: 'border-accent-green/30',
    glow: 'shadow-[0_0_20px_rgba(34,197,94,0.2)]'
  },
  bearish: {
    label: 'Bearish',
    icon: TrendingDown,
    color: 'text-red-400',
    bg: 'bg-red-400/10',
    border: 'border-red-400/30',
    glow: 'shadow-[0_0_20px_rgba(248,113,113,0.2)]'
  },
  neutral: {
    label: 'Neutral',
    icon: Minus,
    color: 'text-muted-foreground',
    bg: 'bg-muted/10',
    border: 'border-border/50',
    glow: ''
  }
};

export default function Room() {
  const { roomId } = useParams<{ roomId: string }>();
  const { user, loading: authLoading } = useAuth();
  const { room, myBias, stats, loading, joinRoom, leaveRoom, updateBias } = useRoom(roomId || null);
  const { playBiasSound, isMuted, toggleMute } = useBiasSound();
  const navigate = useNavigate();
  const [hasJoined, setHasJoined] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Auto-join room
  useEffect(() => {
    if (user && room && !hasJoined) {
      joinRoom().then(() => setHasJoined(true));
    }
  }, [user, room, hasJoined, joinRoom]);

  // Leave room on unmount
  useEffect(() => {
    return () => {
      if (hasJoined) {
        leaveRoom();
      }
    };
  }, [hasJoined, leaveRoom]);

  const handleBiasChange = async (newBias: BiasType) => {
    if (newBias === myBias) return;
    
    playBiasSound(newBias);
    const { error } = await updateBias(newBias);
    
    if (error) {
      toast.error('Failed to update bias');
    }
  };

  const copyJoinCode = () => {
    if (room?.join_code) {
      navigator.clipboard.writeText(room.join_code);
      toast.success('Join code copied');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-foreground border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">Room not found</h2>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Return to dashboard
          </button>
        </div>
      </div>
    );
  }

  const overallConfig = biasConfig[stats.overallBias];
  const OverallIcon = overallConfig.icon;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/30">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleMute}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
              title={isMuted ? 'Unmute sounds' : 'Mute sounds'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button
              onClick={copyJoinCode}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground border border-border/50 rounded-lg transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              {room.join_code}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Room Info */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent-purple/10 text-accent-purple text-sm font-medium rounded-full mb-4">
            {room.instrument}
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-semibold text-foreground mb-4">
            {room.name}
          </h1>
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>{stats.total} trader{stats.total !== 1 ? 's' : ''} online</span>
          </div>
        </div>

        {/* Overall Bias Display */}
        <div className={`mb-12 p-8 rounded-3xl border ${overallConfig.border} ${overallConfig.bg} ${overallConfig.glow} transition-all duration-500`}>
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-3 uppercase tracking-wider">
              Room Consensus
            </p>
            <div className={`flex items-center justify-center gap-3 ${overallConfig.color}`}>
              <OverallIcon className="w-10 h-10" />
              <span className="font-display text-4xl font-bold">
                {overallConfig.label}
              </span>
            </div>
          </div>
        </div>

        {/* Bias Stats */}
        <div className="grid grid-cols-3 gap-4 mb-12">
          {(['bullish', 'bearish', 'neutral'] as BiasType[]).map((bias) => {
            const config = biasConfig[bias];
            const count = stats[bias];
            const percentage = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
            
            return (
              <div
                key={bias}
                className={`p-5 rounded-2xl border ${config.border} ${config.bg} text-center transition-all`}
              >
                <p className={`text-2xl font-bold ${config.color}`}>{count}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {config.label} ({percentage}%)
                </p>
              </div>
            );
          })}
        </div>

        {/* Bias Selector */}
        <div className="mb-8">
          <p className="text-center text-sm text-muted-foreground mb-6 uppercase tracking-wider">
            Your Bias
          </p>
          <div className="flex justify-center gap-4">
            {(['bullish', 'neutral', 'bearish'] as BiasType[]).map((bias) => {
              const config = biasConfig[bias];
              const Icon = config.icon;
              const isActive = myBias === bias;
              
              return (
                <button
                  key={bias}
                  onClick={() => handleBiasChange(bias)}
                  className={`
                    relative px-8 py-4 rounded-2xl border-2 font-medium transition-all duration-300
                    ${isActive 
                      ? `${config.border} ${config.bg} ${config.color} ${config.glow} scale-105` 
                      : 'border-border/30 text-muted-foreground hover:border-border hover:text-foreground'
                    }
                  `}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-5 h-5" />
                    <span>{config.label}</span>
                  </div>
                  {isActive && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-foreground rounded-full animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sound Indicator */}
        <p className="text-center text-xs text-muted-foreground">
          {isMuted ? 'Sounds muted' : 'Sound feedback enabled'} • Click a bias to update
        </p>
      </main>
    </div>
  );
}
