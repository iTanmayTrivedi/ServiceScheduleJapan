import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface RatingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: any;
  onRated: () => void;
}

export function RatingDialog({ open, onOpenChange, appointment, onRated }: RatingDialogProps) {
  const { user, isDemoMode } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!rating || !user || !appointment) return;
    setSubmitting(true);

    if (isDemoMode) {
      toast({ title: t('ratings.submitted') });
      setRating(0);
      setComment('');
      onOpenChange(false);
      onRated();
      setSubmitting(false);
      return;
    }

    try {
      const { error } = await supabase.from('ratings').insert({
        appointment_id: appointment.id,
        user_id: user.id,
        rating,
        comment: comment.trim(),
      });
      if (error) throw error;
      toast({ title: t('ratings.submitted') });
      setRating(0);
      setComment('');
      onOpenChange(false);
      onRated();
    } catch (err: any) {
      toast({ title: t('ratings.failed'), description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const displayRating = hoveredRating || rating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">{t('ratings.title')}</DialogTitle>
          <DialogDescription>{t('ratings.desc', { service: appointment?.services?.name || '' })}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="flex items-center justify-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="p-1 transition-transform hover:scale-110"
              >
                <Star
                  className={cn(
                    'h-8 w-8 transition-colors',
                    star <= displayRating ? 'fill-warning text-warning' : 'text-muted-foreground/30'
                  )}
                />
              </button>
            ))}
          </div>
          <p className="text-center text-sm text-muted-foreground">
            {displayRating === 1 && t('ratings.poor')}
            {displayRating === 2 && t('ratings.fair')}
            {displayRating === 3 && t('ratings.good')}
            {displayRating === 4 && t('ratings.veryGood')}
            {displayRating === 5 && t('ratings.excellent')}
          </p>
          <Textarea
            placeholder={t('ratings.commentPlaceholder')}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            maxLength={500}
          />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleSubmit} disabled={!rating || submitting}>
              {submitting ? t('common.loading') : t('ratings.submit')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
