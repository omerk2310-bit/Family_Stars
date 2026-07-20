import type { CSSProperties, ReactNode } from "react";
import { ArrowRight, Settings } from "lucide-react";
import "./AppShell.css";

interface AppShellProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  onSettings?: () => void;
  accent?: string;
  children: ReactNode;
}

export function AppShell({ title, subtitle, onBack, onSettings, accent, children }: AppShellProps) {
  return (
    <div className="app-shell" style={accent ? ({ "--child-accent": accent } as CSSProperties) : undefined}>
      <header className="app-shell__header">
        <div className="app-shell__header-start">
          {onBack && (
            <button type="button" className="app-shell__icon-btn" onClick={onBack} aria-label="חזרה">
              <ArrowRight size={20} />
            </button>
          )}
        </div>
        <div className="app-shell__header-title">
          <h1>{title}</h1>
          {subtitle && <p className="app-shell__subtitle">{subtitle}</p>}
        </div>
        <div className="app-shell__header-end">
          {onSettings && (
            <button type="button" className="app-shell__icon-btn" onClick={onSettings} aria-label="הגדרות">
              <Settings size={20} />
            </button>
          )}
        </div>
      </header>
      <main className="app-shell__main">{children}</main>
    </div>
  );
}
