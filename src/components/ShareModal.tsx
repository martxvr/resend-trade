import { useState, useRef } from 'react';
import { X, Download, Share2, Link2, Code, Copy, Check, Camera } from 'lucide-react';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: {
    id: string;
    name: string;
    instrument: string;
    join_code: string;
  };
  stats: {
    overallBias: 'bullish' | 'bearish' | 'neutral';
    bullish: number;
    bearish: number;
    neutral: number;
    total: number;
  };
}

export default function ShareModal({ isOpen, onClose, room, stats }: ShareModalProps) {
  const [activeTab, setActiveTab] = useState<'snapshot' | 'invite' | 'embed'>('snapshot');
  const [customMessage, setCustomMessage] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const snapshotRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const baseUrl = window.location.origin;
  const roomUrl = `${baseUrl}/room/${room.id}`;
  const inviteUrl = customMessage 
    ? `${roomUrl}?msg=${encodeURIComponent(customMessage)}`
    : roomUrl;

  const embedCode = `<iframe 
  src="${baseUrl}/embed/${room.id}" 
  width="320" 
  height="180" 
  frameborder="0" 
  style="border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);"
></iframe>`;

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const generateSnapshot = async () => {
    if (!snapshotRef.current) return;
    
    setIsGenerating(true);
    try {
      const canvas = await html2canvas(snapshotRef.current, {
        backgroundColor: '#0a0a0a',
        scale: 2,
        logging: false,
      });
      
      const link = document.createElement('a');
      link.download = `${room.name.toLowerCase().replace(/\s+/g, '-')}-bias-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      toast.success('Snapshot downloaded');
    } catch (error) {
      toast.error('Failed to generate snapshot');
    } finally {
      setIsGenerating(false);
    }
  };

  const shareToTwitter = () => {
    const text = `${room.instrument} - ${room.name}\n\nRoom Consensus: ${stats.overallBias.toUpperCase()}\n🟢 Bullish: ${stats.bullish} | 🔴 Bearish: ${stats.bearish} | ⚪ Neutral: ${stats.neutral}\n\nJoin with code: ${room.join_code}`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const biasColor = stats.overallBias === 'bullish' ? '#22c55e' : stats.overallBias === 'bearish' ? '#ef4444' : '#6b7280';

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border/50 rounded-2xl w-full max-w-lg animate-scale-in overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/30">
          <h2 className="font-display text-lg font-semibold text-foreground">Share Room</h2>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border/30">
          {[
            { id: 'snapshot', label: 'Snapshot', icon: Camera },
            { id: 'invite', label: 'Invite Link', icon: Link2 },
            { id: 'embed', label: 'Embed', icon: Code },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'text-foreground border-b-2 border-foreground bg-foreground/5'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Snapshot Tab */}
          {activeTab === 'snapshot' && (
            <div className="space-y-6">
              {/* Preview Card */}
              <div 
                ref={snapshotRef}
                className="p-6 rounded-xl"
                style={{ backgroundColor: '#0a0a0a' }}
              >
                <div className="text-center">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-1">
                    {room.instrument}
                  </p>
                  <h3 className="text-xl font-semibold text-white mb-4">{room.name}</h3>
                  
                  <div 
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl mb-4"
                    style={{ 
                      backgroundColor: `${biasColor}15`,
                      border: `1px solid ${biasColor}40`
                    }}
                  >
                    <span className="text-[10px] uppercase tracking-[0.15em] text-gray-400">Consensus</span>
                    <span 
                      className="text-lg font-bold uppercase"
                      style={{ color: biasColor }}
                    >
                      {stats.overallBias}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-center gap-6 text-sm">
                    <div className="text-center">
                      <p className="text-lg font-bold text-green-500">{stats.bullish}</p>
                      <p className="text-[10px] uppercase tracking-wider text-gray-500">Bullish</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-red-500">{stats.bearish}</p>
                      <p className="text-[10px] uppercase tracking-wider text-gray-500">Bearish</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-gray-400">{stats.neutral}</p>
                      <p className="text-[10px] uppercase tracking-wider text-gray-500">Neutral</p>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-800">
                    <p className="text-[10px] text-gray-500">
                      {stats.total} traders · Join: <span className="text-gray-300 font-mono">{room.join_code}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={generateSnapshot}
                  disabled={isGenerating}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-foreground text-background font-medium rounded-xl hover:bg-foreground/90 transition-all disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  {isGenerating ? 'Generating...' : 'Download PNG'}
                </button>
                <button
                  onClick={shareToTwitter}
                  className="flex items-center justify-center gap-2 px-6 py-3 border border-border/50 text-foreground font-medium rounded-xl hover:bg-card/50 transition-all"
                >
                  <Share2 className="w-4 h-4" />
                  Tweet
                </button>
              </div>
            </div>
          )}

          {/* Invite Link Tab */}
          {activeTab === 'invite' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Custom Message (optional)
                </label>
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Add a personal message for your invite..."
                  className="w-full px-4 py-3 bg-background border border-border/50 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/50 resize-none"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Invite Link
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={inviteUrl}
                    className="flex-1 px-4 py-3 bg-background border border-border/50 rounded-xl text-foreground text-sm truncate"
                  />
                  <button
                    onClick={() => copyToClipboard(inviteUrl, 'invite')}
                    className="px-4 py-3 bg-foreground text-background font-medium rounded-xl hover:bg-foreground/90 transition-all"
                  >
                    {copiedField === 'invite' ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Join Code
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={room.join_code}
                    className="flex-1 px-4 py-3 bg-background border border-border/50 rounded-xl text-foreground font-mono text-center text-lg tracking-widest"
                  />
                  <button
                    onClick={() => copyToClipboard(room.join_code, 'code')}
                    className="px-4 py-3 border border-border/50 text-foreground font-medium rounded-xl hover:bg-card/50 transition-all"
                  >
                    {copiedField === 'code' ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Embed Tab */}
          {activeTab === 'embed' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Embed Preview
                </label>
                <div className="p-4 bg-background/50 rounded-xl border border-border/30">
                  <div 
                    className="w-[280px] mx-auto rounded-xl p-4"
                    style={{ 
                      backgroundColor: '#0a0a0a',
                      border: '1px solid rgba(255,255,255,0.1)'
                    }}
                  >
                    <p className="text-[9px] uppercase tracking-[0.15em] text-gray-500 mb-1">
                      {room.instrument}
                    </p>
                    <h4 className="text-sm font-semibold text-white mb-2">{room.name}</h4>
                    <div className="flex items-center justify-between">
                      <span 
                        className="text-xs font-bold uppercase"
                        style={{ color: biasColor }}
                      >
                        {stats.overallBias}
                      </span>
                      <div className="flex items-center gap-3 text-[10px]">
                        <span className="text-green-500">{stats.bullish}↑</span>
                        <span className="text-red-500">{stats.bearish}↓</span>
                        <span className="text-gray-400">{stats.neutral}○</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Embed Code
                </label>
                <div className="relative">
                  <pre className="p-4 bg-background border border-border/50 rounded-xl text-xs text-muted-foreground overflow-x-auto">
                    <code>{embedCode}</code>
                  </pre>
                  <button
                    onClick={() => copyToClipboard(embedCode, 'embed')}
                    className="absolute top-2 right-2 p-2 bg-card border border-border/50 rounded-lg hover:bg-card/80 transition-all"
                  >
                    {copiedField === 'embed' ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                  </button>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                The embed widget updates in real-time and shows your room's current bias consensus.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}