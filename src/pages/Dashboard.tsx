import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useMyStrategies, Strategy } from '@/hooks/useStrategies';
import { useRoomTemplates, RoomTemplate, ASSET_CLASSES, TRADING_STYLES } from '@/hooks/useRoomTemplates';
import { TimeframeSelector } from '@/components/TimeframeSelector';
import { TemplateSelector, CategorySelector } from '@/components/TemplateSelector';
import { toast } from 'sonner';
import { Users, Plus, ArrowRight, LayoutGrid, DollarSign, Globe, Lock, Filter, Copy, MoreHorizontal, X, ChevronRight, ChevronLeft } from 'lucide-react';
import SidebarLayout from '@/components/ui/sidebar-component';
import { EtherealShadow } from '@/components/ui/ethereal-shadow';

const DEFAULT_TIMEFRAMES = ['5m', '15m', '1h', '4h', '1D'];

// ... (imports remain similar)

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const { strategies, loading: strategiesLoading, createStrategy } = useMyStrategies();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'personal' | 'creator'>('personal');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createStep, setCreateStep] = useState(1);

  // New Strategy State
  const [newName, setNewName] = useState('');
  const [newInstrument, setNewInstrument] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newTimeframes, setNewTimeframes] = useState<string[]>(DEFAULT_TIMEFRAMES);
  const [newIsPublic, setNewIsPublic] = useState(false);
  const [newPrice, setNewPrice] = useState<number>(0);

  const [selectedTemplate, setSelectedTemplate] = useState<RoomTemplate | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Set default public/private based on tab
  useEffect(() => {
    if (showCreateModal) {
      setNewIsPublic(activeTab === 'creator');
    }
  }, [showCreateModal, activeTab]);

  const handleTemplateSelect = (template: RoomTemplate) => {
    setSelectedTemplate(template);
    setNewTimeframes(template.timeframes);
  };

  const handleCreateStrategy = async () => {
    if (!newName.trim() || !newInstrument.trim() || newTimeframes.length === 0) {
      toast.error("Please fill in required fields");
      return;
    }

    setCreating(true);
    const { error, strategy } = await createStrategy(
      newName,
      newInstrument,
      newTimeframes,
      newIsPublic,
      newPrice,
      newDescription
    );
    setCreating(false);

    if (error) {
      console.error("Creation error:", error);
      toast.error(`Failed to create strategy: ${error.message || 'Unknown error'}`);
      return;
    }

    toast.success(newIsPublic ? 'Strategy Product Launched' : 'Personal Strategy Created');
    setShowCreateModal(false);
    resetCreateForm();

    if (strategy) {
      navigate(`/room/${strategy.id}`);
    }
  };

  const resetCreateForm = () => {
    setNewName('');
    setNewInstrument('');
    setNewDescription('');
    setNewTimeframes(DEFAULT_TIMEFRAMES);
    setSelectedTemplate(null);
    setNewIsPublic(false);
    setNewPrice(0);
    setCreateStep(1);
  };

  // Filter strategies based on tab
  const personalStrategies = strategies.filter(s => !s.is_public);
  const creatorStrategies = strategies.filter(s => s.is_public);
  const displayedStrategies = activeTab === 'personal' ? personalStrategies : creatorStrategies;

  if (authLoading) return null;

  return (
    <SidebarLayout onCreateRoom={() => setShowCreateModal(true)}>
      <EtherealShadow color="rgba(80, 80, 80, 1)" animation={{ scale: 100, speed: 90 }} noise={{ opacity: 0.6, scale: 1.2 }} sizing="fill" className="min-h-screen" grayscale={true}>
        <div className="max-w-6xl mx-auto px-6 pt-12 pb-6">

          {/* Header & Tabs */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <h1 className="font-display text-3xl font-semibold text-foreground mb-4">
                Dashboard
              </h1>

              <div className="flex p-1 bg-card/50 border border-border/50 rounded-xl w-fit backdrop-blur-sm">
                <button
                  onClick={() => setActiveTab('personal')}
                  className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'personal'
                    ? 'bg-foreground text-background shadow-lg'
                    : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                  Personal Edge
                </button>
                {/* Creator Studio Tab temporarily disabled per user request */}
                {/* <button
                  onClick={() => setActiveTab('creator')}
                  className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'creator'
                    ? 'bg-foreground text-background shadow-lg'
                    : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                  Creator Studio
                </button> */}
              </div>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-foreground text-background font-medium rounded-xl hover:bg-foreground/90 transition-all shadow-lg shadow-foreground/10"
            >
              <Plus className="w-4 h-4" />
              {activeTab === 'personal' ? 'New Personal Strategy' : 'New Product'}
            </button>
          </div>

          {/* Context Banner */}
          <div className="mb-8 p-4 rounded-xl border border-border/30 bg-card/20 flex items-center gap-4">
            {activeTab === 'personal' ? (
              <>
                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500"><LayoutGrid className="w-5 h-5" /></div>
                <div>
                  <h3 className="text-sm font-medium text-foreground">Personal Workspace</h3>
                  <p className="text-xs text-muted-foreground">Private strategies to structure your bias and track stats. Not visible on marketplace.</p>
                </div>
              </>
            ) : (
              <>
                <div className="p-2 bg-accent-purple/10 rounded-lg text-accent-purple"><Globe className="w-5 h-5" /></div>
                <div>
                  <h3 className="text-sm font-medium text-foreground">Creator Studio</h3>
                  <p className="text-xs text-muted-foreground">Monetize your edge. Manage public products, subscriptions, and verified track records.</p>
                </div>
              </>
            )}
          </div>

          {/* Grid */}
          {strategiesLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin h-6 w-6 border-2 border-foreground border-t-transparent rounded-full" />
            </div>
          ) : displayedStrategies.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-border/50 rounded-2xl bg-card/10">
              <div className="w-16 h-16 bg-card/50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-border/20">
                {activeTab === 'personal' ? <LayoutGrid className="w-8 h-8 text-muted-foreground" /> : <DollarSign className="w-8 h-8 text-muted-foreground" />}
              </div>
              <h3 className="text-xl font-medium text-foreground mb-2">
                {activeTab === 'personal' ? 'No Personal Strategies' : 'No Active Products'}
              </h3>
              <p className="text-muted-foreground max-w-sm mx-auto mb-8">
                {activeTab === 'personal'
                  ? "Start by structuring your day-to-day trading bias."
                  : "You haven't launched any monetizable products yet."}
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 border border-border/50 text-foreground font-medium rounded-xl hover:bg-card/50 transition-all"
              >
                {activeTab === 'personal' ? 'Create Strategy' : 'Launch Product'}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {displayedStrategies.map((strategy) => (
                <div
                  key={strategy.id}
                  onClick={() => navigate(`/room/${strategy.id}`)}
                  className="group relative bg-card/30 border border-border/30 rounded-2xl p-6 hover:border-accent-purple/30 hover:bg-card/50 transition-all duration-300 cursor-pointer overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight className="w-5 h-5 text-muted-foreground -rotate-45 group-hover:rotate-0 transition-transform duration-300" />
                  </div>

                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-card to-background border border-border/20 flex items-center justify-center">
                      <span className="font-display font-bold text-lg text-foreground/80">
                        {strategy.instrument.substring(0, 2).toUpperCase()}
                      </span>
                    </div>
                    {strategy.is_public && (
                      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 text-green-500 text-xs font-medium border border-green-500/20">
                        <Globe className="w-3 h-3" />
                        Public
                      </span>
                    )}
                    {!strategy.is_public && (
                      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-500 text-xs font-medium border border-blue-500/20">
                        <Lock className="w-3 h-3" />
                        Private
                      </span>
                    )}
                  </div>

                  <h3 className="font-display text-lg font-semibold text-foreground mb-1 group-hover:text-accent-purple transition-colors">
                    {strategy.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2 min-h-[40px]">
                    {strategy.description || 'No description provided.'}
                  </p>

                  <div className="flex items-center gap-3 mt-auto pt-4 border-t border-border/10">
                    {strategy.is_public ? (
                      <>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Users className="w-3.5 h-3.5" />
                          <span>{strategy.member_count || 0} Subscriptions</span>
                        </div>
                        <div className="w-1 h-1 bg-border rounded-full" />
                        <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                          {strategy.price_monthly > 0 ? (
                            <span className="text-accent-green">${strategy.price_monthly}/mo</span>
                          ) : (
                            <span className="text-muted-foreground">Free</span>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <LayoutGrid className="w-3.5 h-3.5" />
                        <span>Personal Use</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create Flow Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-card border border-border/50 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-in">
              <div className="px-8 py-6 border-b border-border/10 flex items-center justify-between sticky top-0 bg-card/95 backdrop-blur-xl z-10">
                <div>
                  <h2 className="font-display text-xl font-semibold text-foreground">
                    {activeTab === 'personal' ? 'Create Personal Strategy' : 'Launch New Product'}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Step {createStep} of {activeTab === 'personal' ? '2' : '3'}
                  </p>
                </div>
                <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              <div className="p-8">
                {/* Step 1: Template (Common) */}
                {createStep === 1 && (
                  <div className="space-y-6">
                    <TemplateSelector onSelect={handleTemplateSelect} selectedId={selectedTemplate?.id} />
                    <div className="flex justify-end pt-4">
                      <button onClick={() => setCreateStep(2)} className="flex items-center gap-2 px-6 py-3 bg-foreground text-background font-medium rounded-xl hover:bg-foreground/90 transition-all">
                        Continue <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 2: Details (Common + Description) */}
                {createStep === 2 && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-foreground mb-2">Strategy Name</label>
                        <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Nifty Intraday" className="w-full px-4 py-3 bg-background border border-border/50 rounded-xl focus:ring-2 focus:ring-accent-purple/50 outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Instrument</label>
                        <input value={newInstrument} onChange={e => setNewInstrument(e.target.value)} placeholder="e.g. NIFTY, ES" className="w-full px-4 py-3 bg-background border border-border/50 rounded-xl focus:ring-2 focus:ring-accent-purple/50 outline-none" />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-foreground mb-2">Description (Optional)</label>
                        <textarea value={newDescription} onChange={e => setNewDescription(e.target.value)} placeholder="Describe your edge..." className="w-full px-4 py-3 bg-background border border-border/50 rounded-xl focus:ring-2 focus:ring-accent-purple/50 outline-none resize-none h-20" />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-foreground mb-2">Timeframes</label>
                        <TimeframeSelector selected={newTimeframes} onChange={setNewTimeframes} />
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button onClick={() => setCreateStep(1)} className="flex-1 py-3 border border-border/50 text-foreground font-medium rounded-xl hover:bg-card/50">Back</button>

                      {/* If Personal, this is the final step */}
                      {activeTab === 'personal' ? (
                        <button
                          onClick={handleCreateStrategy}
                          disabled={creating || !newName || !newInstrument}
                          className="flex-1 py-3 bg-foreground text-background font-medium rounded-xl hover:bg-foreground/90 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {creating ? <div className="w-5 h-5 border-2 border-background/30 border-t-background rounded-full animate-spin" /> : "Create Strategy"}
                        </button>
                      ) : (
                        // If Creator, go to next step
                        <button
                          onClick={() => setCreateStep(3)}
                          disabled={!newName || !newInstrument}
                          className="flex-1 py-3 bg-foreground text-background font-medium rounded-xl hover:bg-foreground/90 disabled:opacity-50"
                        >
                          Next: Monetization
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 3: Monetization (Creator Only) */}
                {createStep === 3 && activeTab === 'creator' && (
                  <div className="space-y-8">
                    <div className="p-4 rounded-xl border border-border/40 bg-card/30 space-y-4">
                      <label className="flex items-start gap-4 cursor-pointer">
                        <div className="relative flex items-center">
                          <input type="checkbox" checked={newIsPublic} onChange={e => setNewIsPublic(e.target.checked)} className="w-5 h-5 border-border rounded text-accent-purple focus:ring-accent-purple bg-transparent" />
                        </div>
                        <div>
                          <span className="block font-medium text-foreground">Public Marketplace List</span>
                          <span className="block text-sm text-muted-foreground mt-1">Make visible to everyone. Uncheck to keep as 'Draft' (Private).</span>
                        </div>
                      </label>

                      {newIsPublic && (
                        <div className="pl-9 animate-fade-in relative">
                          <label className="block text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">Monthly Subscription Price ($)</label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                              type="number"
                              min="0"
                              value={newPrice}
                              onChange={e => {
                                const val = parseFloat(e.target.value);
                                setNewPrice(isNaN(val) ? 0 : val);
                              }}
                              className="w-full pl-9 pr-4 py-2 bg-background border border-border/50 rounded-lg focus:ring-2 focus:ring-green-500/50 outline-none font-mono"
                            />
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">Set to 0 for free access. Platform fee 10%.</p>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button onClick={() => setCreateStep(2)} className="flex-1 py-3 border border-border/50 text-foreground font-medium rounded-xl hover:bg-card/50">Back</button>
                      <button
                        onClick={handleCreateStrategy}
                        disabled={creating}
                        className="flex-1 py-3 bg-foreground text-background font-medium rounded-xl hover:bg-foreground/90 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {creating ? <div className="w-5 h-5 border-2 border-background/30 border-t-background rounded-full animate-spin" /> : "Launch Product"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </EtherealShadow>
    </SidebarLayout>
  );
}
