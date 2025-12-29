import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Strategy {
    id: string;
    name: string;
    instrument: string;
    description: string | null;
    price_monthly: number;
    is_public: boolean;
    owner_id: string;
    created_at: string;
    timeframes: string[];
    asset_class?: string;
    trading_style?: string;
    member_count?: number; // Count of subscribers
    reset_count?: number;
}

export interface StrategyCoOwner {
    id: string;
    strategy_id: string;
    user_id: string;
    created_at: string;
    username?: string;
}

export interface Bias {
    id: string;
    strategy_id: string;
    creator_id: string;
    direction: 'long' | 'short' | 'neutral';
    instrument: string;
    timeframe: string;
    logic_context: 'session' | 'macro' | 'news' | 'technical' | null;
    thesis: string;
    invalidation_level: string | null;
    status: 'active' | 'invalidated' | 'validated' | 'closed' | 'archived';
    created_at: string;
}

export interface StrategyStats {
    winRate: number;
    totalBiases: number;
    validatedCount: number;
    invalidatedCount: number;
    activeCount: number;
    bullishCount: number;
    bearishCount: number;
    neutralCount: number;
}

export function useStrategy(strategyId: string | null) {
    const { user } = useAuth();
    const [strategy, setStrategy] = useState<Strategy | null>(null);
    const [biases, setBiases] = useState<Bias[]>([]);
    const [coOwners, setCoOwners] = useState<StrategyCoOwner[]>([]);
    const [stats, setStats] = useState<StrategyStats>({
        winRate: 0,
        totalBiases: 0,
        validatedCount: 0,
        invalidatedCount: 0,
        activeCount: 0,
        bullishCount: 0,
        bearishCount: 0,
        neutralCount: 0
    });
    const [loading, setLoading] = useState(true);

    // Calculate stats derived from biases
    useEffect(() => {
        const validated = biases.filter(b => b.status === 'validated').length;
        const invalidated = biases.filter(b => b.status === 'invalidated').length;
        const totalClosed = validated + invalidated;
        const winRate = totalClosed > 0 ? Math.round((validated / totalClosed) * 100) : 0;

        const activeBiases = biases.filter(b => b.status === 'active');
        // For current tracker, we only count the LATEST bias per timeframe if we want to show current consensus
        // But for "Signals", the user might mean total history or active? 
        // Let's count active unique per timeframe for consensus, and total active for signals.

        const bullish = activeBiases.filter(b => b.direction === 'long').length;
        const bearish = activeBiases.filter(b => b.direction === 'short').length;
        const neutral = activeBiases.filter(b => b.direction === 'neutral').length;

        setStats({
            winRate,
            totalBiases: biases.length,
            validatedCount: validated,
            invalidatedCount: invalidated,
            activeCount: activeBiases.length,
            bullishCount: bullish,
            bearishCount: bearish,
            neutralCount: neutral
        });
    }, [biases]);

    // Fetch strategy and its biases
    useEffect(() => {
        if (!strategyId) {
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            // 1. Fetch Strategy
            const { data: stratData, error: stratError } = await supabase
                .from('strategies')
                .select('*')
                .eq('id', strategyId)
                .maybeSingle();

            if (stratError) {
                console.error('Error fetching strategy:', stratError);
                setLoading(false);
                return;
            }

            if (stratData) {
                setStrategy({
                    ...stratData,
                    timeframes: Array.isArray(stratData.timeframes) ? stratData.timeframes : [],
                } as Strategy);
            }

            // 2. Fetch Biases
            const { data: biasData, error: biasError } = await supabase
                .from('biases')
                .select('*')
                .eq('strategy_id', strategyId)
                .order('created_at', { ascending: false });

            if (biasError) {
                console.error('Error fetching biases:', biasError);
            } else {
                setBiases((biasData as Bias[]) || []);
            }

            // 3. Fetch Co-owners
            const { data: coOwnerData, error: coOwnerError } = await supabase
                .from('strategy_co_owners')
                .select('*, profiles(username)')
                .eq('strategy_id', strategyId);

            if (coOwnerError) {
                console.error('Error fetching co-owners:', coOwnerError);
            } else {
                const formatted = (coOwnerData || []).map((co: any) => ({
                    ...co,
                    username: co.profiles?.username
                })) as StrategyCoOwner[];
                setCoOwners(formatted);
            }

            setLoading(false);
        };

        const refresh = () => fetchData();
        (window as any).refreshStrategy = refresh; // Debug helper

        fetchData();

        // Subscribe to realtime updates for this strategy's biases
        // Subscribe to realtime updates
        const channel = supabase
            .channel(`strategy-${strategyId}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'biases', filter: `strategy_id=eq.${strategyId}` },
                async () => {
                    const { data } = await supabase
                        .from('biases')
                        .select('*')
                        .eq('strategy_id', strategyId)
                        .order('created_at', { ascending: false });
                    if (data) setBiases(data as Bias[]);
                }
            )
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'strategies', filter: `id=eq.${strategyId}` },
                (payload) => {
                    setStrategy(payload.new as Strategy);
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'strategy_co_owners', filter: `strategy_id=eq.${strategyId}` },
                async () => {
                    const { data } = await supabase
                        .from('strategy_co_owners')
                        .select('*, profiles(username)')
                        .eq('strategy_id', strategyId);
                    if (data) {
                        const formatted = data.map((co: any) => ({
                            ...co,
                            username: co.profiles?.username
                        })) as StrategyCoOwner[];
                        setCoOwners(formatted);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [strategyId]);

    const refresh = useCallback(async () => {
        if (!strategyId) return;
        setLoading(true);

        // 1. Refresh Strategy
        const { data: stratData } = await supabase
            .from('strategies')
            .select('*')
            .eq('id', strategyId)
            .maybeSingle();
        if (stratData) {
            setStrategy({
                ...stratData,
                timeframes: Array.isArray(stratData.timeframes) ? stratData.timeframes : [],
            } as Strategy);
        }

        // 2. Refresh Biases
        const { data: biasData } = await supabase
            .from('biases')
            .select('*')
            .eq('strategy_id', strategyId)
            .order('created_at', { ascending: false });
        if (biasData) setBiases(biasData as Bias[]);

        setLoading(false);
    }, [strategyId]);


    const createBias = useCallback(async (
        direction: Bias['direction'],
        timeframe: string,
        thesis: string = 'Quick Market Update',
        logicContext: Bias['logic_context'] = 'technical',
        invalidationLevel: string | null = null
    ) => {
        if (!strategyId || !user) return { error: new Error('Not authorized') };

        const { data, error } = await supabase
            .from('biases')
            .insert([{
                strategy_id: strategyId,
                creator_id: user.id,
                instrument: strategy?.instrument || 'Unknown',
                direction,
                timeframe,
                thesis,
                logic_context: logicContext,
                invalidation_level: invalidationLevel,
                status: 'active'
            }])
            .select()
            .single();

        if (error) {
            console.error('Error creating bias:', error);
            return { error };
        }

        // Optimistic update
        setBiases(prev => [data as Bias, ...prev]);
        return { error: null, data: data as Bias };
    }, [strategyId, user, strategy?.instrument]);

    const updateBiasStatus = useCallback(async (biasId: string, status: Bias['status']) => {
        const { error } = await supabase
            .from('biases')
            .update({ status })
            .eq('id', biasId);

        if (error) {
            console.error('Error updating bias:', error);
            return { error };
        }

        setBiases(prev => prev.map(b => b.id === biasId ? { ...b, status } : b));
        return { error: null };
    }, []);

    const updateBiasDetails = useCallback(async (
        biasId: string,
        updates: {
            thesis?: string;
            logic_context?: Bias['logic_context'];
            invalidation_level?: string;
        }
    ) => {
        const { error } = await supabase
            .from('biases')
            .update({
                thesis: updates.thesis,
                logic_context: updates.logic_context,
                invalidation_level: updates.invalidation_level
            })
            .eq('id', biasId);

        if (error) {
            console.error('Error updating bias details:', error);
            return { error };
        }

        setBiases(prev => prev.map(b => b.id === biasId ? { ...b, ...updates } : b));
        return { error: null };
    }, []);

    return {
        strategy,
        biases,
        coOwners,
        loading,
        createBias,
        updateBiasStatus,
        updateBiasDetails,
        stats,
        refresh
    };
}

export function useStrategyActions() {
    const { user } = useAuth();

    const updateStrategy = useCallback(async (
        strategyId: string,
        updates: {
            timeframes?: string[];
            name?: string;
            description?: string;
            price_monthly?: number;
            is_public?: boolean;
            reset_count?: number;
        }
    ) => {
        if (!user) return { error: new Error('Not authenticated') };

        const { error } = await supabase
            .from('strategies')
            .update(updates)
            .eq('id', strategyId)
            .eq('owner_id', user.id); // Ensure ownership

        if (error) {
            console.error('Error updating strategy:', error);
            return { error };
        }

        return { error: null };
    }, [user]);

    const deleteStrategy = useCallback(async (strategyId: string) => {
        if (!user) return { error: new Error('Not authenticated') };

        const { error } = await supabase
            .from('strategies')
            .delete()
            .eq('id', strategyId)
            .eq('owner_id', user.id);

        if (error) {
            console.error('Error deleting strategy:', error);
            return { error };
        }

        return { error: null };
    }, [user]);

    const addCoOwner = useCallback(async (strategyId: string, userEmail: string) => {
        if (!user) return { error: new Error('Not authenticated') };

        // 1. Get user ID by email via RPC
        const { data, error: rpcError } = await supabase
            .rpc('get_user_id_by_email', { p_email: userEmail });

        if (rpcError) return { error: rpcError };
        if (data.error) return { error: new Error(data.error) };

        // 2. Insert into strategy_co_owners
        const { error } = await supabase
            .from('strategy_co_owners')
            .insert([{
                strategy_id: strategyId,
                user_id: data.id
            }]);

        if (error) {
            console.error('Error adding co-owner:', error);
            return { error };
        }

        return { error: null };
    }, [user]);

    const removeCoOwner = useCallback(async (coOwnerId: string) => {
        const { error } = await supabase
            .from('strategy_co_owners')
            .delete()
            .eq('id', coOwnerId);

        if (error) {
            console.error('Error removing co-owner:', error);
            return { error };
        }

        return { error: null };
    }, []);

    const resetAllBiases = useCallback(async (strategyId: string, instrument: string) => {
        if (!user) return { error: new Error('Not authenticated') };

        // 1. Archive active biases
        const { error: archiveError } = await supabase
            .from('biases')
            .update({ status: 'archived' })
            .eq('strategy_id', strategyId)
            .eq('status', 'active');

        if (archiveError) {
            console.error('Error archiving biases:', archiveError);
            return { error: archiveError };
        }

        // 2. Insert reset marker in history
        const { error: insertError } = await supabase
            .from('biases')
            .insert([{
                strategy_id: strategyId,
                creator_id: user.id,
                instrument: instrument,
                direction: 'neutral',
                timeframe: 'SYSTEM',
                thesis: 'Strategy OS Reset',
                status: 'archived'
            }]);

        if (insertError) {
            console.error('Error creating reset marker:', insertError);
            return { error: insertError };
        }

        return { error: null };
    }, [user]);

    return { updateStrategy, deleteStrategy, addCoOwner, removeCoOwner, resetAllBiases };
}

export function useMyStrategies() {
    const { user } = useAuth();
    const [strategies, setStrategies] = useState<Strategy[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        const fetchStrategies = async () => {
            // Fetch strategies owned by user
            const { data, error } = await supabase
                .from('strategies')
                .select('*')
                .eq('owner_id', user.id)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching my strategies:', error);
            } else {
                const parsed = (data || []).map(s => ({
                    ...s,
                    timeframes: Array.isArray(s.timeframes) ? s.timeframes : []
                })) as Strategy[];
                setStrategies(parsed);
            }
            setLoading(false);
        };

        fetchStrategies();
    }, [user]);

    const createStrategy = useCallback(async (
        name: string,
        instrument: string,
        timeframes: string[],
        isPublic: boolean = false,
        price: number = 0,
        description: string = ''
    ) => {
        if (!user) return { error: new Error('Not authenticated'), strategy: null };

        const sanitizedPrice = isPublic && !isNaN(price) ? price : 0;

        const { data, error } = await supabase
            .from('strategies')
            .insert([{
                name,
                instrument,
                owner_id: user.id,
                is_public: isPublic,
                price_monthly: sanitizedPrice,
                timeframes,
                description
            }])
            .select()
            .single();

        if (error) {
            console.error('Error creating strategy:', error);
            // Return the full error object so the UI can display the message
            return { error, strategy: null };
        }

        const newStrategy = {
            ...data,
            timeframes: Array.isArray(data.timeframes) ? data.timeframes : []
        } as Strategy;

        setStrategies(prev => [newStrategy, ...prev]);
        return { error: null, strategy: newStrategy };
    }, [user]);

    return {
        strategies,
        loading,
        createStrategy
    };
}

export function usePublicStrategies() {
    const [strategies, setStrategies] = useState<Strategy[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPublic = async () => {
            const { data, error } = await supabase
                .from('strategies')
                .select('*')
                .eq('is_public', true)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching public strategies:', error);
            } else {
                const parsed = (data || []).map(s => ({
                    ...s,
                    timeframes: Array.isArray(s.timeframes) ? s.timeframes : []
                })) as Strategy[];
                setStrategies(parsed);
            }
            setLoading(false);
        };

        fetchPublic();
    }, []);

    return { strategies, loading };
}
