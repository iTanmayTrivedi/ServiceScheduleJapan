import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface Recommendation {
  time: string;
  score: number;
  reason: string;
}

interface Props {
  availableSlots: string[];
  serviceName: string;
  dayOfWeek: string;
  bookingPatterns: any[];
  onSelectSlot: (slot: string) => void;
  selectedSlot: string | null;
}

export function SmartSlotRecommendation({ availableSlots, serviceName, dayOfWeek, bookingPatterns, onSelectSlot, selectedSlot }: Props) {
  const { t } = useTranslation();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [shown, setShown] = useState(false);

  const fetchRecommendations = async () => {
    if (availableSlots.length === 0) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          type: 'recommend_slots',
          context: { availableSlots, serviceName, dayOfWeek, bookingPatterns },
        },
      });
      if (error) throw error;
      setRecommendations(data?.recommendations || []);
      setShown(true);
    } catch (err) {
      console.error('Slot recommendation error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (availableSlots.length === 0) return null;

  return (
    <div className="space-y-3">
      {!shown && (
        <Button variant="outline" size="sm" onClick={fetchRecommendations} disabled={loading} className="gap-2 border-accent/30 text-accent hover:bg-accent/10">
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          AI Recommend Best Times
        </Button>
      )}
      {shown && recommendations.length > 0 && (
        <div className="rounded-lg border border-accent/20 bg-accent/5 p-3 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-medium text-accent">
            <Sparkles className="h-3.5 w-3.5" />
            AI Recommended Slots
          </div>
          <div className="space-y-1.5">
            {recommendations.map((rec, i) => (
              <button
                key={rec.time}
                onClick={() => onSelectSlot(rec.time)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-md border px-3 py-2 text-left text-sm transition-all',
                  selectedSlot === rec.time
                    ? 'border-accent bg-accent text-accent-foreground'
                    : 'border-border hover:border-accent/50 hover:bg-muted/50'
                )}
              >
                <span className="font-medium tabular-nums">{rec.time}</span>
                <span className="flex-1 text-xs text-muted-foreground truncate">{rec.reason}</span>
                <span className="flex items-center gap-0.5 text-xs">
                  <Star className={cn('h-3 w-3', rec.score >= 8 ? 'fill-warning text-warning' : 'text-muted-foreground')} />
                  {rec.score}/10
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
