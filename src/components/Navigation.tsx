import React from 'react';
import { 
  LayoutDashboard, 
  ListFilter, 
  AlertTriangle, 
  Terminal, 
  ShieldBan, 
  Sliders, 
  Crosshair 
} from 'lucide-react';

export type TabKey = 'overview' | 'logs' | 'alerts' | 'simulator' | 'blocklist' | 'sql' | 'rules';

interface NavigationProps {
  activeTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  activeAlertsCount: number;
  blockedCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onSelectTab,
  activeAlertsCount,
  blockedCount
}) => {
  const navItems: { key: TabKey; label: string; icon: React.ComponentType<{ className?: string }>; badge?: number }[] = [
    { key: 'overview', label: 'Overview', icon: LayoutDashboard },
    { key: 'logs', label: 'Activity Logs', icon: ListFilter },
    { key: 'alerts', label: 'Threat Alerts', icon: AlertTriangle, badge: activeAlertsCount },
    { key: 'simulator', label: 'Attack Simulator', icon: Crosshair },
    { key: 'blocklist', label: 'IP Blocklist', icon: ShieldBan, badge: blockedCount },
    { key: 'sql', label: 'SQLite Console', icon: Terminal },
    { key: 'rules', label: 'Detection Rules', icon: Sliders }
  ];

  return (
    <nav className="border-b border-slate-800 bg-slate-900/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-1 sm:space-x-4 overflow-x-auto py-2 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => onSelectTab(item.key)}
                className={`flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  isActive
                    ? 'border-cyan-400 text-cyan-300 bg-slate-800/40'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`ml-1 font-mono text-[11px] ${
                      item.key === 'alerts'
                        ? 'text-rose-400 font-bold'
                        : 'text-slate-400'
                    }`}
                  >
                    ({item.badge})
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
