import React, { useState, useMemo } from 'react';
import { Blouse, BlouseVariant, StockStatus } from '../../types/inventory';
import { useInventory } from '../../context/InventoryContext';
import {
  Search,
  Filter,
  Download,
  Plus,
  Minus,
  Edit2,
  Trash2,
  Eye,
  ArrowUpDown,
  Shirt,
  XCircle,
  AlertTriangle,
  CheckCircle2,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import {
  calculateStockStatus,
  exportVariantsToCSV,
  getColorHex,
  getStockStatusLabel,
  getStockStatusStyle,
} from '../../utils/stockUtils';

interface InventoryListViewProps {
  onSelectBlouseForDetail: (id: string) => void;
  onEditBlouse: (blouse: Blouse) => void;
  onQuickMovement: (blouse: Blouse, variant: BlouseVariant, type?: 'ENTRADA' | 'SALIDA') => void;
  onOpenNewBlouse: () => void;
}

export const InventoryListView: React.FC<InventoryListViewProps> = ({
  onSelectBlouseForDetail,
  onEditBlouse,
  onQuickMovement,
  onOpenNewBlouse,
}) => {
  const { blouses, settings, deleteBlouse, toggleBlouseActive } = useInventory();

  // Mode: 'variants' (flat list of all skus) vs 'blouses' (card/table grouped by model)
  const [viewMode, setViewMode] = useState<'blouses' | 'variants'>('variants');

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedColor, setSelectedColor] = useState<string>('ALL');
  const [selectedSize, setSelectedSize] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'name' | 'code' | 'stock_asc' | 'stock_desc' | 'status'>('stock_asc');

  // Collect all unique colors & sizes present in dataset
  const allColors = useMemo(() => {
    const set = new Set<string>();
    blouses.forEach((b) => b.colors.forEach((c) => set.add(c)));
    return Array.from(set).sort();
  }, [blouses]);

  const allSizes = useMemo(() => {
    const set = new Set<string>();
    blouses.forEach((b) => b.sizes.forEach((s) => set.add(s)));
    return Array.from(set);
  }, [blouses]);

  // Flattened variants with blouse parent reference
  const flattenedVariants = useMemo(() => {
    const list: Array<{ blouse: Blouse; variant: BlouseVariant; status: StockStatus }> = [];
    blouses.forEach((blouse) => {
      blouse.variants.forEach((variant) => {
        const status = calculateStockStatus(variant.currentStock, variant.minStock);
        list.push({ blouse, variant, status });
      });
    });
    return list;
  }, [blouses]);

  // Filter flattened variants
  const filteredVariants = useMemo(() => {
    return flattenedVariants.filter(({ blouse, variant, status }) => {
      // Text search
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const matchesCode = blouse.code.toLowerCase().includes(term);
        const matchesName = blouse.name.toLowerCase().includes(term);
        const matchesSku = variant.sku.toLowerCase().includes(term);
        const matchesColor = variant.color.toLowerCase().includes(term);
        if (!matchesCode && !matchesName && !matchesSku && !matchesColor) return false;
      }

      // Category
      if (selectedCategory !== 'ALL' && blouse.category !== selectedCategory) {
        return false;
      }

      // Color
      if (selectedColor !== 'ALL' && variant.color !== selectedColor) {
        return false;
      }

      // Size
      if (selectedSize !== 'ALL' && variant.size !== selectedSize) {
        return false;
      }

      // Status
      if (selectedStatus !== 'ALL' && status !== selectedStatus) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'name') return a.blouse.name.localeCompare(b.blouse.name);
      if (sortBy === 'code') return a.blouse.code.localeCompare(b.blouse.code);
      if (sortBy === 'stock_asc') return a.variant.currentStock - b.variant.currentStock;
      if (sortBy === 'stock_desc') return b.variant.currentStock - a.variant.currentStock;
      if (sortBy === 'status') {
        const order = { AGOTADO: 0, STOCK_BAJO: 1, EN_STOCK: 2 };
        return order[a.status] - order[b.status];
      }
      return 0;
    });
  }, [flattenedVariants, searchTerm, selectedCategory, selectedColor, selectedSize, selectedStatus, sortBy]);

  // Filtered blouses for blouse view
  const filteredBlouses = useMemo(() => {
    return blouses.filter((blouse) => {
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const matchesCode = blouse.code.toLowerCase().includes(term);
        const matchesName = blouse.name.toLowerCase().includes(term);
        const matchesCat = (blouse.category || '').toLowerCase().includes(term);
        const matchesSku = blouse.variants.some((v) => v.sku.toLowerCase().includes(term));
        if (!matchesCode && !matchesName && !matchesCat && !matchesSku) return false;
      }

      if (selectedCategory !== 'ALL' && blouse.category !== selectedCategory) {
        return false;
      }

      if (selectedColor !== 'ALL' && !blouse.colors.includes(selectedColor)) {
        return false;
      }

      if (selectedSize !== 'ALL' && !blouse.sizes.includes(selectedSize)) {
        return false;
      }

      if (selectedStatus !== 'ALL') {
        const matchesAnyStatus = blouse.variants.some(
          (v) => calculateStockStatus(v.currentStock, v.minStock) === selectedStatus
        );
        if (!matchesAnyStatus) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'code') return a.code.localeCompare(b.code);
      const stockA = a.variants.reduce((acc, v) => acc + v.currentStock, 0);
      const stockB = b.variants.reduce((acc, v) => acc + v.currentStock, 0);
      if (sortBy === 'stock_asc') return stockA - stockB;
      if (sortBy === 'stock_desc') return stockB - stockA;
      return 0;
    });
  }, [blouses, searchTerm, selectedCategory, selectedColor, selectedSize, selectedStatus, sortBy]);

  const hasActiveFilters =
    searchTerm !== '' ||
    selectedCategory !== 'ALL' ||
    selectedColor !== 'ALL' ||
    selectedSize !== 'ALL' ||
    selectedStatus !== 'ALL';

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('ALL');
    setSelectedColor('ALL');
    setSelectedSize('ALL');
    setSelectedStatus('ALL');
    setSortBy('stock_asc');
  };

  return (
    <div className="space-y-5">
      {/* Top Header & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Inventario General de Blusas</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitoreo y administración completa de modelos, colores, tallas y existencias
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode Switcher */}
          <div className="flex items-center p-1 bg-slate-100 rounded-lg text-xs font-medium">
            <button
              onClick={() => setViewMode('variants')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                viewMode === 'variants'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Variantes ({flattenedVariants.length})
            </button>
            <button
              onClick={() => setViewMode('blouses')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                viewMode === 'blouses'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Por Modelo ({blouses.length})
            </button>
          </div>

          {/* Export to CSV */}
          <button
            onClick={() => exportVariantsToCSV(blouses)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium transition-colors"
            title="Exportar inventario a Excel / CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Exportar CSV</span>
          </button>

          {/* New blouse */}
          <button
            onClick={onOpenNewBlouse}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4 text-rose-300" />
            <span>Nueva Blusa</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por código, nombre o SKU..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          {/* Category */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="ALL">Todas las Categorías</option>
              {settings.categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="ALL">Todos los Estados</option>
              <option value="EN_STOCK">En stock</option>
              <option value="STOCK_BAJO">Stock bajo (&le; mín)</option>
              <option value="AGOTADO">Agotado (0 unidades)</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium text-slate-800"
            >
              <option value="stock_asc">Stock: Menor a Mayor</option>
              <option value="stock_desc">Stock: Mayor a Menor</option>
              <option value="status">Estado (Agotados primero)</option>
              <option value="name">Nombre: A - Z</option>
              <option value="code">Código: A - Z</option>
            </select>
          </div>
        </div>

        {/* Secondary filters row: Color & Size Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Color:
            </span>
            <button
              onClick={() => setSelectedColor('ALL')}
              className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                selectedColor === 'ALL'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todos
            </button>
            {allColors.map((color) => {
              const isSelected = selectedColor === color;
              return (
                <button
                  key={color}
                  onClick={() => setSelectedColor(isSelected ? 'ALL' : color)}
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs transition-colors border ${
                    isSelected
                      ? 'border-slate-900 bg-slate-900 text-white font-medium'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full border border-slate-300 shrink-0"
                    style={{ backgroundColor: getColorHex(color) }}
                  />
                  <span>{color}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Talla:
            </span>
            <button
              onClick={() => setSelectedSize('ALL')}
              className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                selectedSize === 'ALL'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todas
            </button>
            {allSizes.map((size) => {
              const isSelected = selectedSize === size;
              return (
                <button
                  key={size}
                  onClick={() => setSelectedSize(isSelected ? 'ALL' : size)}
                  className={`px-2 py-0.5 rounded text-xs font-bold transition-colors ${
                    isSelected
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {size}
                </button>
              );
            })}

            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-1 text-[11px] text-rose-600 hover:text-rose-800 font-medium ml-2 px-2 py-0.5 hover:bg-rose-50 rounded"
              >
                <X className="w-3 h-3" />
                <span>Limpiar filtros</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* VIEW 1: FLAT VARIANTS TABLE */}
      {viewMode === 'variants' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Mostrando {filteredVariants.length} variantes de blusas</span>
            <span className="font-mono">
              Total stock filtrado:{' '}
              <strong className="text-slate-900">
                {filteredVariants.reduce((sum, item) => sum + item.variant.currentStock, 0)}
              </strong>{' '}
              unidades
            </span>
          </div>

          {filteredVariants.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">SKU</th>
                    <th className="px-4 py-3">Blusa / Modelo</th>
                    <th className="px-4 py-3">Color</th>
                    <th className="px-4 py-3">Talla</th>
                    <th className="px-4 py-3 text-right">Stock Actual</th>
                    <th className="px-4 py-3 text-right">Stock Mínimo</th>
                    <th className="px-4 py-3 text-center">Estado</th>
                    <th className="px-4 py-3 text-right">Flujo (Ent/Sal)</th>
                    <th className="px-4 py-3 text-right">Acciones de Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {filteredVariants.map(({ blouse, variant, status }) => {
                    const styles = getStockStatusStyle(status);
                    return (
                      <tr key={variant.id} className="hover:bg-slate-50/70">
                        <td className="px-4 py-3 font-bold text-slate-900">{variant.sku}</td>
                        <td className="px-4 py-3 font-sans">
                          <button
                            onClick={() => onSelectBlouseForDetail(blouse.id)}
                            className="text-left group"
                          >
                            <span className="font-semibold text-slate-900 group-hover:underline block">
                              {blouse.name}
                            </span>
                            <span className="text-[11px] text-slate-500 font-mono">{blouse.code}</span>
                          </button>
                        </td>
                        <td className="px-4 py-3 font-sans font-medium text-slate-800 flex items-center gap-2">
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0"
                            style={{ backgroundColor: getColorHex(variant.color) }}
                          />
                          <span>{variant.color}</span>
                        </td>
                        <td className="px-4 py-3 font-sans font-bold text-slate-900">{variant.size}</td>
                        <td className="px-4 py-3 text-right font-bold text-slate-900 text-sm">
                          {variant.currentStock} un.
                        </td>
                        <td className="px-4 py-3 text-right text-slate-500">{variant.minStock} un.</td>
                        <td className="px-4 py-3 text-center font-sans">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${styles.badge}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${styles.dot}`} />
                            {getStockStatusLabel(status)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-slate-500 text-[11px]">
                          <span className="text-emerald-700 font-semibold">+{variant.totalEntries}</span> /{' '}
                          <span className="text-rose-700 font-semibold">-{variant.totalExits}</span>
                        </td>
                        <td className="px-4 py-3 text-right font-sans">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => onQuickMovement(blouse, variant, 'ENTRADA')}
                              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-medium rounded-md transition-colors flex items-center gap-0.5"
                              title="Registrar entrada de stock"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Entrada</span>
                            </button>
                            <button
                              onClick={() => onQuickMovement(blouse, variant, 'SALIDA')}
                              disabled={variant.currentStock <= 0}
                              className={`px-2 py-1 font-medium rounded-md transition-colors flex items-center gap-0.5 ${
                                variant.currentStock <= 0
                                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                  : 'bg-rose-50 hover:bg-rose-100 text-rose-700'
                              }`}
                              title={
                                variant.currentStock <= 0
                                  ? 'Sin stock para salida'
                                  : 'Registrar salida de stock'
                              }
                            >
                              <Minus className="w-3 h-3" />
                              <span>Salida</span>
                            </button>
                            <button
                              onClick={() => onSelectBlouseForDetail(blouse.id)}
                              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors ml-1"
                              title="Ver ficha completa"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-10 text-center text-xs text-slate-500">
              No hay variantes que coincidan con los filtros seleccionados.
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: GROUPED BY BLOUSE MODEL CARDS */}
      {viewMode === 'blouses' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredBlouses.map((blouse) => {
            const blouseStock = blouse.variants.reduce((acc, v) => acc + v.currentStock, 0);
            const outOfStock = blouse.variants.filter((v) => v.currentStock === 0).length;
            const lowStock = blouse.variants.filter(
              (v) => calculateStockStatus(v.currentStock, v.minStock) === 'STOCK_BAJO'
            ).length;

            return (
              <div
                key={blouse.id}
                className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between space-y-4 hover:border-slate-300 transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-slate-100 rounded font-mono text-xs font-bold text-slate-900">
                        {blouse.code}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">·</span>
                      <span className="text-xs text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                        {blouse.category || 'General'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEditBlouse(blouse)}
                        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Editar modelo"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`¿Eliminar la blusa ${blouse.name}?`)) {
                            deleteBlouse(blouse.id);
                          }
                        }}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Eliminar blusa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900">{blouse.name}</h3>
                  {blouse.description && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{blouse.description}</p>
                  )}
                </div>

                {/* Color swatches & sizes */}
                <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Colores:</span>
                    <div className="flex items-center gap-1.5">
                      {blouse.colors.map((c) => (
                        <span
                          key={c}
                          title={c}
                          className="w-4 h-4 rounded-full border border-slate-300 inline-block"
                          style={{ backgroundColor: getColorHex(c) }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Tallas:</span>
                    <span className="font-semibold text-slate-800">{blouse.sizes.join(' · ')}</span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-slate-500 font-medium">Stock Total:</span>
                    <span className="font-mono font-bold text-sm text-slate-900">
                      {blouseStock} unidades
                    </span>
                  </div>
                </div>

                {/* Status bar & Action */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[11px]">
                    {outOfStock > 0 ? (
                      <span className="text-rose-600 font-medium flex items-center gap-0.5">
                        <XCircle className="w-3.5 h-3.5" /> {outOfStock} agotada(s)
                      </span>
                    ) : lowStock > 0 ? (
                      <span className="text-amber-600 font-medium flex items-center gap-0.5">
                        <AlertTriangle className="w-3.5 h-3.5" /> {lowStock} bajo
                      </span>
                    ) : (
                      <span className="text-emerald-700 font-medium flex items-center gap-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Completo
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => onSelectBlouseForDetail(blouse.id)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    <span>Ver Ficha y Matriz</span>
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
