import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number;
  size?: 'sm' | 'md';
  showValue?: boolean;
}

export function StarRating({ rating, size = 'sm', showValue = false }: StarRatingProps) {
  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-5 w-5';

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            iconSize,
            star <= rating ? 'fill-warning text-warning' : 'text-muted-foreground/20'
          )}
        />
      ))}
      {showValue && <span className="ml-1 text-xs font-medium text-muted-foreground">{rating.toFixed(1)}</span>}
    </div>
  );
}
