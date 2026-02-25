import { AlertTriangle } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

export function Disclaimer() {
  const { t } = useI18n();

  return (
    <div className="flex items-center gap-2 px-4 py-1.5 bg-warning/5 border-b border-warning/10">
      <AlertTriangle className="w-3 h-3 text-warning/60 flex-shrink-0" />
      <p className="text-[10px] text-warning/50 leading-tight">
        <span className="font-semibold text-warning/70">{t('disclaimer.label')}</span> {t('disclaimer.text')}
      </p>
    </div>
  );
}
