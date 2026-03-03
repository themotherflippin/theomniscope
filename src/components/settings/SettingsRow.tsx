import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface SettingsRowBase {
  icon: LucideIcon;
  label: string;
  subtitle?: string;
  trailing?: ReactNode;
}

interface NavigationRow extends SettingsRowBase {
  type: 'nav';
  onTap: () => void;
}

interface ToggleRow extends SettingsRowBase {
  type: 'toggle';
  checked: boolean;
  onToggle: (v: boolean) => void;
}

interface CustomRow extends SettingsRowBase {
  type: 'custom';
  onTap?: () => void;
}

type SettingsRowProps = NavigationRow | ToggleRow | CustomRow;

export function SettingsRow(props: SettingsRowProps) {
  const { icon: Icon, label, subtitle, trailing } = props;

  const isInteractive = props.type === 'nav' || props.type === 'custom';

  const content = (
    <div className="flex items-center gap-3 px-4 min-h-[48px] py-2.5">
      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/8">
        <Icon className="w-[18px] h-[18px] text-primary" strokeWidth={1.8} />
      </div>

      <div className="flex-1 min-w-0">
        <span className="text-[15px] font-medium text-foreground leading-tight">{label}</span>
        {subtitle && (
          <p className="text-[12px] text-muted-foreground leading-tight mt-0.5">{subtitle}</p>
        )}
      </div>

      {trailing}

      {props.type === 'toggle' && (
        <Switch
          checked={props.checked}
          onCheckedChange={props.onToggle}
          className="scale-90"
        />
      )}

      {props.type === 'nav' && (
        <ChevronRight className="w-4 h-4 text-muted-foreground/50 flex-shrink-0" />
      )}
    </div>
  );

  if (isInteractive && (props as any).onTap) {
    return (
      <motion.button
        className="w-full text-left transition-colors hover:bg-accent/40 active:bg-accent/60"
        whileTap={{ scale: 0.985 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        onClick={(props as any).onTap}
      >
        {content}
      </motion.button>
    );
  }

  return <div>{content}</div>;
}
