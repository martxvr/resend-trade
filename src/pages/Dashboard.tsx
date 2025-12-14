import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useMyRooms } from '@/hooks/useRoom';
import { TimeframeSelector } from '@/components/TimeframeSelector';
import { toast } from 'sonner';
import { Users, Plus, ArrowRight, LogOut, Copy, X, Hash, ChevronRight, ChevronLeft } from 'lucide-react';

const DEFAULT_TIMEFRAMES = ['5m', '15m', '1h', '4h', '1D'];

export default function Dashboard() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { rooms, loading: roomsLoading, createRoom, joinByCode, closeRoom } = useMyRooms();
  const navigate = useNavigate();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomInstrument, setNewRoomInstrument] = useState('');
  const [newRoomTimeframes, setNewRoomTimeframes] = useState<string[]>(DEFAULT_TIMEFRAMES);
  const [joinCode, setJoinCode] = useState('');
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [createStep, setCreateStep] = useState(1);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const handleCreateRoom = async () => {
    if (!newRoomName.trim() || !newRoomInstrument.trim() || newRoomTimeframes.length === 0) return;
    
    setCreating(true);
    const { error, room } = await createRoom(newRoomName, newRoomInstrument, newRoomTimeframes);
    setCreating(false);
    
    if (error) {
      toast.error('Failed to create room');
      return;
    }
    
    toast.success('Room created');
    setShowCreateModal(false);
    resetCreateForm();
    
    if (room) {
      navigate(`/room/${room.id}`);
    }
  };

  const resetCreateForm = () => {
    setNewRoomName('');
    setNewRoomInstrument('');
    setNewRoomTimeframes(DEFAULT_TIMEFRAMES);
    setCreateStep(1);
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    
    setJoining(true);
    const { error, room } = await joinByCode(joinCode.trim());
    setJoining(false);
    
    if (error) {
      toast.error('Room not found');
      return;
    }
    
    toast.success('Joined room');
    setShowJoinModal(false);
    setJoinCode('');
    
    if (room) {
      navigate(`/room/${room.id}`);
    }
  };

  const handleCloseRoom = async (roomId: string) => {
    const { error } = await closeRoom(roomId);
    if (error) {
      toast.error('Failed to close room');
    } else {
      toast.success('Room closed');
    }
  };

  const copyJoinCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Join code copied');
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-foreground border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/30">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="font-display text-xl font-semibold tracking-tight text-foreground">
            TradeBias
          </a>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-12">
          <h1 className="font-display text-3xl font-semibold text-foreground mb-2">
            Your Rooms
          </h1>
          <p className="text-muted-foreground">
            Create or join trading rooms to share bias signals
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-10">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-foreground text-background font-medium rounded-xl hover:bg-foreground/90 transition-all"
          >
            <Plus className="w-4 h-4" />
            Create Room
          </button>
          <button
            onClick={() => setShowJoinModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 border border-border/50 text-foreground font-medium rounded-xl hover:bg-card/50 transition-all"
          >
            <Hash className="w-4 h-4" />
            Join Room
          </button>
        </div>

        {/* Rooms Grid */}
        {roomsLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin h-6 w-6 border-2 border-foreground border-t-transparent rounded-full" />
          </div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-border/50 rounded-2xl">
            <div className="w-12 h-12 bg-card/50 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Users className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">No rooms yet</h3>
            <p className="text-muted-foreground text-sm mb-6">
              Create your first trading room or join an existing one
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {rooms.map((room) => (
              <div
                key={room.id}
                className="group bg-card/30 border border-border/30 rounded-2xl p-6 hover:border-border/60 hover:bg-card/50 transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-display text-lg font-semibold text-foreground">
                        {room.name}
                      </h3>
                      <span className="px-2.5 py-0.5 bg-accent-purple/10 text-accent-purple text-xs font-medium rounded-full">
                        {room.instrument}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" />
                        {room.member_count} online
                      </span>
                      <button
                        onClick={() => copyJoinCode(room.join_code)}
                        className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        {room.join_code}
                      </button>
                      <span className="text-xs">
                        {room.timeframes?.length || 0} timeframes
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {room.owner_id === user?.id && (
                      <button
                        onClick={() => handleCloseRoom(room.id)}
                        className="p-2 text-muted-foreground hover:text-red-400 transition-colors"
                        title="Close room"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => navigate(`/room/${room.id}`)}
                      className="flex items-center gap-2 px-4 py-2 bg-foreground/10 text-foreground font-medium rounded-xl hover:bg-foreground/20 transition-all group-hover:translate-x-0.5"
                    >
                      Enter
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Room Modal - Multi-step */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border/50 rounded-2xl p-8 w-full max-w-lg animate-scale-in">
            {/* Step indicator */}
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-display text-xl font-semibold text-foreground">
                {createStep === 1 ? 'Room Details' : 'Configure Timeframes'}
              </h2>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full transition-colors ${createStep === 1 ? 'bg-foreground' : 'bg-border'}`} />
                <div className={`w-2 h-2 rounded-full transition-colors ${createStep === 2 ? 'bg-foreground' : 'bg-border'}`} />
              </div>
            </div>

            {createStep === 1 ? (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Room Name
                  </label>
                  <input
                    type="text"
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    className="w-full px-4 py-3 bg-background border border-border/50 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent-purple/50"
                    placeholder="Morning Session"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Instrument / Market
                  </label>
                  <input
                    type="text"
                    value={newRoomInstrument}
                    onChange={(e) => setNewRoomInstrument(e.target.value)}
                    className="w-full px-4 py-3 bg-background border border-border/50 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent-purple/50"
                    placeholder="ES, NQ, BTC..."
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      resetCreateForm();
                    }}
                    className="flex-1 py-3 border border-border/50 text-foreground font-medium rounded-xl hover:bg-card/50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreateStep(2)}
                    disabled={!newRoomName.trim() || !newRoomInstrument.trim()}
                    className="flex-1 py-3 bg-foreground text-background font-medium rounded-xl hover:bg-foreground/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <p className="text-sm text-muted-foreground">
                  Select up to 7 timeframes for bias tracking. Drag to reorder.
                </p>
                <TimeframeSelector
                  selected={newRoomTimeframes}
                  onChange={setNewRoomTimeframes}
                />
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setCreateStep(1)}
                    className="flex items-center justify-center gap-2 flex-1 py-3 border border-border/50 text-foreground font-medium rounded-xl hover:bg-card/50 transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateRoom}
                    disabled={creating || newRoomTimeframes.length === 0}
                    className="flex-1 py-3 bg-foreground text-background font-medium rounded-xl hover:bg-foreground/90 transition-all disabled:opacity-50"
                  >
                    {creating ? 'Creating...' : 'Create Room'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Join Room Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border/50 rounded-2xl p-8 w-full max-w-md animate-scale-in">
            <h2 className="font-display text-xl font-semibold text-foreground mb-6">
              Join Trading Room
            </h2>
            <form onSubmit={handleJoinRoom} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Room Code
                </label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toLowerCase())}
                  className="w-full px-4 py-3 bg-background border border-border/50 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent-purple/50 font-mono tracking-wider"
                  placeholder="abc123xy"
                  autoFocus
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="flex-1 py-3 border border-border/50 text-foreground font-medium rounded-xl hover:bg-card/50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={joining || !joinCode.trim()}
                  className="flex-1 py-3 bg-foreground text-background font-medium rounded-xl hover:bg-foreground/90 transition-all disabled:opacity-50"
                >
                  {joining ? 'Joining...' : 'Join'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
