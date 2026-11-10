import React from 'react';
import { useInventory } from '../../context/InventoryContext';
import {
  Printer,
  Download,
  AlertTriangle,
  Shirt,
  DollarSign,
  Package,
  TrendingDown,
  TrendingUp,
  FileCheck,
} from 'lucide-react';
import {
  calculateStockStatus,
  exportMovementsToCSV,
  exportVariantsToCSV,
  formatCurrency,
  formatDate,
  getColorHex,
} from '../../utils/stockUtils';

export const ReportsView: React.FC = () => {
  const { blouses, movements, settings, metrics } = useInventory();

  // Valuation calculation
  const totalValuation = blouses.reduce((total, blouse) => {
    return (
      total +
      blouse.variants.reduce((subTotal, v) => {
        const price = v.price || 0;
        return subTotal + v.currentStock * price;
      }, 0)
    );
  }, 0);

  // Top moving blouses by exits
  const topExitedBlouses = [...blouses]
    .map((b) => {
      const exits = b.variants.reduce((sum, v) => sum + (v.totalExits || 0), 0);
      const stock = b.variants.reduce((sum, v) => sum + v.currentStock, 0);
      return { ...b, exits, stock };
    })
    .sort((a, b) => b.exits - a.exits)
    .slice(0, 5);

  const handlePrint = () => {
    window.print();
  };

  const todayStr = new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'full',
    timeStyle: 'medium',
  }).format(new Date());

  return (
    <div className="space-y-6">
      {/* Action Header - Hidden on Print */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900">Reportes de Auditoría e Inventario</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Genera documentos formales para control físico, valuación comercial y reposición de compras
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportVariantsToCSV(blouses)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Inventario CSV</span>
          </button>

          <button
            onClick={() => exportMovementsToCSV(movements)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Movimientos CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
          >
            <Printer className="w-4 h-4 text-rose-300" />
            <span>Imprimir / PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Sheet Wrapper */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-8 max-w-5xl mx-auto space-y-8 print:border-none print:shadow-none print:p-0">
        {/* Printable Header */}
        <div className="border-b border-slate-200 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Shirt className="w-6 h-6 text-slate-900" />
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                {settings.storeName}
              </h1>
            </div>
            <p className="text-xs text-slate-500">
              Informe Oficial de Existencias y Auditoría de Inventario de Blusas
            </p>
          </div>

          <div className="text-left sm:text-right text-xs text-slate-500 space-y-0.5">
            <p>
              Fecha de emisión: <strong className="text-slate-800">{todayStr}</strong>
            </p>
            <p>
              Responsable en turno: <strong className="text-slate-800">{settings.responsibles[0]}</strong>
            </p>
            <p className="font-mono text-[11px]">Reporte ID: AUD-{Date.now().toString().slice(-6)}</p>
          </div>
        </div>

        {/* Executive Summary Figures */}
        <div>
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
            1. Resumen Ejecutivo de Inventario
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[11px] text-slate-500 font-medium block">Unidades en Físico</span>
              <span className="text-2xl font-mono font-bold text-slate-900">{metrics.totalUnits}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                en {metrics.totalVariants} variantes
              </span>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[11px] text-slate-500 font-medium block">Valuación Comercial Est.</span>
              <span className="text-2xl font-mono font-bold text-slate-900">
                {formatCurrency(totalValuation, settings.currencySymbol)}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">a precio de lista</span>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[11px] text-slate-500 font-medium block">Variantes con Alerta</span>
              <span className="text-2xl font-mono font-bold text-amber-700">
                {metrics.lowStockVariants + metrics.outOfStockVariants}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                {metrics.outOfStockVariants} agotadas · {metrics.lowStockVariants} stock bajo
              </span>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[11px] text-slate-500 font-medium block">Razón Entradas / Salidas</span>
              <span className="text-2xl font-mono font-bold text-slate-900">
                {metrics.totalEntries} / {metrics.totalExits}
              </span>
              <span className="text-[10px] text-emerald-700 block mt-0.5 font-medium">
                Balance: +{metrics.totalEntries - metrics.totalExits} un.
              </span>
            </div>
          </div>
        </div>

        {/* Priority Restock / Purchase Recommendation List */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                2. Lista de Reposición Urgente (Stock Bajo o Agotado)
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              {metrics.criticalAlerts.length} variantes identificadas
            </span>
          </div>

          {metrics.criticalAlerts.length > 0 ? (
            <div className="border border-slate-200 rounded-lg overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2.5">Código & Blusa</th>
                    <th className="px-3 py-2.5">Variante (Color & Talla)</th>
                    <th className="px-3 py-2.5">SKU</th>
                    <th className="px-3 py-2.5 text-right">Stock Actual</th>
                    <th className="px-3 py-2.5 text-right">Stock Mínimo</th>
                    <th className="px-3 py-2.5 text-right">Sugerencia Compra</th>
                    <th className="px-3 py-2.5 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {metrics.criticalAlerts.map(({ blouse, variant, status }) => {
                    const deficit = Math.max(0, variant.minStock * 2 - variant.currentStock);
                    return (
                      <tr key={variant.id} className="hover:bg-slate-50/50">
                        <td className="px-3 py-2.5 font-sans">
                          <span className="font-bold text-slate-900">{blouse.name}</span>
                          <span className="text-[11px] text-slate-500 block font-mono">
                            {blouse.code}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 font-sans font-medium text-slate-800">
                          {variant.color} · Talla {variant.size}
                        </td>
                        <td className="px-3 py-2.5 text-[11px] text-slate-500">{variant.sku}</td>
                        <td className="px-3 py-2.5 text-right font-bold text-slate-900">
                          {variant.currentStock} un.
                        </td>
                        <td className="px-3 py-2.5 text-right text-slate-500">{variant.minStock} un.</td>
                        <td className="px-3 py-2.5 text-right font-bold text-emerald-700 font-sans">
                          +{deficit} un.
                        </td>
                        <td className="px-3 py-2.5 text-center font-sans">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              status === 'AGOTADO'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {status === 'AGOTADO' ? 'Agotado' : 'Stock Bajo'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-4 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-medium border border-emerald-200">
              Excelente: Todas las variantes cuentan con inventario por encima de sus umbrales mínimos.
            </div>
          )}
        </div>

        {/* Most demanded styles */}
        <div>
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
            3. Modelos con Mayor Demanda y Rotación
          </h3>
          <div className="border border-slate-200 rounded-lg overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2.5">Código</th>
                  <th className="px-3 py-2.5">Modelo de Blusa</th>
                  <th className="px-3 py-2.5">Categoría</th>
                  <th className="px-3 py-2.5 text-right">Salidas Totales</th>
                  <th className="px-3 py-2.5 text-right">Stock Remanente</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {topExitedBlouses.map((b) => (
                  <tr key={b.id}>
                    <td className="px-3 py-2.5 font-bold text-slate-900">{b.code}</td>
                    <td className="px-3 py-2.5 font-sans font-medium text-slate-800">{b.name}</td>
                    <td className="px-3 py-2.5 font-sans text-slate-500">{b.category}</td>
                    <td className="px-3 py-2.5 text-right font-bold text-rose-700">-{b.exits} un.</td>
                    <td className="px-3 py-2.5 text-right font-bold text-slate-900">{b.stock} un.</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Signatures Block for Official Audit Reports */}
        <div className="pt-8 border-t border-slate-200 grid grid-cols-2 gap-8 text-center text-xs text-slate-500">
          <div>
            <div className="w-48 border-b border-slate-400 mx-auto mb-2 mt-8" />
            <p className="font-semibold text-slate-800">Mariana López</p>
            <p className="text-[11px]">Encargada de Almacén e Inventario</p>
          </div>
          <div>
            <div className="w-48 border-b border-slate-400 mx-auto mb-2 mt-8" />
            <p className="font-semibold text-slate-800">Sofía Herrera</p>
            <p className="text-[11px]">Administración y Auditoría</p>
          </div>
        </div>
      </div>
    </div>
  );
};
