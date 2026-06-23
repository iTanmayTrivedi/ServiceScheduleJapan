import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StarRating } from '@/components/StarRating';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { Star, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

export function AdminRatingsOverview() {
  const { isDemoMode } = useAuth();
  const { t } = useTranslation();
  const [ratings, setRatings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDemoMode) {
      setRatings([
        { id: '1', rating: 5, comment: 'Excellent service!', created_at: new Date().toISOString(), user_id: 'customer-001' },
        { id: '2', rating: 4, comment: 'Very professional', created_at: new Date().toISOString(), user_id: 'customer-002' },
        { id: '3', rating: 5, comment: 'Great experience', created_at: new Date().toISOString(), user_id: 'customer-001' },
      ]);
      setLoading(false);
      return;
    }

    const fetchRatings = async () => {
      const { data } = await supabase.from('ratings').select('*').order('created_at', { ascending: false }).limit(20);
      setRatings(data || []);
      setLoading(false);
    };
    fetchRatings();
  }, [isDemoMode]);

  const avgRating = ratings.length > 0 ? ratings.reduce((s, r) => s + r.rating, 0) / ratings.length : 0;
  const fiveStarPct = ratings.length > 0 ? Math.round((ratings.filter(r => r.rating === 5).length / ratings.length) * 100) : 0;

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="font-display text-lg flex items-center gap-2">
          <Star className="h-5 w-5 text-warning" />
          {t('ratings.overview')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
        ) : ratings.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">{t('ratings.noRatings')}</p>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <p className="text-3xl font-bold">{avgRating.toFixed(1)}</p>
                <div>
                  <StarRating rating={Math.round(avgRating)} size="md" />
                  <p className="text-xs text-muted-foreground">{t('profile.basedOn', { count: ratings.length })}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-1.5">
                <TrendingUp className="h-4 w-4 text-accent" />
                <span className="text-sm font-medium">{fiveStarPct}% ★5</span>
              </div>
            </div>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {ratings.slice(0, 5).map((r) => (
                <div key={r.id} className="flex items-start gap-2 rounded-lg border border-border p-2.5">
                  <StarRating rating={r.rating} />
                  <div className="flex-1 min-w-0">
                    {r.comment && <p className="text-xs text-muted-foreground truncate">{r.comment}</p>}
                  </div>
                  <span className="text-[10px] text-muted-foreground/60 shrink-0">{format(new Date(r.created_at), 'MMM dd')}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
