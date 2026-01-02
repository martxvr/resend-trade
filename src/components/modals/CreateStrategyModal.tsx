
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMyStrategies } from '@/hooks/useStrategies';
import { RoomTemplate, useRoomTemplates } from '@/hooks/useRoomTemplates';
import { TimeframeSelector } from '@/components/TimeframeSelector';
import { TemplateSelector } from '@/components/TemplateSelector';
import { toast } from 'sonner';
import { X, ChevronRight, DollarSign } from 'lucide-react';

const DEFAULT_TIMEFRAMES = ['5m', '15m', '1h', '4h', '1D'];

interface CreateStrategyModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialMode?: 'personal' | 'creator';
}

export function CreateStrategyModal({ isOpen, onClose, initialMode = 'personal' }: CreateStrategyModalProps) {
    const navigate = useNavigate();
    const { createStrategy } = useMyStrategies();

    // Mode state (can toggle inside logic if we want, or stick to prop)
    const [mode, setMode] = useState<'personal' | 'creator'>(initialMode);

    useEffect(() => {
        setMode(initialMode);
    }, [initialMode, isOpen]);

    const [createStep, setCreateStep] = useState(1);

    // Form State
    const [newName, setNewName] = useState('');
    const [newInstrument, setNewInstrument] = useState('');
    const [newDescription, setNewDescription] = useState('');
    const [newTimeframes, setNewTimeframes] = useState<string[]>(DEFAULT_TIMEFRAMES);
    const [newIsPublic, setNewIsPublic] = useState(false);
    const [newPrice, setNewPrice] = useState<number>(0);

    const [selectedTemplate, setSelectedTemplate] = useState<RoomTemplate | null>(null);
    const [creating, setCreating] = useState(false);

    // Reset when opening/closing
    useEffect(() => {
        if (!isOpen) {
            // Delay reset to allow animation to finish if we had one
            // But simple reset is fine
        } else {
            resetForm();
        }
    }, [isOpen]);

    // Update public default based on mode
    useEffect(() => {
        if (isOpen) {
            setNewIsPublic(mode === 'creator');
        }
    }, [mode, isOpen]);

    const resetForm = () => {
        setNewName('');
        setNewInstrument('');
        setNewDescription('');
        setNewTimeframes(DEFAULT_TIMEFRAMES);
        setSelectedTemplate(null);
        setNewIsPublic(mode === 'creator');
        setNewPrice(0);
        setCreateStep(1);
    };

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
        onClose();

        if (strategy) {
            navigate(`/room/${strategy.id}`);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md flex items-center justify-center z-[100] p-4">
            <div className="bg-card border border-border/50 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="px-8 py-6 border-b border-border/10 flex items-center justify-between sticky top-0 bg-card/95 backdrop-blur-xl z-10">
                    <div>
                        <h2 className="font-display text-xl font-semibold text-foreground">
                            {mode === 'personal' ? 'Create Personal Strategy' : 'Launch New Product'}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Step {createStep} of {mode === 'personal' ? '2' : '3'}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
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
                                {mode === 'personal' ? (
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
                    {createStep === 3 && mode === 'creator' && (
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
    );
}
