import { useRoomTemplates, RoomTemplate, ASSET_CLASSES, TRADING_STYLES } from '@/hooks/useRoomTemplates';
import { Clock, TrendingUp, BarChart2 } from 'lucide-react';

interface TemplateSelectorProps {
  onSelect: (template: RoomTemplate) => void;
  selectedId?: string;
}

export function TemplateSelector({ onSelect, selectedId }: TemplateSelectorProps) {
  const { templates, loading } = useRoomTemplates();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin h-5 w-5 border-2 border-foreground border-t-transparent rounded-full" />
      </div>
    );
  }

  const getStyleLabel = (style: RoomTemplate['trading_style']) => {
    return TRADING_STYLES.find(s => s.value === style)?.label || style;
  };

  const getAssetLabel = (asset: RoomTemplate['asset_class']) => {
    return ASSET_CLASSES.find(a => a.value === asset)?.label || asset;
  };

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground mb-3">
        Choose a template or configure manually
      </p>
      <div className="grid gap-2 max-h-64 overflow-y-auto pr-1">
        {templates.map((template) => (
          <button
            key={template.id}
            type="button"
            onClick={() => onSelect(template)}
            className={`text-left p-3 rounded-xl border transition-all ${
              selectedId === template.id
                ? 'border-accent-purple bg-accent-purple/10'
                : 'border-border/50 hover:border-border hover:bg-card/50'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="font-medium text-foreground text-sm">{template.name}</h4>
                {template.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">{template.description}</p>
                )}
              </div>
              <div className="flex gap-1 flex-shrink-0">
                {template.trading_style && (
                  <span className="px-1.5 py-0.5 bg-accent-blue/10 text-accent-blue text-[10px] rounded">
                    {getStyleLabel(template.trading_style)}
                  </span>
                )}
                {template.asset_class && (
                  <span className="px-1.5 py-0.5 bg-accent-green/10 text-accent-green text-[10px] rounded">
                    {getAssetLabel(template.asset_class)}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              {template.timeframes.join(', ')}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

interface CategorySelectorProps {
  assetClass: string | null;
  tradingStyle: string | null;
  onAssetClassChange: (value: string | null) => void;
  onTradingStyleChange: (value: string | null) => void;
}

export function CategorySelector({ 
  assetClass, 
  tradingStyle, 
  onAssetClassChange, 
  onTradingStyleChange 
}: CategorySelectorProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          <TrendingUp className="w-4 h-4 inline mr-1.5" />
          Asset Class (optional)
        </label>
        <div className="flex flex-wrap gap-2">
          {ASSET_CLASSES.map((ac) => (
            <button
              key={ac.value}
              type="button"
              onClick={() => onAssetClassChange(assetClass === ac.value ? null : ac.value)}
              className={`px-3 py-1.5 text-sm rounded-lg border transition-all ${
                assetClass === ac.value
                  ? 'border-accent-green bg-accent-green/10 text-accent-green'
                  : 'border-border/50 text-muted-foreground hover:border-border hover:text-foreground'
              }`}
            >
              {ac.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          <BarChart2 className="w-4 h-4 inline mr-1.5" />
          Trading Style (optional)
        </label>
        <div className="flex flex-wrap gap-2">
          {TRADING_STYLES.map((ts) => (
            <button
              key={ts.value}
              type="button"
              onClick={() => onTradingStyleChange(tradingStyle === ts.value ? null : ts.value)}
              className={`px-3 py-1.5 text-sm rounded-lg border transition-all ${
                tradingStyle === ts.value
                  ? 'border-accent-blue bg-accent-blue/10 text-accent-blue'
                  : 'border-border/50 text-muted-foreground hover:border-border hover:text-foreground'
              }`}
            >
              {ts.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
