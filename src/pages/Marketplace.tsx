import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePublicStrategies } from '@/hooks/useStrategies';
import { EtherealShadow } from '@/components/ui/ethereal-shadow';
import SidebarLayout from '@/components/ui/sidebar-component';
import { Search, Globe, Users, TrendingUp, Filter } from 'lucide-react';

export default function Marketplace() {
    const { strategies, loading } = usePublicStrategies();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');

    const filteredStrategies = strategies.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.instrument.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <SidebarLayout>
            <EtherealShadow
                color="rgba(80, 80, 80, 1)"
                animation={{ scale: 100, speed: 90 }}
                noise={{ opacity: 0.6, scale: 1.2 }}
                sizing="fill"
                className="min-h-screen"
            >
                <div className="max-w-6xl mx-auto px-6 pt-12 pb-6">
                    <div className="mb-12 text-center">
                        <h1 className="font-display text-4xl font-semibold text-foreground mb-4">
                            Strategy Marketplace
                        </h1>
                        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                            Discover proven trading edges. Subscribe to professional context and structured biases from top traders.
                        </p>
                    </div>

                    {/* Search & Filter */}
                    <div className="flex justify-center mb-12">
                        <div className="relative w-full max-w-xl group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-muted-foreground group-focus-within:text-foreground transition-colors" />
                            </div>
                            <input
                                type="text"
                                className="block w-full pl-11 pr-4 py-4 bg-card/50 border border-border/50 rounded-2xl text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-accent-purple/50 outline-none backdrop-blur-sm transition-all shadow-lg"
                                placeholder="Search by asset, trader, or strategy name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Grid */}
                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="animate-spin h-8 w-8 border-2 border-foreground border-t-transparent rounded-full" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredStrategies.map(strategy => (
                                <div
                                    key={strategy.id}
                                    onClick={() => navigate(`/room/${strategy.id}`)}
                                    className="group bg-card/30 border border-border/30 rounded-2xl overflow-hidden hover:border-accent-purple/30 hover:bg-card/50 transition-all cursor-pointer flex flex-col h-full"
                                >
                                    <div className="h-32 bg-gradient-to-br from-background to-card border-b border-border/20 p-6 flex flex-col justify-between group-hover:from-accent-purple/5 transition-colors">
                                        <div className="flex justify-between items-start">
                                            <span className="font-mono text-xs font-bold bg-background/50 border border-border/50 px-2 py-1 rounded text-foreground">
                                                {strategy.instrument}
                                            </span>
                                            <span className="flex items-center gap-1 text-xs font-semibold text-green-500 bg-green-500/10 px-2 py-1 rounded-full border border-green-500/20">
                                                <Globe className="w-3 h-3" />
                                                Verified
                                            </span>
                                        </div>
                                    </div>

                                    <div className="p-6 flex-1 flex flex-col">
                                        <h3 className="font-display text-xl font-semibold text-foreground mb-2 group-hover:text-accent-purple transition-colors">
                                            {strategy.name}
                                        </h3>
                                        <p className="text-sm text-muted-foreground line-clamp-2 mb-6 flex-1">
                                            {strategy.description || 'No description provided.'}
                                        </p>

                                        <div className="flex items-center justify-between pt-4 border-t border-border/10 mt-auto">
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Users className="w-4 h-4" />
                                                <span>{strategy.member_count || 0}</span>
                                            </div>
                                            <div className="font-medium text-foreground">
                                                {strategy.price_monthly > 0 ? `$${strategy.price_monthly}/mo` : 'Free'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </EtherealShadow>
        </SidebarLayout>
    );
}
