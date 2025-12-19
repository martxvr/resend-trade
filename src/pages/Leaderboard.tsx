import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, Users, TrendingUp } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useFollows } from '@/hooks/useFollows';
import { TraderCard } from '@/components/TraderCard';
import { NotificationBell } from '@/components/NotificationBell';

export default function Leaderboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { traders, loading } = useLeaderboard();
  const { followingCount, followersCount } = useFollows();

  // Find current user's rank
  const myRank = traders.findIndex(t => t.user_id === user?.id) + 1;
  const myStats = traders.find(t => t.user_id === user?.id);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/30">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="font-display text-xl font-semibold text-foreground">
              Leaderboard
            </h1>
          </div>
          <NotificationBell />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        {user && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-card/30 border border-border/30 rounded-xl p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Trophy className="w-4 h-4" />
                <span className="text-xs">Your Rank</span>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {myRank > 0 ? `#${myRank}` : '-'}
              </p>
            </div>
            <div className="bg-card/30 border border-border/30 rounded-xl p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <TrendingUp className="w-4 h-4" />
                <span className="text-xs">Accuracy</span>
              </div>
              <p className="text-2xl font-bold text-accent-green">
                {myStats?.accuracy_percentage?.toFixed(1) || 0}%
              </p>
            </div>
            <div className="bg-card/30 border border-border/30 rounded-xl p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Users className="w-4 h-4" />
                <span className="text-xs">Following</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{followingCount}</p>
            </div>
            <div className="bg-card/30 border border-border/30 rounded-xl p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Users className="w-4 h-4" />
                <span className="text-xs">Followers</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{followersCount}</p>
            </div>
          </div>
        )}

        {/* Leaderboard */}
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold text-foreground">
              Top Traders
            </h2>
            <span className="text-sm text-muted-foreground">
              {traders.length} traders
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin h-6 w-6 border-2 border-foreground border-t-transparent rounded-full" />
            </div>
          ) : traders.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-border/50 rounded-2xl">
              <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium text-foreground mb-2">No rankings yet</h3>
              <p className="text-muted-foreground text-sm">
                Make predictions in rooms to appear on the leaderboard
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {traders.map((trader, index) => (
                <TraderCard key={trader.user_id} trader={trader} rank={index + 1} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
