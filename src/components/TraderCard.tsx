import { UserPlus, UserMinus, Trophy, Target, BarChart3 } from 'lucide-react';
import { TraderStats } from '@/hooks/useLeaderboard';
import { useFollows } from '@/hooks/useFollows';
import { useAuth } from '@/hooks/useAuth';

interface TraderCardProps {
  trader: TraderStats;
  rank: number;
}

export function TraderCard({ trader, rank }: TraderCardProps) {
  const { user } = useAuth();
  const { isFollowing, followTrader, unfollowTrader } = useFollows();
  
  const isMe = user?.id === trader.user_id;
  const following = isFollowing(trader.user_id);

  const handleFollowClick = async () => {
    if (following) {
      await unfollowTrader(trader.user_id);
    } else {
      await followTrader(trader.user_id);
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return { icon: '🥇', color: 'text-yellow-400' };
    if (rank === 2) return { icon: '🥈', color: 'text-gray-400' };
    if (rank === 3) return { icon: '🥉', color: 'text-amber-600' };
    return { icon: `#${rank}`, color: 'text-muted-foreground' };
  };

  const rankBadge = getRankBadge(rank);

  return (
    <div className="group bg-card/30 border border-border/30 rounded-xl p-4 hover:border-border/60 hover:bg-card/50 transition-all">
      <div className="flex items-center gap-4">
        {/* Rank */}
        <div className={`w-10 h-10 flex items-center justify-center rounded-lg bg-secondary/50 ${rankBadge.color} font-bold text-sm`}>
          {rank <= 3 ? rankBadge.icon : rankBadge.icon}
        </div>

        {/* Trader Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground truncate">
              {trader.username || 'Anonymous Trader'}
            </span>
            {isMe && (
              <span className="px-1.5 py-0.5 bg-accent-purple/20 text-accent-purple text-[10px] font-medium rounded">
                YOU
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <BarChart3 className="w-3 h-3" />
              {trader.rooms_participated} rooms
            </span>
            <span className="flex items-center gap-1">
              <Target className="w-3 h-3" />
              {trader.total_predictions} calls
            </span>
          </div>
        </div>

        {/* Accuracy */}
        <div className="text-right">
          <div className="flex items-center gap-1 justify-end">
            <Trophy className="w-4 h-4 text-accent-amber" />
            <span className={`font-bold text-lg ${
              trader.accuracy_percentage >= 70 ? 'text-accent-green' :
              trader.accuracy_percentage >= 50 ? 'text-foreground' :
              'text-muted-foreground'
            }`}>
              {trader.accuracy_percentage?.toFixed(1) || 0}%
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {trader.correct_predictions}/{trader.total_predictions}
          </p>
        </div>

        {/* Follow Button */}
        {!isMe && user && (
          <button
            onClick={handleFollowClick}
            className={`p-2 rounded-lg transition-all ${
              following
                ? 'bg-accent-purple/20 text-accent-purple hover:bg-red-500/20 hover:text-red-400'
                : 'bg-secondary/50 text-muted-foreground hover:bg-accent-purple/20 hover:text-accent-purple'
            }`}
            title={following ? 'Unfollow' : 'Follow'}
          >
            {following ? <UserMinus className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  );
}
