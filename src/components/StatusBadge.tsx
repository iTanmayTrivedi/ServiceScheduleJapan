import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const statusStyles: Record<string, string> = {
  pending: 'bg-warning/15 text-warning border-warning/30',
  confirmed: 'bg-info/15 text-info border-info/30',
  completed: 'bg-success/15 text-success border-success/30',
  cancelled: 'bg-destructive/15 text-destructive border-destructive/30',
  no_show: 'bg-muted text-muted-foreground border-border',
};

export function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  const style = statusStyles[status] || statusStyles.pending;
  return (
    <Badge variant="outline" className={cn('text-xs font-medium', style)}>
      {t(`status.${status}`)}
    </Badge>
  );
}