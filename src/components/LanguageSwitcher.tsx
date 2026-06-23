import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface LanguageSwitcherProps {
  variant?: 'light' | 'sidebar';
}

export function LanguageSwitcher({ variant = 'light' }: LanguageSwitcherProps) {
  const { i18n, t } = useTranslation();

  return (
    <Select value={i18n.language.startsWith('ja') ? 'ja' : 'en'} onValueChange={(val) => i18n.changeLanguage(val)}>
      <SelectTrigger
        className={cn(
          'w-[130px] h-8 text-xs gap-1',
          variant === 'sidebar' &&
            'border-sidebar-border bg-sidebar-accent text-sidebar-foreground hover:bg-sidebar-accent/80 focus:ring-sidebar-ring'
        )}
      >
        <Globe className="h-3.5 w-3.5" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="en">{t('common.english')}</SelectItem>
        <SelectItem value="ja">{t('common.japanese')}</SelectItem>
      </SelectContent>
    </Select>
  );
}