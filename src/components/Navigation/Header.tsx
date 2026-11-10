import React, { useState, useRef, useEffect } from 'react';
import { ActiveTab, Blouse } from '../../types/inventory';
import { useInventory } from '../../context/InventoryContext';
import {
  Menu,
  Search,
  Plus,
  ArrowLeftRight,
  Shirt,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import { calculateStockStatus } from '../../utils/stockUtils';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenNewBlouse: () => void;
  onOpenQuickMovement: () => void;
  onSelectBlouseForDetail: (blouseId: string) => void;
  setIsOpenMobile: (open: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewBlouse,
  onOpenQuickMovement,
  onSelectBlouseForDetail,
  setIsOpenMobile,
}) => {
  const { blouses, settings } = useInventory();
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchResults: Blouse[] = searchQuery.trim()
    ? blouses.filter((b) => {
        const query = searchQuery.toLowerCase().trim();
        const codeMatch = b.code.toLowerCase().includes(query);
        const nameMatch = b.name.toLowerCase().includes(query);
        const categoryMatch = (b.category || '').toLowerCase().includes(query);
        const skuMatch = b.variants.some((v) => v.sku.toLowerCase().includes(query));
        return codeMatch || nameMatch || categoryMatch || skuMatch;
      })
    : [];

  const handleSelectSearchResult = (blouseId: string) => {
    onSelectBlouseForDetail(blouseId);
    setActiveTab('buscador');
    setShowResults(false);
    setSearchQuery('');
  };

  const getBreadcrumbTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Panel de Control & Métricas';
      case 'buscador':
        return 'Búsqueda & Ficha de Blusa';
      case 'inventario':
        return 'Gestión de Inventario & Variantes';
      case 'movimientos':
        return 'Registro & Historial de Movimientos';
      case 'reportes':
        return 'Reportes de Auditoría & Impresión';
      case 'configuracion':
        return 'Configuración del Sistema';
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 sm:px-6 py-3">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile hamburger & Context breadcrumb */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsOpenMobile(true)}
            className="p-2 text-slate-500 hover:text-slate-800 lg:hidden rounded-lg hover:bg-slate-100"
            aria-label="Abrir menú"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <span className="hidden sm:inline text-xs text-slate-400 font-medium">
              {settings.storeName.split('—')[0].trim()} /
            </span>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight whitespace-nowrap">
              {getBreadcrumbTitle()}
            </h2>
          </div>
        </div>

        {/* Center: Global Fast Search Bar with dropdown */}
        <div ref={searchContainerRef} className="relative flex-1 max-w-md hidden md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowResults(true);
              }}
              onFocus={() => setShowResults(true)}
              placeholder="Buscar blusa por código (BLU-...), nombre o SKU..."
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all"
            />
          </div>

          {/* Autocomplete Dropdown */}
          {showResults && searchQuery.trim() && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50 max-h-80 overflow-y-auto">
              <div className="p-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <span>Resultados de búsqueda ({searchResults.length})</span>
                <span className="text-[10px] lowercase font-normal">clic para ver ficha</span>
              </div>

              {searchResults.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {searchResults.map((blouse) => {
                    const totalUnits = blouse.variants.reduce((acc, v) => acc + v.currentStock, 0);
                    const hasOutOfStock = blouse.variants.some((v) => v.currentStock === 0);
                    const hasLowStock = blouse.variants.some(
                      (v) => calculateStockStatus(v.currentStock, v.minStock) === 'STOCK_BAJO'
                    );

                    return (
                      <button
                        key={blouse.id}
                        onClick={() => handleSelectSearchResult(blouse.id)}
                        className="w-full text-left p-3 hover:bg-slate-50 flex items-center justify-between transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 font-mono text-xs font-bold">
                            <Shirt className="w-4 h-4 text-slate-500" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-xs text-slate-900">
                                {blouse.code}
                              </span>
                              <span className="text-xs text-slate-700 font-medium">
                                {blouse.name}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                              <span>{blouse.category}</span>
                              <span>·</span>
                              <span>{blouse.colors.length} colores</span>
                              <span>·</span>
                              <span>{blouse.sizes.length} tallas</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-xs font-mono font-bold text-slate-900">
                            {totalUnits} un.
                          </div>
                          <div className="flex items-center justify-end gap-1 text-[10px]">
                            {hasOutOfStock ? (
                              <span className="text-rose-600 font-medium flex items-center gap-0.5">
                                <XCircle className="w-3 h-3" /> Con agotados
                              </span>
                            ) : hasLowStock ? (
                              <span className="text-amber-600 font-medium flex items-center gap-0.5">
                                <AlertTriangle className="w-3 h-3" /> Stock bajo
                              </span>
                            ) : (
                              <span className="text-emerald-700 font-medium flex items-center gap-0.5">
                                <CheckCircle2 className="w-3 h-3" /> En stock
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 text-center text-xs text-slate-500">
                  No se encontraron blusas con el término &quot;{searchQuery}&quot;.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Quick Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenQuickMovement}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap"
            title="Registrar entrada, salida o ajuste"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">Nuevo Movimiento</span>
            <span className="sm:hidden">Movimiento</span>
          </button>

          <button
            onClick={onOpenNewBlouse}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs whitespace-nowrap"
          >
            <Plus className="w-4 h-4 text-rose-300" />
            <span className="hidden sm:inline">Nueva Blusa</span>
            <span className="sm:hidden">Blusa</span>
          </button>
        </div>
      </div>
    </header>
  );
};
