import React, { useState } from 'react';
import { Blouse, BlouseVariant } from '../../types/inventory';
import { useInventory } from '../../context/InventoryContext';
import {
  Search,
  Shirt,
  Layers,
  ArrowDownRight,
  ArrowUpRight,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Plus,
  Minus,
  Grid3X3,
  List,
  History,
  Tag,
  Clock,
} from 'lucide-react';
import {
  calculateStockStatus,
  formatDate,
  getColorHex,
  getStockStatusLabel,
  getStockStatusStyle,
} from '../../utils/stockUtils';

interface BlouseProfileViewProps {
  selectedBlouseId: string | null;
  onSelectBlouse: (id: string) => void;
  onEditBlouse: (blouse: Blouse) => void;
  onQuickMovement: (blouse: Blouse, variant: BlouseVariant, defaultType?: 'ENTRADA' | 'SALIDA') => void;
  onOpenNewBlouse: () => void;
}

export const BlouseProfileView: React.FC<BlouseProfileViewProps> = ({
  selectedBlouseId,
  onSelectBlouse,
  onEditBlouse,
  onQuickMovement,
  onOpenNewBlouse,
}) => {
  const { blouses, movements, deleteBlouse, toggleBlouseActive } = useInventory();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeProfileTab, setActiveProfileTab] = useState<'matriz' | 'tabla' | 'historial'>('matriz');

  // Filtered blouses for the picker
  const filteredBlouses = blouses.filter((b) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return (
      b.code.toLowerCase().includes(term) ||
      b.name.toLowerCase().includes(term) ||
      (b.category || '').toLowerCase().includes(term) ||
      b.variants.some((v) => v.sku.toLowerCase().includes(term))
    );
  });

  // Current selected blouse (fallback to first filtered if none selected or valid)
  const currentBlouse =
    blouses.find((b) => b.id === selectedBlouseId) ||
    (filteredBlouses.length > 0 ? filteredBlouses[0] : null);

  // Movements for this blouse
  const blouseMovements = currentBlouse
    ? movements.filter((m) => m.blouseId === currentBlouse.id)
    : [];

  const handleDelete = () => {
    if (!currentBlouse) return;
    if (
      window.confirm(
        `¿Confirmas que deseas eliminar la blusa "${currentBlouse.name}" (${currentBlouse.code}) y todas sus variantes?`
      )
    ) {
      deleteBlouse(currentBlouse.id);
      if (filteredBlouses.length > 1) {
        const next = filteredBlouses.find((b) => b.id !== currentBlouse.id);
        if (next) onSelectBlouse(next.id);
      }
    }
  };

  if (blouses.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center max-w-xl mx-auto my-8">
        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
          <Shirt className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900">No hay blusas registradas en el catálogo</h3>
        <p className="text-xs text-slate-500 mt-1 mb-6">
          Comienza agregando tu primera blusa para gestionar colores, tallas, variantes y movimientos.
        </p>
        <button
          onClick={onOpenNewBlouse}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Primera Blusa</span>
        </button>
      </div>
    );
  }

  // Blouse metrics
  const totalStock = currentBlouse
    ? currentBlouse.variants.reduce((acc, v) => acc + v.currentStock, 0)
    : 0;
  const totalEntries = currentBlouse
    ? currentBlouse.variants.reduce((acc, v) => acc + (v.totalEntries || 0), 0)
    : 0;
  const totalExits = currentBlouse
    ? currentBlouse.variants.reduce((acc, v) => acc + (v.totalExits || 0), 0)
    : 0;
  const outOfStockCount = currentBlouse
    ? currentBlouse.variants.filter((v) => v.currentStock === 0).length
    : 0;
  const lowStockCount = currentBlouse
    ? currentBlouse.variants.filter((v) => calculateStockStatus(v.currentStock, v.minStock) === 'STOCK_BAJO')
        .length
    : 0;

  return (
    <div className="space-y-6">
      {/* 1. Main Search Bar & Quick Selector */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Escribe código exacto (BLU-001) o nombre de la blusa..."
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                Limpiar
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenNewBlouse}
              className="flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs whitespace-nowrap"
            >
              <Plus className="w-4 h-4 text-rose-300" />
              <span>Nueva Blusa</span>
            </button>
          </div>
        </div>

        {/* Quick selector chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
            Catálogo ({filteredBlouses.length}):
          </span>
          {filteredBlouses.map((b) => {
            const isSelected = currentBlouse?.id === b.id;
            return (
              <button
                key={b.id}
                onClick={() => onSelectBlouse(b.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="font-mono font-bold">{b.code}</span>
                <span className="truncate max-w-[140px]">{b.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {currentBlouse && (
        <>
          {/* 2. Detailed Blouse Profile Card (Ficha Completa) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            {/* Top Header */}
            <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/40">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Shirt className="w-6 h-6 text-rose-300" />
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-slate-200/80 text-slate-900 font-mono text-xs font-bold">
                      {currentBlouse.code}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">·</span>
                    <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {currentBlouse.category || 'General'}
                    </span>
                    <button
                      onClick={() => toggleBlouseActive(currentBlouse.id)}
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border transition-colors ${
                        currentBlouse.active
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}
                      title="Haz clic para activar o desactivar blusa"
                    >
                      {currentBlouse.active ? 'Activa en catálogo' : 'Inactiva'}
                    </button>
                  </div>

                  <h2 className="text-lg font-bold text-slate-900 mt-1">{currentBlouse.name}</h2>

                  {currentBlouse.description && (
                    <p className="text-xs text-slate-500 mt-1 max-w-2xl">{currentBlouse.description}</p>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 self-start md:self-auto">
                <button
                  onClick={() => onEditBlouse(currentBlouse)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Editar Ficha</span>
                </button>
                <button
                  onClick={handleDelete}
                  className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-rose-200"
                  title="Eliminar blusa"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Middle Stats Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 border-b border-slate-100 bg-white">
              <div className="p-4 text-center sm:text-left">
                <span className="text-[11px] text-slate-500 font-medium block">Stock Total Actual</span>
                <span className="text-2xl font-bold font-mono text-slate-900">{totalStock}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">unidades en almacén</span>
              </div>

              <div className="p-4 text-center sm:text-left">
                <span className="text-[11px] text-slate-500 font-medium block">Variantes Activas</span>
                <span className="text-2xl font-bold font-mono text-slate-900">
                  {currentBlouse.variants.length}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {currentBlouse.colors.length} colores × {currentBlouse.sizes.length} tallas
                </span>
              </div>

              <div className="p-4 text-center sm:text-left">
                <span className="text-[11px] text-slate-500 font-medium block">Entradas Acumuladas</span>
                <span className="text-2xl font-bold font-mono text-emerald-700">+{totalEntries}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">unidades ingresadas</span>
              </div>

              <div className="p-4 text-center sm:text-left">
                <span className="text-[11px] text-slate-500 font-medium block">Salidas / Ventas</span>
                <span className="text-2xl font-bold font-mono text-rose-700">-{totalExits}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">unidades despachadas</span>
              </div>
            </div>

            {/* Colors and Sizes Tags */}
            <div className="p-5 border-b border-slate-100 bg-slate-50/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
              <div className="space-y-1">
                <span className="font-semibold text-slate-700 block">Colores Disponibles:</span>
                <div className="flex flex-wrap gap-2">
                  {currentBlouse.colors.map((color) => (
                    <span
                      key={color}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-md text-slate-800 text-xs font-medium shadow-2xs"
                    >
                      <span
                        className="w-3 h-3 rounded-full border border-slate-300 shrink-0"
                        style={{ backgroundColor: getColorHex(color) }}
                      />
                      {color}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-slate-700 block">Tallas Disponibles:</span>
                <div className="flex flex-wrap gap-1.5">
                  {currentBlouse.sizes.map((size) => (
                    <span
                      key={size}
                      className="px-2.5 py-1 bg-white border border-slate-200 rounded-md text-slate-900 text-xs font-bold shadow-2xs"
                    >
                      {size}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* View Sub-Tabs (Matriz, Tabla, Historial) */}
            <div className="px-6 pt-4 border-b border-slate-200 flex items-center justify-between gap-4">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setActiveProfileTab('matriz')}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
                    activeProfileTab === 'matriz'
                      ? 'border-slate-900 text-slate-900'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Grid3X3 className="w-4 h-4" />
                  <span>Matriz Color × Talla</span>
                </button>

                <button
                  onClick={() => setActiveProfileTab('tabla')}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
                    activeProfileTab === 'tabla'
                      ? 'border-slate-900 text-slate-900'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <List className="w-4 h-4" />
                  <span>Listado de Variantes ({currentBlouse.variants.length})</span>
                </button>

                <button
                  onClick={() => setActiveProfileTab('historial')}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
                    activeProfileTab === 'historial'
                      ? 'border-slate-900 text-slate-900'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <History className="w-4 h-4" />
                  <span>Historial de Movimientos ({blouseMovements.length})</span>
                </button>
              </div>

              {/* Status breakdown indicators */}
              <div className="hidden lg:flex items-center gap-3 text-xs">
                {outOfStockCount > 0 && (
                  <span className="text-rose-700 font-medium flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5" />
                    {outOfStockCount} agotada(s)
                  </span>
                )}
                {lowStockCount > 0 && (
                  <span className="text-amber-700 font-medium flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {lowStockCount} stock bajo
                  </span>
                )}
              </div>
            </div>

            {/* TAB CONTENT 1: MATRIZ COLOR X TALLA */}
            {activeProfileTab === 'matriz' && (
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <p>
                    Visualiza las existencias cruzando color y talla. Haz clic en cualquier celda para
                    registrar una entrada o salida rápida.
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span>En stock</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      <span>Stock bajo (&le; mín)</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                      <span>Agotado (0)</span>
                    </span>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 min-w-[140px]">Color \ Talla</th>
                        {currentBlouse.sizes.map((size) => (
                          <th key={size} className="px-4 py-3 text-center min-w-[90px] font-bold">
                            Talla {size}
                          </th>
                        ))}
                        <th className="px-4 py-3 text-right font-bold text-slate-900">Total Color</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {currentBlouse.colors.map((color) => {
                        let rowStockTotal = 0;
                        return (
                          <tr key={color} className="hover:bg-slate-50/50">
                            <td className="px-4 py-3 font-medium text-slate-900 flex items-center gap-2">
                              <span
                                className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0"
                                style={{ backgroundColor: getColorHex(color) }}
                              />
                              <span>{color}</span>
                            </td>

                            {currentBlouse.sizes.map((size) => {
                              const variant = currentBlouse.variants.find(
                                (v) =>
                                  v.color.trim().toLowerCase() === color.trim().toLowerCase() &&
                                  v.size.trim().toLowerCase() === size.trim().toLowerCase()
                              );

                              if (!variant) {
                                return (
                                  <td key={size} className="px-4 py-3 text-center text-slate-300">
                                    —
                                  </td>
                                );
                              }

                              rowStockTotal += variant.currentStock;
                              const status = calculateStockStatus(variant.currentStock, variant.minStock);
                              const styles = getStockStatusStyle(status);

                              return (
                                <td key={size} className="px-3 py-2 text-center">
                                  <button
                                    onClick={() => onQuickMovement(currentBlouse, variant)}
                                    className={`w-full py-2 px-2.5 rounded-lg border transition-all text-center flex flex-col items-center justify-center hover:scale-102 hover:shadow-xs ${styles.badge}`}
                                    title={`Clic para mover inventario de ${color} - Talla ${size} (SKU: ${variant.sku})`}
                                  >
                                    <span className="font-mono font-bold text-sm">
                                      {variant.currentStock}
                                    </span>
                                    <span className="text-[10px] opacity-80 uppercase tracking-tighter">
                                      {status === 'AGOTADO'
                                        ? 'Agotado'
                                        : status === 'STOCK_BAJO'
                                        ? `Bajo (${variant.minStock})`
                                        : 'En stock'}
                                    </span>
                                  </button>
                                </td>
                              );
                            })}

                            <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 text-sm">
                              {rowStockTotal} un.
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-slate-50 text-slate-800 font-bold border-t border-slate-200">
                      <tr>
                        <td className="px-4 py-3 font-semibold">Total por Talla</td>
                        {currentBlouse.sizes.map((size) => {
                          const colTotal = currentBlouse.variants
                            .filter((v) => v.size.trim().toLowerCase() === size.trim().toLowerCase())
                            .reduce((sum, v) => sum + v.currentStock, 0);
                          return (
                            <td key={size} className="px-4 py-3 text-center font-mono text-sm">
                              {colTotal} un.
                            </td>
                          );
                        })}
                        <td className="px-4 py-3 text-right font-mono text-sm text-slate-900">
                          {totalStock} un.
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* TAB CONTENT 2: TABLA DE VARIANTES */}
            {activeProfileTab === 'tabla' && (
              <div className="p-6">
                <div className="border border-slate-200 rounded-xl overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3">SKU</th>
                        <th className="px-4 py-3">Color</th>
                        <th className="px-4 py-3">Talla</th>
                        <th className="px-4 py-3 text-right">Stock Actual</th>
                        <th className="px-4 py-3 text-right">Stock Mínimo</th>
                        <th className="px-4 py-3 text-center">Estado</th>
                        <th className="px-4 py-3 text-right">Entradas</th>
                        <th className="px-4 py-3 text-right">Salidas</th>
                        <th className="px-4 py-3 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {currentBlouse.variants.map((v) => {
                        const status = calculateStockStatus(v.currentStock, v.minStock);
                        const styles = getStockStatusStyle(status);

                        return (
                          <tr key={v.id} className="hover:bg-slate-50/70">
                            <td className="px-4 py-3 font-bold text-slate-900">{v.sku}</td>
                            <td className="px-4 py-3 font-sans font-medium text-slate-800 flex items-center gap-1.5">
                              <span
                                className="w-3 h-3 rounded-full border border-slate-300 inline-block shrink-0"
                                style={{ backgroundColor: getColorHex(v.color) }}
                              />
                              {v.color}
                            </td>
                            <td className="px-4 py-3 font-sans font-bold text-slate-900">{v.size}</td>
                            <td className="px-4 py-3 text-right font-bold text-slate-900 text-sm">
                              {v.currentStock}
                            </td>
                            <td className="px-4 py-3 text-right text-slate-500">{v.minStock}</td>
                            <td className="px-4 py-3 text-center font-sans">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${styles.badge}`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${styles.dot}`} />
                                {getStockStatusLabel(status)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right text-emerald-700 font-semibold">
                              +{v.totalEntries}
                            </td>
                            <td className="px-4 py-3 text-right text-rose-700 font-semibold">
                              -{v.totalExits}
                            </td>
                            <td className="px-4 py-3 text-right font-sans">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => onQuickMovement(currentBlouse, v, 'ENTRADA')}
                                  className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-md transition-colors"
                                  title="Registrar entrada de inventario"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => onQuickMovement(currentBlouse, v, 'SALIDA')}
                                  className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-md transition-colors"
                                  title="Registrar salida de inventario"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB CONTENT 3: HISTORIAL DE ESTA BLUSA */}
            {activeProfileTab === 'historial' && (
              <div className="p-6">
                {blouseMovements.length > 0 ? (
                  <div className="border border-slate-200 rounded-xl overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-3">Fecha y Hora</th>
                          <th className="px-4 py-3">Tipo</th>
                          <th className="px-4 py-3">Variante</th>
                          <th className="px-4 py-3">SKU</th>
                          <th className="px-4 py-3 text-right">Cantidad</th>
                          <th className="px-4 py-3 text-right">Stock Anterior &rarr; Nuevo</th>
                          <th className="px-4 py-3">Motivo</th>
                          <th className="px-4 py-3">Responsable</th>
                          <th className="px-4 py-3">Notas</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {blouseMovements.map((mov) => {
                          const isEntry = mov.type === 'ENTRADA';
                          const isExit = mov.type === 'SALIDA';

                          return (
                            <tr key={mov.id} className="hover:bg-slate-50/70">
                              <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                                {formatDate(mov.timestamp)}
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                                    isEntry
                                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                      : isExit
                                      ? 'bg-rose-50 text-rose-800 border border-rose-200'
                                      : 'bg-blue-50 text-blue-800 border border-blue-200'
                                  }`}
                                >
                                  {isEntry ? (
                                    <ArrowDownRight className="w-3 h-3 text-emerald-600" />
                                  ) : isExit ? (
                                    <ArrowUpRight className="w-3 h-3 text-rose-600" />
                                  ) : null}
                                  {mov.type}
                                </span>
                              </td>
                              <td className="px-4 py-3 font-medium text-slate-800">
                                {mov.color} · Talla {mov.size}
                              </td>
                              <td className="px-4 py-3 font-mono text-[11px] text-slate-500">{mov.sku}</td>
                              <td className="px-4 py-3 text-right font-mono font-bold text-sm">
                                <span
                                  className={
                                    isEntry
                                      ? 'text-emerald-700'
                                      : isExit
                                      ? 'text-rose-700'
                                      : 'text-blue-700'
                                  }
                                >
                                  {isEntry ? `+${mov.quantity}` : isExit ? `-${mov.quantity}` : mov.quantity}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right font-mono text-slate-500">
                                {mov.previousStock} &rarr;{' '}
                                <span className="font-bold text-slate-900">{mov.newStock}</span>
                              </td>
                              <td className="px-4 py-3 text-slate-700">{mov.reason}</td>
                              <td className="px-4 py-3 text-slate-600">{mov.responsible}</td>
                              <td className="px-4 py-3 text-slate-400 italic max-w-xs truncate">
                                {mov.note || '—'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-xs">No hay movimientos registrados para este modelo todavía.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
