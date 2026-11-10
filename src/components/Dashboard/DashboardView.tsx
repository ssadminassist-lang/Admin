import React from 'react';
import { useInventory } from '../../context/InventoryContext';
import { ActiveTab, Blouse, BlouseVariant } from '../../types/inventory';
import {
  Shirt,
  Layers,
  Package,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  ArrowRight,
  Plus,
} from 'lucide-react';
import { formatDate, getColorHex, getStockStatusStyle } from '../../utils/stockUtils';

interface DashboardViewProps {
  setActiveTab: (tab: ActiveTab) => void;
  onSelectBlouseForDetail: (blouseId: string) => void;
  onQuickMovementForVariant: (blouse: Blouse, variant: BlouseVariant) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  setActiveTab,
  onSelectBlouseForDetail,
  onQuickMovementForVariant,
}) => {
  const { metrics, movements, blouses } = useInventory();

  // Find most frequent colors and sizes
  const sortedColors = Object.entries(metrics.stockByColor).sort((a, b) => b[1] - a[1]);
  const sortedSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
    .map((sz) => [sz, metrics.stockBySize[sz] || 0] as [string, number])
    .filter(([_, count]) => count > 0 || Object.keys(metrics.stockBySize).includes(_));

  const maxColorUnits = Math.max(...sortedColors.map(([_, count]) => count), 1);
  const maxSizeUnits = Math.max(...sortedSizes.map(([_, count]) => count), 1);

  return (
    <div className="space-y-6">
      {/* Top Banner KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Blusas */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Modelos de Blusa</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <Shirt className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
              {metrics.totalBlouses}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              {metrics.totalActiveBlouses} activas
            </span>
          </div>
        </div>

        {/* Total Variantes (Color x Talla) */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Variantes (SKUs)</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
              {metrics.totalVariants}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">combinaciones</span>
          </div>
        </div>

        {/* Total Unidades en Stock */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Unidades en Stock</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
              {metrics.totalUnits}
            </span>
            <span className="text-[11px] text-emerald-700 font-medium">disponibles hoy</span>
          </div>
        </div>

        {/* Flujo Entradas vs Salidas */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Movimientos Históricos</span>
            <div className="flex items-center gap-1 text-[11px] font-mono">
              <span className="text-emerald-700 flex items-center">
                <TrendingUp className="w-3 h-3 mr-0.5" />
                {metrics.totalEntries}
              </span>
              <span>/</span>
              <span className="text-rose-700 flex items-center">
                <TrendingDown className="w-3 h-3 mr-0.5" />
                {metrics.totalExits}
              </span>
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
              {movements.length}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">registros</span>
          </div>
        </div>
      </div>

      {/* Stock Health Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* En Stock */}
        <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-emerald-800 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Variantes En Stock</span>
            </div>
            <p className="text-xs text-emerald-700/80 mt-0.5">Stock superior al umbral mínimo</p>
          </div>
          <span className="text-2xl font-mono font-bold text-emerald-800">
            {metrics.inStockVariants}
          </span>
        </div>

        {/* Stock Bajo */}
        <div className="bg-amber-50/60 border border-amber-200/90 rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-amber-800 text-xs font-semibold">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Variantes en Stock Bajo</span>
            </div>
            <p className="text-xs text-amber-700/80 mt-0.5">Próximas a agotarse (menor o igual al mín.)</p>
          </div>
          <span className="text-2xl font-mono font-bold text-amber-800">
            {metrics.lowStockVariants}
          </span>
        </div>

        {/* Agotado */}
        <div className="bg-rose-50/60 border border-rose-200/90 rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-rose-800 text-xs font-semibold">
              <XCircle className="w-4 h-4 text-rose-600" />
              <span>Variantes Agotadas</span>
            </div>
            <p className="text-xs text-rose-700/80 mt-0.5">Sin inventario físico (stock = 0)</p>
          </div>
          <span className="text-2xl font-mono font-bold text-rose-800">
            {metrics.outOfStockVariants}
          </span>
        </div>
      </div>

      {/* Critical Stock Attention Panel */}
      {metrics.criticalAlerts.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Alerta de Inventario Crítico ({metrics.criticalAlerts.length} variantes por reabastecer)
              </h3>
            </div>
            <button
              onClick={() => setActiveTab('inventario')}
              className="text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1 transition-colors"
            >
              <span>Ver todas en inventario</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Blusa</th>
                  <th className="px-4 py-3">Variante</th>
                  <th className="px-4 py-3">SKU</th>
                  <th className="px-4 py-3 text-right">Stock Actual</th>
                  <th className="px-4 py-3 text-right">Stock Mínimo</th>
                  <th className="px-4 py-3 text-center">Estado</th>
                  <th className="px-4 py-3 text-right">Acción Rápida</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {metrics.criticalAlerts.slice(0, 6).map(({ blouse, variant, status }) => {
                  const styles = getStockStatusStyle(status);
                  return (
                    <tr key={variant.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3">
                        <button
                          onClick={() => {
                            onSelectBlouseForDetail(blouse.id);
                            setActiveTab('buscador');
                          }}
                          className="text-left group"
                        >
                          <div className="font-semibold text-slate-900 group-hover:underline">
                            {blouse.name}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">{blouse.code}</div>
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0"
                            style={{ backgroundColor: getColorHex(variant.color) }}
                          />
                          <span className="font-medium text-slate-800">{variant.color}</span>
                          <span className="text-slate-400">·</span>
                          <span className="font-bold text-slate-900">Talla {variant.size}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-500">{variant.sku}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                        {variant.currentStock} un.
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-500">
                        {variant.minStock} un.
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${styles.badge}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${styles.dot}`} />
                          {status === 'AGOTADO' ? 'Agotado' : 'Stock bajo'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => onQuickMovementForVariant(blouse, variant)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md shadow-2xs transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Reabastecer</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Distribution: Units by Color & Units by Size */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Units by Color */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Distribución de Stock por Color
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Prendas disponibles por tonalidad</p>
            </div>
            <span className="text-xs font-mono font-semibold text-slate-700">
              {sortedColors.length} colores
            </span>
          </div>

          <div className="space-y-3">
            {sortedColors.slice(0, 8).map(([colorName, count]) => {
              const percentage = Math.round((count / maxColorUnits) * 100);
              const hex = getColorHex(colorName);
              return (
                <div key={colorName} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0 shadow-2xs"
                        style={{ backgroundColor: hex }}
                      />
                      <span className="font-medium text-slate-800">{colorName}</span>
                    </div>
                    <span className="font-mono font-semibold text-slate-900">{count} unidades</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.max(percentage, 4)}%`,
                        backgroundColor: hex === '#FFFFFF' ? '#94A3B8' : hex,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Units by Size */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Distribución de Stock por Talla
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Curva de tallas en almacén</p>
            </div>
            <span className="text-xs font-mono font-semibold text-slate-700">
              {metrics.totalUnits} un. total
            </span>
          </div>

          <div className="space-y-3">
            {sortedSizes.map(([sizeName, count]) => {
              const percentage = Math.round((count / maxSizeUnits) * 100);
              return (
                <div key={sizeName} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-6 py-0.5 rounded bg-slate-100 text-slate-800 font-bold text-center text-[11px]">
                        {sizeName}
                      </span>
                      <span className="text-slate-600">Talla {sizeName}</span>
                    </div>
                    <span className="font-mono font-semibold text-slate-900">{count} unidades</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-slate-800 h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.max(percentage, 3)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Movements Feed */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Últimos Movimientos Registrados
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Auditoría en tiempo real de entradas y salidas</p>
          </div>
          <button
            onClick={() => setActiveTab('movimientos')}
            className="text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1 transition-colors"
          >
            <span>Ver historial completo</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {movements.slice(0, 5).map((mov) => {
            const isEntry = mov.type === 'ENTRADA';
            const isExit = mov.type === 'SALIDA';
            return (
              <div
                key={mov.id}
                className="p-4 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                      isEntry
                        ? 'bg-emerald-50 text-emerald-700'
                        : isExit
                        ? 'bg-rose-50 text-rose-700'
                        : 'bg-blue-50 text-blue-700'
                    }`}
                  >
                    {isEntry ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : isExit ? (
                      <TrendingDown className="w-4 h-4" />
                    ) : (
                      <Package className="w-4 h-4" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900">{mov.blouseName}</span>
                      <span className="font-mono text-slate-500 font-medium">({mov.blouseCode})</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 flex flex-wrap items-center gap-2">
                      <span className="font-medium text-slate-700">
                        {mov.color} · Talla {mov.size}
                      </span>
                      <span>·</span>
                      <span>Motivo: {mov.reason}</span>
                      <span>·</span>
                      <span>Por: {mov.responsible}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pl-11 sm:pl-0">
                  <div className="text-right">
                    <span
                      className={`font-mono font-bold text-sm ${
                        isEntry ? 'text-emerald-700' : isExit ? 'text-rose-700' : 'text-blue-700'
                      }`}
                    >
                      {isEntry ? `+${mov.quantity}` : isExit ? `-${mov.quantity}` : mov.quantity} un.
                    </span>
                    <span className="block text-[10px] text-slate-400 font-mono">
                      Stock: {mov.previousStock} → {mov.newStock}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 whitespace-nowrap">
                    {formatDate(mov.timestamp)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
