import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useStrategy, Bias, useStrategyActions } from '@/hooks/useStrategies';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Check, X, AlertTriangle, Clock, Globe, Lock, TrendingUp, TrendingDown, Minus, Pencil, Trash2, Settings, Share2, Link as LinkIcon, Camera, Download, ChevronLeft, ChevronRight, GripVertical, User, UserPlus, UserMinus, RotateCcw, ClipboardCheck } from 'lucide-react';
import { Reorder } from "framer-motion";
import { PremiumBackground } from '@/components/ui/premium-background';
import RoomBiasTracker from '@/components/RoomBiasTracker';
import { ChecklistRunner } from '@/components/ChecklistRunner';
import html2canvas from 'html2canvas';

// Form Types
interface BiasFormState {
  direction: 'long' | 'short' | 'neutral';
  timeframe: string;
  logicContext: Bias['logic_context'];
  thesis: string;
  invalidationLevel: string;
}

const INITIAL_FORM: BiasFormState = {
  direction: 'neutral',
  timeframe: '',
  logicContext: null,
  thesis: '',
  invalidationLevel: ''
};

export default function Room() {
  const { roomId } = useParams<{ roomId: string }>();
  const { user, loading: authLoading } = useAuth();
  const { strategy, biases, coOwners, loading, createBias, updateBiasStatus, updateBiasDetails, stats, refresh } = useStrategy(roomId || null);
  const { updateStrategy, deleteStrategy, addCoOwner, removeCoOwner, resetAllBiases } = useStrategyActions();
  const navigate = useNavigate();

  const [historyPage, setHistoryPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const [showDefineModal, setShowDefineModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);
  const [shareTab, setShareTab] = useState<'snapshot' | 'link' | 'embed'>('snapshot');
  const [form, setForm] = useState<BiasFormState>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [editingBiasId, setEditingBiasId] = useState<string | null>(null);
  const [editedName, setEditedName] = useState('');
  const [newTimeframe, setNewTimeframe] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [coOwnerEmail, setCoOwnerEmail] = useState('');
  const [inviting, setInviting] = useState(false);

  const [localTimeframes, setLocalTimeframes] = useState<string[]>([]);
  const [isTimeframeModified, setIsTimeframeModified] = useState(false);

  // Map of timeframe to latest bias for easy lookup
  const itemsPerTimeframe = useMemo(() => {
    return biases
      .filter(b => b.status === 'active')
      .reduce((acc, bias) => {
        if (!acc[bias.timeframe]) {
          acc[bias.timeframe] = bias;
        }
        return acc;
      }, {} as Record<string, Bias>);
  }, [biases]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!strategy) return;

    // Set default timeframe if current is invalid or not set
    const currentTfValid = strategy.timeframes.includes(form.timeframe);
    if (strategy.timeframes.length > 0 && (!form.timeframe || !currentTfValid)) {
      setForm(prev => ({ ...prev, timeframe: strategy.timeframes[0] }));
    }

    if (strategy.name) {
      setEditedName(strategy.name);
    }
  }, [strategy, strategy?.timeframes]);

  useEffect(() => {
    if (strategy?.timeframes) {
      setLocalTimeframes(strategy.timeframes);
    }
  }, [strategy?.timeframes]);

  const handleCreateBias = async () => {
    if (!form.thesis || !form.timeframe || !form.logicContext) {
      toast.error('Please complete all required fields');
      return;
    }

    setSubmitting(true);

    if (editingBiasId) {
      const { error } = await updateBiasDetails(editingBiasId, {
        thesis: form.thesis,
        logic_context: form.logicContext,
        invalidation_level: form.invalidationLevel
      });
      setSubmitting(false);
      if (error) {
        toast.error('Failed to update bias');
      } else {
        toast.success('Context Updated');
        setShowDefineModal(false);
        setEditingBiasId(null);
        setForm({ ...INITIAL_FORM, timeframe: strategy?.timeframes[0] || '' });
      }
    } else {
      const { error } = await createBias(
        form.direction,
        form.timeframe,
        form.thesis,
        form.logicContext,
        form.invalidationLevel || null
      );
      setSubmitting(false);

      if (error) {
        toast.error('Failed to define bias');
      } else {
        toast.success('Edge Defined');
        setShowDefineModal(false);
        setForm({ ...INITIAL_FORM, timeframe: strategy?.timeframes[0] || '' });
      }
    }
  };

  const handleStatusUpdate = async (biasId: string, status: Bias['status']) => {
    const { error } = await updateBiasStatus(biasId, status);
    if (!error) {
      if (status === 'validated') toast.success('Bias Validated');
      if (status === 'invalidated') toast.info('Bias Invalidated');
      if (status === 'closed') toast.success('Bias Closed');
    }
  };

  const handleAddTimeframeRaw = async (tf: string) => {
    if (!tf || !strategy) return;
    const updatedTimeframes = [...strategy.timeframes, tf];

    const { error } = await updateStrategy(strategy.id, { timeframes: updatedTimeframes });
    if (error) {
      toast.error('Failed to add timeframe');
    }
  };

  const handleRemoveTimeframe = async (tfToRemove: string) => {
    if (!strategy) return;
    const updatedTimeframes = strategy.timeframes.filter(tf => tf !== tfToRemove);

    if (updatedTimeframes.length === 0) {
      toast.error('Must have at least one timeframe');
      return;
    }

    const { error } = await updateStrategy(strategy.id, { timeframes: updatedTimeframes });
    if (error) {
      toast.error('Failed to remove timeframe');
    }
  };

  const handleSnapshot = async () => {
    const element = document.getElementById('capture-area');
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        backgroundColor: '#030014',
        scale: 2,
      });
      const link = document.createElement('a');
      link.download = `${strategy?.name || 'TradeBias'}_Snapshot.png`;
      link.href = canvas.toDataURL();
      link.click();
      toast.success('Snapshot Downloaded');
    } catch (err) {
      console.error('Snapshot failed:', err);
      toast.error('Failed to create snapshot');
    }
  };

  const openEditHistory = (bias: Bias) => {
    setEditingBiasId(bias.id);
    setForm({
      direction: bias.direction,
      timeframe: bias.timeframe,
      logicContext: bias.logic_context,
      thesis: bias.thesis,
      invalidationLevel: bias.invalidation_level || ''
    });
    setShowDefineModal(true);
  };


  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-foreground border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!strategy) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">Strategy Product not found</h2>
          <button onClick={() => navigate('/dashboard')} className="text-muted-foreground hover:text-foreground">
            Return to dashboard
          </button>
        </div>
      </div>
    );
  }


  // For the tracker, we need the latest ACTIVE bias for each timeframe to show current state
  const activeBiases = biases
    .filter(b => b.status === 'active')
    .reduce((acc, bias) => {
      if (!acc.find(b => b.timeframe === bias.timeframe)) {
        acc.push(bias);
      }
      return acc;
    }, [] as Bias[]);


  // Convert active biases to format required by RoomBiasTracker
  const myBiases = activeBiases.reduce((acc, bias) => {
    acc[bias.timeframe] = bias.direction === 'long' ? 'bullish' : bias.direction === 'short' ? 'bearish' : 'neutral';
    return acc;
  }, {} as Record<string, 'neutral' | 'bullish' | 'bearish'>);

  const handleResetAll = async () => {
    if (!strategy) return;
    console.log('Resetting all biases for strategy:', strategy.id);
    const { error } = await resetAllBiases(strategy.id, strategy.instrument);
    if (error) {
      console.error('Reset error details:', error);
      toast.error('Failed to reset all biases: ' + (error.message || 'Unknown error'));
    } else {
      toast.success('All biases reset to neutral');
      // Force refresh data to ensure UI updates immediately
      if (refresh) refresh();
    }
  };

  const handleAddCoOwner = async () => {
    if (!strategy || !coOwnerEmail) return;
    setInviting(true);
    const { error } = await addCoOwner(strategy.id, coOwnerEmail);
    setInviting(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Co-owner added');
      setCoOwnerEmail('');
    }
  };

  const handleRemoveCoOwner = async (coOwnerId: string) => {
    const { error } = await removeCoOwner(coOwnerId);
    if (error) {
      toast.error('Failed to remove co-owner');
    } else {
      toast.success('Co-owner removed');
    }
  };

  const isOwner = user?.id === strategy?.owner_id;
  const isCoOwner = coOwners.some(co => co.user_id === user?.id);
  const canInteract = isOwner || isCoOwner;

  const handleTrackerBiasChange = async (timeframe: string, direction: 'neutral' | 'bullish' | 'bearish') => {
    if (!canInteract || !strategy) return;
    // 1. Check if the bias is already the same as the last one for this timeframe to avoid duplicates
    const latestForTimeframe = itemsPerTimeframe[timeframe];
    const currentDirection = latestForTimeframe?.direction === 'long' ? 'bullish' : latestForTimeframe?.direction === 'short' ? 'bearish' : 'neutral';

    if (direction === currentDirection) return;

    // 2. Archive existing active bias if it exists
    if (latestForTimeframe) {
      await updateBiasStatus(latestForTimeframe.id, 'archived');
    }

    // 3. Create new Bias entry
    const newDirection = direction === 'bullish' ? 'long' : direction === 'bearish' ? 'short' : 'neutral';
    const { data: newBiasData, error } = await createBias(
      newDirection,
      timeframe,
      'Market Bias Update', // Default thesis for quick click
      'technical',
      null
    );

    if (!error && newBiasData) {
      toast.success(`${newDirection.toUpperCase()} Bias Set`, {
        description: `Bias set for ${timeframe}. You can add context in the history below.`,
        duration: 3000,
      });
    } else if (error) {
      toast.error('Failed to update bias');
      console.error('Bias update error:', error);
    }
  };

  // Timeframe Management Local State (Moved to top)

  const handleReorderLocal = (newOrder: string[]) => {
    setLocalTimeframes(newOrder);
    setIsTimeframeModified(true);
    // Debounced save could go here, but for now we'll save on modal close or immediate if preferred.
    // User expects "instant" but robust. Let's trigger update immediately but with local state driving UI.
    updateStrategy(strategy!.id, { timeframes: newOrder }).then(() => {
      if (refresh) refresh();
    }).catch(err => {
      toast.error('Failed to sync reorder');
      setLocalTimeframes(strategy!.timeframes); // Revert
    });
  };

  const handleAddTimeframeLocal = async (tf: string) => {
    if (!strategy) return;
    const newList = [...localTimeframes, tf];
    setLocalTimeframes(newList); // Optimistic

    const { error } = await updateStrategy(strategy.id, { timeframes: newList });
    if (error) {
      toast.error('Failed to add timeframe');
      setLocalTimeframes(localTimeframes); // Revert
    } else {
      if (refresh) refresh();
    }
  };

  const handleRemoveTimeframeLocal = async (tfToRemove: string) => {
    if (!strategy) return;
    const newList = localTimeframes.filter(tf => tf !== tfToRemove);

    if (newList.length === 0) {
      toast.error('Must have at least one timeframe');
      return;
    }

    setLocalTimeframes(newList); // Optimistic

    const { error } = await updateStrategy(strategy.id, { timeframes: newList });
    if (error) {
      toast.error('Failed to remove timeframe');
      setLocalTimeframes(localTimeframes); // Revert
    } else {
      if (refresh) refresh();
    }
  };

  const handleSaveSettings = async () => {
    if (!strategy) return;

    // Update Name if changed
    if (editedName !== strategy.name) {
      const { error } = await updateStrategy(strategy.id, { name: editedName });
      if (error) {
        toast.error('Failed to update name');
      } else {
        toast.success('Room updated');
        if (refresh) refresh();
      }
    }

    setShowSettingsModal(false);
  };

  const handleDeleteRoom = () => {
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!strategy) return;
    if (deleteConfirmation !== strategy.name) return;

    const { error } = await deleteStrategy(strategy.id);
    if (error) {
      toast.error('Failed to delete room');
    } else {
      toast.success('Room deleted');
      navigate('/dashboard');
    }
  };




  return (
    <div className="min-h-screen bg-background pb-20">
      <nav className="border-b border-border/30 sticky top-0 bg-background/80 backdrop-blur z-20">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Dashboard</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-card border border-border/50 rounded-full text-xs font-medium text-muted-foreground">
              {strategy.is_public ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
              {strategy.is_public ? 'Public Product' : 'Private Strategy'}
            </div>
            {strategy.price_monthly > 0 && (
              <div className="px-3 py-1.5 bg-green-500/10 text-green-500 border border-green-500/20 rounded-full text-xs font-bold">
                ${strategy.price_monthly}/mo
              </div>
            )}
          </div>
        </div>
      </nav>

      <PremiumBackground className="pt-12 pb-20">
        <div className="max-w-4xl mx-auto px-6">

          {/* Strategy Header */}
          <div className="mb-12 flex items-end justify-between">
            <div>
              <div className="flex items-center gap-4 mb-2">
                <h1 className="font-display text-4xl font-semibold text-foreground">
                  {strategy.name}
                </h1>
                {isOwner && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowShareModal(true)}
                      className="p-2 bg-card border border-border/30 rounded-full hover:bg-card/80 transition-colors text-muted-foreground hover:text-foreground"
                      title="Share Room"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setShowSettingsModal(true)}
                      className="p-2 bg-card border border-border/30 rounded-full hover:bg-card/80 transition-colors text-muted-foreground hover:text-foreground"
                      title="Manage Timeframes"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setShowChecklist(true)}
                      className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full hover:bg-emerald-500/20 transition-colors text-emerald-500 hover:text-emerald-400"
                      title="Verify Trade"
                    >
                      <ClipboardCheck className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              <p className="text-muted-foreground text-lg flex items-center gap-2">
                <span className="font-mono text-accent-purple bg-accent-purple/10 px-2 py-0.5 rounded">{strategy.instrument}</span>
                Strategy OS
              </p>
            </div>

          </div>

          {/* Core UI: Room Bias Tracker (The visual cards) */}
          <div className="mb-16" id="capture-area">
            <RoomBiasTracker
              timeframes={strategy.timeframes}
              myBiases={myBiases}
              onBiasChange={handleTrackerBiasChange}
              canInteract={canInteract}
              isOwner={isOwner}
              onReset={isOwner ? handleResetAll : undefined}
              stats={{
                bullishCount: activeBiases.filter(b => strategy.timeframes.includes(b.timeframe) && b.direction === 'long').length,
                bearishCount: activeBiases.filter(b => strategy.timeframes.includes(b.timeframe) && b.direction === 'short').length,
                neutralCount: strategy.timeframes.length - (
                  activeBiases.filter(b => strategy.timeframes.includes(b.timeframe) && b.direction === 'long').length +
                  activeBiases.filter(b => strategy.timeframes.includes(b.timeframe) && b.direction === 'short').length
                )
              }}
            />
          </div>



          {/* History Feed */}
          {biases.length > 0 && (
            <div className="mt-16 pt-8 border-t border-border/30">
              <h3 className="text-lg font-medium text-muted-foreground mb-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  History
                  <span className="text-xs font-normal opacity-50">{biases.length} items</span>
                </div>

                {biases.length > ITEMS_PER_PAGE && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                      disabled={historyPage === 1}
                      className="p-1.5 rounded-lg border border-border/20 hover:bg-card/40 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-medium min-w-[3rem] text-center">
                      {historyPage} / {Math.ceil(biases.length / ITEMS_PER_PAGE)}
                    </span>
                    <button
                      onClick={() => setHistoryPage(p => Math.min(Math.ceil(biases.length / ITEMS_PER_PAGE), p + 1))}
                      disabled={historyPage === Math.ceil(biases.length / ITEMS_PER_PAGE)}
                      className="p-1.5 rounded-lg border border-border/20 hover:bg-card/40 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </h3>
              <div className="space-y-3">
                {biases
                  .slice((historyPage - 1) * ITEMS_PER_PAGE, historyPage * ITEMS_PER_PAGE)
                  .map(bias => (
                    <div key={bias.id} className="group flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all">
                      {bias.timeframe === 'SYSTEM' ? (
                        <div className="flex items-center gap-4 w-full justify-center py-1">
                          <div className="flex flex-col items-center">
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/20 mb-1">SYSTEM EVENT</span>
                            <div className="flex items-center gap-2">
                              <RotateCcw className="w-3 h-3 text-white/40" />
                              <span className="text-sm font-mono font-bold text-white/60 tracking-wider">STRATEGY RESET</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-4 min-w-0">
                            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${bias.direction === 'long' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]' :
                              bias.direction === 'short' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.3)]' :
                                'bg-white/20'
                              }`} />

                            <div className="flex flex-col min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-white/30">{bias.timeframe}</span>
                                <span className={`px-1.5 py-0.5 rounded-md border ${bias.direction === 'long' ? 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5' :
                                  bias.direction === 'short' ? 'border-rose-500/20 text-rose-400 bg-rose-500/5' :
                                    'border-white/10 text-white/40 bg-white/5'
                                  } text-[9px] font-bold uppercase tracking-widest`}>
                                  {bias.direction === 'long' ? 'BULLISH' : bias.direction === 'short' ? 'BEARISH' : 'NEUTRAL'}
                                </span>
                              </div>
                              <p className={`text-sm truncate max-w-[400px] ${bias.thesis === 'Market Bias Update' ? 'text-muted-foreground/60 italic' : 'text-foreground/90 font-medium'}`}>
                                {bias.thesis}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 shrink-0">
                            <span className="text-[10px] text-muted-foreground/50 font-mono">
                              {new Date(bias.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>

                            {isOwner && (
                              <button
                                onClick={() => openEditHistory(bias)}
                                className="opacity-0 group-hover:opacity-100 p-2 text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-lg transition-all"
                                title={bias.thesis === 'Market Bias Update' ? 'Add Edge' : 'Edit Edge'}
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}

        </div>
      </PremiumBackground >

      {/* Checklist Modal */}
      <ChecklistRunner isOpen={showChecklist} onClose={() => setShowChecklist(false)} />

      {/* Define Edge Modal */}
      {
        showDefineModal && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-card border border-border/50 rounded-2xl w-full max-w-lg shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-border/10 flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold text-foreground">
                  {editingBiasId ? 'Edit Context' : 'Define Market Edge'}
                </h2>
                <button onClick={() => { setShowDefineModal(false); setEditingBiasId(null); }} className="p-2 hover:bg-white/5 rounded-lg"><X className="w-5 h-5" /></button>
              </div>

              <div className="p-6 space-y-6">
                {/* Direction */}
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setForm(f => ({ ...f, direction: 'long' }))}
                    className={`group relative p - 4 rounded - xl border transition - all duration - 300 hover: scale - [1.02] active: scale - [0.98] ${form.direction === 'long'
                      ? 'bg-green-500/10 border-green-500/50 shadow-[0_0_20px_-5px_hsl(var(--success)/0.3)]'
                      : 'bg-card border-border/50 hover:border-green-500/30'
                      } `}
                  >
                    <div className={`absolute inset - 0 rounded - xl bg - gradient - to - br from - green - 500 / 10 to - transparent opacity - 0 transition - opacity ${form.direction === 'long' ? 'opacity-100' : ''} `} />
                    <div className="relative flex flex-col items-center gap-2">
                      <TrendingUp className={`w - 6 h - 6 ${form.direction === 'long' ? 'text-green-500' : 'text-muted-foreground group-hover:text-green-500/70'} `} />
                      <span className={`text - sm font - bold uppercase tracking - wider ${form.direction === 'long' ? 'text-green-500' : 'text-muted-foreground'} `}>Long</span>
                    </div>
                  </button>

                  <button
                    onClick={() => setForm(f => ({ ...f, direction: 'neutral' }))}
                    className={`group relative p - 4 rounded - xl border transition - all duration - 300 hover: scale - [1.02] active: scale - [0.98] ${form.direction === 'neutral'
                      ? 'bg-accent/10 border-accent/50'
                      : 'bg-card border-border/50 hover:border-accent/30'
                      } `}
                  >
                    <div className="relative flex flex-col items-center gap-2">
                      <Minus className={`w - 6 h - 6 ${form.direction === 'neutral' ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground/70'} `} />
                      <span className={`text - sm font - bold uppercase tracking - wider ${form.direction === 'neutral' ? 'text-foreground' : 'text-muted-foreground'} `}>Neutral</span>
                    </div>
                  </button>

                  <button
                    onClick={() => setForm(f => ({ ...f, direction: 'short' }))}
                    className={`group relative p - 4 rounded - xl border transition - all duration - 300 hover: scale - [1.02] active: scale - [0.98] ${form.direction === 'short'
                      ? 'bg-red-500/10 border-red-500/50 shadow-[0_0_20px_-5px_hsl(var(--destructive)/0.3)]'
                      : 'bg-card border-border/50 hover:border-red-500/30'
                      } `}
                  >
                    <div className={`absolute inset - 0 rounded - xl bg - gradient - to - br from - red - 500 / 10 to - transparent opacity - 0 transition - opacity ${form.direction === 'short' ? 'opacity-100' : ''} `} />
                    <div className="relative flex flex-col items-center gap-2">
                      <TrendingDown className={`w - 6 h - 6 ${form.direction === 'short' ? 'text-red-500' : 'text-muted-foreground group-hover:text-red-500/70'} `} />
                      <span className={`text - sm font - bold uppercase tracking - wider ${form.direction === 'short' ? 'text-red-500' : 'text-muted-foreground'} `}>Short</span>
                    </div>
                  </button>
                </div>

                {/* Context & Timeframe */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-2">Timeframe</label>
                    <select
                      value={form.timeframe}
                      onChange={e => setForm(f => ({ ...f, timeframe: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-background border border-border/50 rounded-lg text-sm text-foreground focus:ring-1 focus:ring-foreground outline-none"
                    >
                      {strategy?.timeframes.map(tf => (
                        <option key={tf} value={tf}>{tf}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-2">Context Type</label>
                    <select
                      value={form.logicContext || ''}
                      onChange={e => setForm(f => ({ ...f, logicContext: e.target.value as Bias['logic_context'] }))}
                      className="w-full px-3 py-2.5 bg-background border border-border/50 rounded-lg text-sm text-foreground focus:ring-1 focus:ring-foreground outline-none"
                    >
                      <option value="" disabled>Select...</option>
                      <option value="session">Session (Intraday)</option>
                      <option value="technical">Technical Structure</option>
                      <option value="macro">Macro / Fundamental</option>
                      <option value="news">News / Event</option>
                    </select>
                  </div>
                </div>

                {/* Thesis */}
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-2">Thesis & Logic</label>
                  <textarea
                    value={form.thesis}
                    onChange={e => setForm(f => ({ ...f, thesis: e.target.value }))}
                    placeholder="Why? What is the edge here? (e.g. 'Breaking VWAP with volume divergence...')"
                    className="w-full px-4 py-3 bg-background border border-border/50 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-foreground outline-none min-h-[100px] resize-none"
                  />
                </div>

                {/* Invalidation */}
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-2 text-destructive/80">Invalidation Level (When are you wrong?)</label>
                  <input
                    value={form.invalidationLevel}
                    onChange={e => setForm(f => ({ ...f, invalidationLevel: e.target.value }))}
                    placeholder="e.g. 'Close below 4150' or 'CPI > 3.5%'"
                    className="w-full px-4 py-3 bg-background border border-border/50 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-destructive/50 outline-none"
                  />
                </div>

                <button
                  onClick={handleCreateBias}
                  disabled={submitting}
                  className="w-full py-3 bg-foreground text-background font-medium rounded-xl hover:bg-foreground/90 transition-all disabled:opacity-50 mt-4"
                >
                  {submitting ? 'Saving...' : (editingBiasId ? 'Update Context' : 'Confirm Edge')}
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Timeframe Management Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border/50 rounded-2xl w-full max-w-lg shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-border/10 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-foreground">Room Settings</h2>
              <button onClick={() => setShowSettingsModal(false)} className="p-2 hover:bg-white/5 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-8">
              {/* Room Renaming */}
              <div>
                <label className="text-sm font-medium text-foreground mb-3 block">Room Name</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    placeholder="Strategy/Room Name..."
                    className="flex-1 px-4 py-2 bg-background border border-border/50 rounded-xl text-sm outline-none focus:border-foreground/50 transition-all font-medium text-foreground"
                  />
                </div>
              </div>

              {/* Selected Timeframes */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-foreground">Selected Timeframes</label>
                  <span className="text-xs text-muted-foreground">{localTimeframes.length}/7</span>
                </div>
                <div className="flex flex-wrap gap-2 min-h-[50px] p-4 bg-background/50 rounded-xl border border-border/30">
                  {localTimeframes.length === 0 && <span className="text-xs text-muted-foreground italic">No timeframes selected</span>}
                  <Reorder.Group axis="x" values={localTimeframes} onReorder={handleReorderLocal} className="flex flex-wrap gap-2">
                    {localTimeframes.map((tf) => (
                      <Reorder.Item key={tf} value={tf} whileDrag={{ scale: 1.05 }} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#4F46E5]/10 border border-[#4F46E5]/30 text-[#818CF8] rounded-lg text-sm font-medium cursor-grab active:cursor-grabbing">
                        <GripVertical className="w-3 h-3 opacity-50" />
                        <span>{tf}</span>
                        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleRemoveTimeframeLocal(tf); }} className="hover:text-foreground hover:bg-black/20 rounded ml-1">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </Reorder.Item>
                    ))}
                  </Reorder.Group>
                </div>
              </div>

              {/* Available Timeframes */}
              <div>
                <label className="text-sm font-medium text-foreground mb-3 block">Available Timeframes</label>
                <div className="flex flex-wrap gap-2">
                  {['1m', '2m', '3m', '4m', '5m', '15m', '30m', '1h', '2h', '4h', '1D', '1W', '1M', '3M', '1Y'].map((tf) => {
                    const isSelected = localTimeframes.includes(tf);
                    return (
                      <button
                        key={tf}
                        onClick={() => !isSelected && handleAddTimeframeLocal(tf)}
                        disabled={isSelected}
                        className={`relative px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-200 ${isSelected
                          ? 'bg-background border-border text-muted-foreground opacity-50 cursor-default pl-4 pr-3'
                          : 'bg-card border-border/50 text-muted-foreground hover:text-foreground hover:border-foreground/30 hover:bg-accent/5'
                          }`}
                      >
                        {tf}
                        {isSelected && <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-0.5 border-2 border-background"><Check className="w-2 h-2 text-background font-bold" /></div>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Co-owner Management - Only for Owner */}
              {isOwner && (
                <div className="pt-6 border-t border-border/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-foreground">Co-owners</h3>
                    <span className="text-xs text-muted-foreground">{coOwners.length} members</span>
                  </div>
                  <div className="space-y-3">
                    {coOwners.map((co) => (
                      <div key={co.id} className="flex items-center justify-between p-3 rounded-xl bg-background/50 border border-border/20">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-accent-purple/10 border border-accent-purple/20 flex items-center justify-center">
                            <User className="w-4 h-4 text-accent-purple" />
                          </div>
                          <span className="text-sm font-medium text-foreground">{co.username || 'Anonymous'}</span>
                        </div>
                        <button onClick={() => handleRemoveCoOwner(co.id)} className="p-2 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-lg transition-all" title="Remove co-owner"><UserMinus className="w-4 h-4" /></button>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <input type="email" value={coOwnerEmail} onChange={(e) => setCoOwnerEmail(e.target.value)} placeholder="Invite by email..." className="flex-1 px-4 py-2 bg-background border border-border/50 rounded-xl text-sm outline-none focus:border-foreground/50 transition-all" />
                      <button onClick={handleAddCoOwner} disabled={inviting || !coOwnerEmail} className="px-4 py-2 bg-foreground text-background font-medium rounded-xl hover:bg-foreground/90 transition-all disabled:opacity-50 flex items-center gap-2">
                        <UserPlus className="w-4 h-4" /> Invite
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Danger Zone */}
              <div className="pt-6 border-t border-border/10">
                <h3 className="text-xs font-bold text-destructive uppercase tracking-wider mb-4">Danger Zone</h3>
                <button onClick={handleDeleteRoom} className="flex items-center gap-2 px-4 py-2 bg-destructive/10 text-destructive rounded-xl hover:bg-destructive/20 transition-colors text-sm font-medium">
                  <Trash2 className="w-4 h-4" /> Close & Delete Room
                </button>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-border/10">
                <button onClick={() => setShowSettingsModal(false)} className="px-6 py-2.5 bg-card border border-border/50 text-foreground font-medium rounded-xl hover:bg-card/80 transition-all">Cancel</button>
                <button onClick={handleSaveSettings} className="px-6 py-2.5 bg-foreground text-background font-medium rounded-xl hover:bg-foreground/90 transition-all">Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Safe Delete Modal */}
      {
        showDeleteModal && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-card border border-border/50 rounded-2xl w-full max-w-md shadow-2xl animate-scale-in">
              <div className="px-6 py-4 border-b border-border/10">
                <h2 className="font-display text-lg font-semibold text-destructive">Delete Room?</h2>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-sm text-foreground">
                  This action is <span className="font-bold text-destructive">irreversible</span>.
                  All biases, history, and stats associated with <span className="font-mono bg-card px-1 py-0.5 rounded border border-border/50">{strategy?.name}</span> will be permanently lost.
                </p>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">
                    Type <span className="text-foreground font-mono font-bold select-all">{strategy?.name}</span> to confirm
                  </label>
                  <input
                    value={deleteConfirmation}
                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                    placeholder={strategy?.name}
                    className="w-full px-4 py-2 bg-background border border-border/50 rounded-xl text-sm text-foreground focus:ring-1 focus:ring-destructive outline-none"
                  />
                </div>

                <div className="flex gap-3 justify-end pt-2">
                  <button
                    onClick={() => { setShowDeleteModal(false); setDeleteConfirmation(''); }}
                    className="px-4 py-2 bg-card border border-border/50 text-foreground font-medium rounded-xl hover:bg-card/80 transition-all text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmDelete}
                    disabled={deleteConfirmation !== strategy?.name}
                    className="px-4 py-2 bg-destructive/10 text-destructive border border-destructive/20 font-medium rounded-xl hover:bg-destructive/20 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Permanently Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Share Modal */}
      {
        showShareModal && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-card border border-border/50 rounded-2xl w-full max-w-md shadow-2xl animate-scale-in overflow-hidden">
              <div className="px-6 py-4 border-b border-border/10 flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold text-foreground">Share Room</h2>
                <button onClick={() => setShowShareModal(false)} className="p-2 hover:bg-white/5 rounded-lg"><X className="w-5 h-5" /></button>
              </div>

              <div className="px-1 pt-1">
                <div className="grid grid-cols-3 border-b border-border/10">
                  <button
                    onClick={() => setShareTab('snapshot')}
                    className={`py - 3 text - sm font - medium transition - colors relative ${shareTab === 'snapshot' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'} `}
                  >
                    <span className="flex items-center justify-center gap-2"><Camera className="w-4 h-4" /> Snapshot</span>
                    {shareTab === 'snapshot' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />}
                  </button>
                  <button
                    onClick={() => setShareTab('link')}
                    className={`py - 3 text - sm font - medium transition - colors relative ${shareTab === 'link' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'} `}
                  >
                    <span className="flex items-center justify-center gap-2"><LinkIcon className="w-4 h-4" /> Invite Link</span>
                    {shareTab === 'link' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />}
                  </button>
                  <button
                    onClick={() => setShareTab('embed')}
                    className={`py - 3 text - sm font - medium transition - colors relative ${shareTab === 'embed' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'} `}
                  >
                    <span className="flex items-center justify-center gap-2"><code className="text-xs">&lt;/&gt;</code> Embed</span>
                    {shareTab === 'embed' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />}
                  </button>
                </div>
              </div>

              <div className="p-6">

                {/* SNAPSHOT TAB */}
                {shareTab === 'snapshot' && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="relative group rounded-xl overflow-hidden border border-border/30 bg-black/40 mb-6">
                      <div className="aspect-[4/3] flex items-center justify-center p-8">
                        <div className="text-center" id="snapshot-preview">
                          <h3 className="font-display text-2xl font-bold text-foreground mb-1">{strategy?.name || 'TradingMetrics'}</h3>
                          <div className="flex justify-center gap-4 text-sm text-muted-foreground font-mono mb-6">
                            <span>{stats.bullishCount + stats.bearishCount + stats.neutralCount} Signals</span>
                          </div>

                          <div className={`inline-flex items-center px-4 py-2 rounded-xl border gap-2 shadow-lg transition-all
                            ${stats.bullishCount > stats.bearishCount ? 'bg-success/5 border-success/40 text-success' :
                              stats.bearishCount > stats.bullishCount ? 'bg-destructive/5 border-destructive/40 text-destructive' :
                                'bg-card border-border/50 text-muted-foreground'}`}
                          >
                            <span className={`w-2 h-2 rounded-full animate-pulse
                              ${stats.bullishCount > stats.bearishCount ? 'bg-success' :
                                stats.bearishCount > stats.bullishCount ? 'bg-destructive' :
                                  'bg-gray-500'}`}
                            />
                            <span className="text-xs uppercase tracking-[0.2em] font-bold">
                              {stats.bullishCount > stats.bearishCount ? 'Consensus Bullish' :
                                stats.bearishCount > stats.bullishCount ? 'Consensus Bearish' :
                                  'Consensus Neutral'}
                            </span>
                          </div>
                        </div>
                        {/* Overlay */}
                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                          <p className="text-sm font-medium text-white mb-3">Capture Bias Card</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={handleSnapshot}
                        className="py-3 bg-foreground text-background font-medium rounded-xl hover:bg-foreground/90 transition-all flex items-center justify-center gap-2"
                      >
                        <Download className="w-4 h-4" /> Download PNG
                      </button>
                      <button
                        className="py-3 bg-card border border-border/50 text-foreground font-medium rounded-xl hover:bg-card/80 transition-all flex items-center justify-center gap-2"
                      >
                        <Share2 className="w-4 h-4" /> Tweet
                      </button>
                    </div>
                  </div>
                )}

                {/* LINK TAB */}
                {shareTab === 'link' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-2 block">Custom Message (optional)</label>
                      <textarea
                        className="w-full bg-card/50 border border-border/50 rounded-xl px-4 py-3 text-sm min-h-[80px] outline-none focus:border-foreground/50 resize-none placeholder:text-muted-foreground/50"
                        placeholder="Add a personal message for your invite..."
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-foreground mb-2 block">Invite Link</label>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-black/40 border border-border/30 rounded-xl px-4 py-3 text-sm text-muted-foreground truncate font-mono">
                          {window.location.href}
                        </div>
                        <button
                          onClick={() => {
                            window.navigator.clipboard.writeText(window.location.href);
                            toast.success('Link Copied');
                          }}
                          className="p-3 bg-foreground text-background rounded-xl hover:bg-foreground/90 transition-all"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-foreground mb-2 block">Join Code</label>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-black/40 border border-border/30 rounded-xl px-4 py-3 text-sm text-foreground text-center font-mono tracking-widest font-bold">
                          2c80c2e5
                        </div>
                        <button
                          onClick={() => {
                            window.navigator.clipboard.writeText('2c80c2e5'); // Placeholder code
                            toast.success('Code Copied');
                          }}
                          className="p-3 bg-card border border-border/50 text-foreground rounded-xl hover:bg-card/80 transition-all"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* EMBED TAB */}
                {shareTab === 'embed' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div>
                      <label className="text-xs font-medium text-foreground mb-2 block">Embed Preview</label>
                      <div className="bg-card/20 border border-border/30 rounded-xl p-8 flex items-center justify-center">
                        <div className="bg-black border border-border/50 rounded-xl p-4 w-[280px]">
                          <span className="text-[10px] text-muted-foreground tracking-wider uppercase">NQ</span>
                          <div className="font-bold text-foreground">TradingMetrics</div>
                          <div className="flex justify-between items-center mt-2">
                            <span className="text-xs text-muted-foreground">NEUTRAL</span>
                            <div className="flex gap-2 text-[10px] font-mono">
                              <span className="text-green-500">0↑</span>
                              <span className="text-red-500">0↓</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-foreground mb-2 block">Embed Code</label>
                      <div className="relative group">
                        <pre className="bg-black/40 border border-border/30 rounded-xl p-4 text-[10px] text-muted-foreground font-mono overflow-x-auto">
                          {`<iframe
  src="${window.location.origin}/embed/${strategy.id}"
  width="320"
  height="180"
  frameborder="0"
  style="border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);"
></iframe>`}
                        </pre>
                        <button
                          onClick={() => {
                            const code = `<iframe src="${window.location.origin}/embed/${strategy.id}" width="320" height="180" frameborder="0" style="border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);"></iframe>`;
                            window.navigator.clipboard.writeText(code);
                            toast.success('Embed Code Copied');
                          }}
                          className="absolute top-2 right-2 p-2 bg-card border border-border/50 rounded-lg hover:bg-card/80 text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        )
      }

    </div >
  );
}