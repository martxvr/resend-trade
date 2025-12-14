import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRoom } from '@/hooks/useRoom';
import { useBiasSound } from '@/hooks/useBiasSound';
import { TimeframeBiasGrid, BiasType, biasConfig, calculateAggregateBias } from '@/components/TimeframeBiasGrid';
import { TimeframeSelector } from '@/components/TimeframeSelector';
import { toast } from 'sonner';
import { ArrowLeft, Users, Copy, Volume2, VolumeX, TrendingUp, TrendingDown, Minus, Settings, RotateCcw } from 'lucide-react';

export default function Room() {
  const { roomId } = useParams<{ roomId: string }>();
  const { user, loading: authLoading } = useAuth();
  const { 
    room, 
    myTimeframeBiases, 
    myAggregateBias,
    stats, 
    loading, 
    joinRoom, 
    leaveRoom, 
    updateTimeframeBias,
    updateTimeframes,
    resetAllBiases,
    isOwner 
  } = useRoom(roomId || null);
  const { playBiasSound, isMuted, toggleMute } = useBiasSound();
  const navigate = useNavigate();
  const [hasJoined, setHasJoined] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editTimeframes, setEditTimeframes] = useState<string[]>([]);

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

  // Initialize edit timeframes when room loads
  useEffect(() => {
    if (room?.timeframes) {
      setEditTimeframes(room.timeframes);
    }
  }, [room?.timeframes]);

  const handleBiasChange = async (timeframe: string, newBias: BiasType) => {
    playBiasSound(newBias);
    const { error } = await updateTimeframeBias(timeframe, newBias);
    
    if (error) {
      toast.error('Failed to update bias');
    }
  };

  const handleSaveTimeframes = async () => {
    const { error } = await updateTimeframes(editTimeframes);
    if (error) {
      toast.error('Failed to update timeframes');
    } else {
      toast.success('Timeframes updated');
      setShowSettings(false);
    }
  };

  const handleResetBiases = async () => {
    const { error } = await resetAllBiases();
    if (error) {
      toast.error('Failed to reset biases');
    } else {
      toast.success('All biases reset');
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
  const myOverallConfig = biasConfig[myAggregateBias.overallBias];
  const MyOverallIcon = myOverallConfig.icon;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/30">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleMute}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
              title={isMuted ? 'Unmute sounds' : 'Mute sounds'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            {isOwner && (
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                title="Room settings"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}
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
      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* Room Info */}
        <div className="text-center mb-10">
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

        {/* Room Consensus */}
        <div className={`mb-10 p-6 rounded-3xl border ${overallConfig.border} ${overallConfig.bg} ${overallConfig.glow} transition-all duration-500`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">
                Room Consensus
              </p>
              <div className={`flex items-center gap-2 ${overallConfig.color}`}>
                <OverallIcon className="w-6 h-6" />
                <span className="font-display text-2xl font-bold">
                  {overallConfig.label}
                </span>
              </div>
            </div>
            <div className="flex gap-6 text-sm">
              <div className="text-center">
                <p className="text-lg font-bold text-accent-green">{stats.bullish}</p>
                <p className="text-xs text-muted-foreground">Bullish</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-red-400">{stats.bearish}</p>
                <p className="text-xs text-muted-foreground">Bearish</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-muted-foreground">{stats.neutral}</p>
                <p className="text-xs text-muted-foreground">Neutral</p>
              </div>
            </div>
          </div>
        </div>

        {/* My Aggregate Bias */}
        <div className={`mb-8 p-4 rounded-2xl border ${myOverallConfig.border} ${myOverallConfig.bg} transition-all duration-300`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MyOverallIcon className={`w-5 h-5 ${myOverallConfig.color}`} />
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Your Overall Bias</p>
                <p className={`font-medium ${myOverallConfig.color}`}>{myOverallConfig.label}</p>
              </div>
            </div>
            <div className="flex gap-4 text-xs">
              <span className="text-accent-green">{myAggregateBias.bullishCount} Bull</span>
              <span className="text-red-400">{myAggregateBias.bearishCount} Bear</span>
              <span className="text-muted-foreground">{myAggregateBias.neutralCount} Neutral</span>
            </div>
          </div>
        </div>

        {/* Timeframe Bias Grid */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground uppercase tracking-wider">
              Set Your Bias Per Timeframe
            </p>
            <p className="text-xs text-muted-foreground">
              Click to cycle: Neutral → Bullish → Bearish
            </p>
          </div>
          <TimeframeBiasGrid
            timeframes={room.timeframes || []}
            biases={myTimeframeBiases}
            onBiasChange={handleBiasChange}
          />
        </div>

        {/* Sound Indicator */}
        <p className="text-center text-xs text-muted-foreground">
          {isMuted ? 'Sounds muted' : 'Sound feedback enabled'}
        </p>
      </main>

      {/* Settings Modal (Owner only) */}
      {showSettings && isOwner && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border/50 rounded-2xl p-8 w-full max-w-lg animate-scale-in">
            <h2 className="font-display text-xl font-semibold text-foreground mb-6">
              Room Settings
            </h2>
            
            <div className="space-y-6">
              <TimeframeSelector
                selected={editTimeframes}
                onChange={setEditTimeframes}
              />

              <div className="pt-4 border-t border-border/30">
                <button
                  onClick={handleResetBiases}
                  className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset all member biases
                </button>
              </div>
              
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className="flex-1 py-3 border border-border/50 text-foreground font-medium rounded-xl hover:bg-card/50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveTimeframes}
                  disabled={editTimeframes.length === 0}
                  className="flex-1 py-3 bg-foreground text-background font-medium rounded-xl hover:bg-foreground/90 transition-all disabled:opacity-50"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
