import React from 'react';
import { ActiveTab } from '../../types/inventory';
import { useInventory } from '../../context/InventoryContext';
import {
  LayoutDashboard,
  Search,
  PackageCheck,
  ArrowLeftRight,
  BarChart3,
  Settings,
  Shirt,
  AlertTriangle,
  X,
} from 'lucide-react';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isOpenMobile: boolean;
  setIsOpenMobile: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpenMobile,
  setIsOpenMobile,
}) => {
  const { metrics, settings } = useInventory();

  const navItems: Array<{
    id: ActiveTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
    badgeColor?: string;
  }> = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'buscador', label: 'Buscar & Ficha', icon: Search },
    {
      id: 'inventario',
      label: 'Inventario',
      icon: PackageCheck,
      badge: metrics.totalVariants,
    },
    {
      id: 'movimientos',
      label: 'Movimientos',
      icon: ArrowLeftRight,
      badge: metrics.criticalAlerts.length > 0 ? metrics.criticalAlerts.length : undefined,
      badgeColor: 'bg-rose-100 text-rose-700',
    },
    { id: 'reportes', label: 'Reportes & Auditoría', icon: BarChart3 },
    { id: 'configuracion', label: 'Configuración', icon: Settings },
  ];

  const handleSelectTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    setIsOpenMobile(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={() => setIsOpenMobile(false)}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-200 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div>
          {/* Logo / Brand Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center shadow-xs">
                <Shirt className="w-5 h-5 text-rose-300" />
              </div>
              <div>
                <h1 className="text-sm font-bold tracking-tight text-slate-900 line-clamp-1">
                  {settings.storeName.split('—')[0].trim()}
                </h1>
                <p className="text-[11px] text-slate-500 font-medium">Control de Inventario</p>
              </div>
            </div>

            <button
              onClick={() => setIsOpenMobile(false)}
              className="p-1.5 text-slate-400 hover:text-slate-600 lg:hidden rounded-md"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-rose-300' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded-full ${
                        isActive
                          ? 'bg-slate-800 text-slate-300'
                          : item.badgeColor || 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Status / Summary Box */}
        <div className="p-4 border-t border-slate-100 m-3 bg-slate-50 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium text-slate-500">Resumen en Vivo</span>
            {metrics.criticalAlerts.length > 0 ? (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded">
                <AlertTriangle className="w-3 h-3 text-rose-600" />
                {metrics.criticalAlerts.length} alertas
              </span>
            ) : (
              <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
                Óptimo
              </span>
            )}
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-slate-600">
              <span>Unidades en stock:</span>
              <span className="font-mono font-bold text-slate-900">{metrics.totalUnits}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>Blusas activas:</span>
              <span className="font-mono font-bold text-slate-900">{metrics.totalActiveBlouses}</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
