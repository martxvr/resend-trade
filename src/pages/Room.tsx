import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRoom } from '@/hooks/useRoom';
import { useBiasSound } from '@/hooks/useBiasSound';
import { BiasType, biasConfig } from '@/components/TimeframeBiasGrid';
import { TimeframeSelector } from '@/components/TimeframeSelector';
import RoomBiasTracker from '@/components/RoomBiasTracker';
import { toast } from 'sonner';
import { ArrowLeft, Users, Copy, Volume2, VolumeX, Settings } from 'lucide-react';

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
    updateParticipationMode,
    resetAllBiases,
    isOwner 
  } = useRoom(roomId || null);
  const { isMuted, toggleMute } = useBiasSound();
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

  const handleToggleMode = async () => {
    const newMode = room?.participation_mode === 'follow' ? 'participate' : 'follow';
    const { error } = await updateParticipationMode(newMode);
    if (error) {
      toast.error('Failed to update room mode');
    } else {
      toast.success(`Room is now in ${newMode} mode`);
    }
  };

  const copyJoinCode = () => {
    if (room?.join_code) {
      navigator.clipboard.writeText(room.join_code);
      toast.success('Join code copied');
    }
  };

  // Determine if user can interact with bias cards
  const canInteract = room?.participation_mode === 'participate' || isOwner;

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
      {/* Minimal Header */}
      <header className="border-b border-border/30">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
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

      {/* Main Content - Matching BiasTracker section layout */}
      <section className="border-t border-border/50 py-32">
        <div className="container mx-auto px-6">
          {/* Room Header - Matches BiasTracker header style */}
          <div className="mb-16">
            <p className="mb-4 text-sm tracking-[0.2em] uppercase text-muted-foreground">
              {room.instrument}
            </p>
            <h1 className="mb-6 font-display text-4xl font-medium tracking-tight md:text-5xl">
              {room.name}
            </h1>
            <div className="flex items-center gap-4 text-muted-foreground">
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                {stats.total} trader{stats.total !== 1 ? 's' : ''} online
              </span>
            </div>
          </div>

          {/* Room Consensus Card - Premium styling */}
          <div 
            className={`mb-16 rounded-2xl border px-10 py-8 transition-all duration-500 ${
              stats.overallBias === 'bullish' 
                ? 'border-success/50 bg-success/5 shadow-[0_0_50px_-15px_hsl(var(--success)/0.4)]'
                : stats.overallBias === 'bearish'
                ? 'border-destructive/50 bg-destructive/5 shadow-[0_0_50px_-15px_hsl(var(--destructive)/0.4)]'
                : 'border-border/50 bg-card/30'
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Room Consensus</span>
                <div className={`mt-2 flex items-center gap-3 ${overallConfig.color}`}>
                  <OverallIcon className="w-8 h-8" />
                  <span className="text-3xl font-medium uppercase tracking-wide">
                    {stats.overallBias}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-8 text-sm">
                <div className="text-center">
                  <p className="text-2xl font-bold text-success">{stats.bullish}</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">Bullish</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-destructive">{stats.bearish}</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">Bearish</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-muted-foreground">{stats.neutral}</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">Neutral</p>
                </div>
              </div>
            </div>
          </div>

          {/* Your Bias Tracker - Uses shared component matching homepage */}
          <RoomBiasTracker
            timeframes={room.timeframes || []}
            myBiases={myTimeframeBiases as Record<string, 'neutral' | 'bullish' | 'bearish'>}
            onBiasChange={handleBiasChange}
            canInteract={canInteract}
            participationMode={room.participation_mode || 'participate'}
            isOwner={isOwner}
            onToggleMode={handleToggleMode}
            onReset={handleResetBiases}
            stats={{
              bullishCount: myAggregateBias.bullishCount,
              bearishCount: myAggregateBias.bearishCount,
              neutralCount: myAggregateBias.neutralCount
            }}
          />

          {/* Sound status */}
          <p className="mt-12 text-center text-xs text-muted-foreground">
            {isMuted ? 'Sounds muted' : 'Sound feedback enabled'}
          </p>
        </div>
      </section>

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