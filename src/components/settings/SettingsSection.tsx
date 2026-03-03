import type { ReactNode } from 'react';

interface SettingsSectionProps {
  title: string;
  children: ReactNode;
  trailing?: ReactNode;
}

export function SettingsSection({ title, children, trailing }: SettingsSectionProps) {
  return (
    <section className="space-y-1">
      <div className="flex items-center justify-between px-1 pb-1">
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70 font-display">
          {title}
        </h3>
        {trailing}
      </div>
      <div className="rounded-xl border border-border/40 bg-card/60 backdrop-blur-sm overflow-hidden divide-y divide-border/30">
        {children}
      </div>
    </section>
  );
}
