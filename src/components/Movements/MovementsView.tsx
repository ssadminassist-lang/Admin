import React, { useState, useMemo } from 'react';
import { MovementType, StockMovement } from '../../types/inventory';
import { useInventory } from '../../context/InventoryContext';
import {
  ArrowLeftRight,
  ArrowDownRight,
  ArrowUpRight,
  RotateCcw,
  Search,
  Download,
  Filter,
  CheckCircle2,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  User,
  Calendar,
  X,
} from 'lucide-react';
import { exportMovementsToCSV, formatDate, getColorHex } from '../../utils/stockUtils';

export const MovementsView: React.FC = () => {
  const { movements, blouses, settings, registerMovement } = useInventory();

  const [activeSubTab, setActiveSubTab] = useState<'historial' | 'registrar'>('historial');

  // Registration Form State
  const [formType, setFormType] = useState<MovementType>('ENTRADA');
  const [formBlouseId, setFormBlouseId] = useState<string>(blouses[0]?.id || '');
  const [formVariantId, setFormVariantId] = useState<string>('');
  const [formQuantity, setFormQuantity] = useState<number | ''>(1);
  const [formReason, setFormReason] = useState<string>('');
  const [formResponsible, setFormResponsible] = useState<string>(settings.responsibles[0] || '');
  const [formNote, setFormNote] = useState<string>('');
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  // Filters State for History
  const [filterSearch, setFilterSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterResponsible, setFilterResponsible] = useState<string>('ALL');
  const [filterPeriod, setFilterPeriod] = useState<'ALL' | 'TODAY' | 'WEEK' | 'MONTH'>('ALL');

  // Selected blouse & variant for form
  const currentBlouse = blouses.find((b) => b.id === formBlouseId);

  // Sync variant id
  React.useEffect(() => {
    if (currentBlouse && currentBlouse.variants.length > 0) {
      if (!currentBlouse.variants.some((v) => v.id === formVariantId)) {
        setFormVariantId(currentBlouse.variants[0].id);
      }
    }
  }, [currentBlouse, formVariantId]);

  // Set default reason based on type
  React.useEffect(() => {
    if (formType === 'ENTRADA') {
      setFormReason(settings.entryReasons[0] || 'Compra a fabricante');
    } else if (formType === 'SALIDA') {
      setFormReason(settings.exitReasons[0] || 'Venta en tienda física');
    } else {
      setFormReason(settings.adjustmentReasons[0] || 'Conteo físico');
    }
  }, [formType, settings]);

  const currentVariant = currentBlouse?.variants.find((v) => v.id === formVariantId);
  const currentStock = currentVariant?.currentStock ?? 0;
  const numQty = typeof formQuantity === 'number' ? formQuantity : 0;

  let projectedStock = currentStock;
  if (formType === 'ENTRADA') projectedStock = currentStock + numQty;
  else if (formType === 'SALIDA') projectedStock = currentStock - numQty;
  else if (formType === 'AJUSTE') projectedStock = numQty;

  const isInsufficient = formType === 'SALIDA' && numQty > currentStock;

  // Handle Form Submit
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBlouse || !currentVariant) {
      setFeedback({ type: 'error', text: 'Selecciona una blusa y variante válidas.' });
      return;
    }
    if (numQty <= 0) {
      setFeedback({ type: 'error', text: 'La cantidad debe ser mayor a cero.' });
      return;
    }
    if (isInsufficient) {
      setFeedback({
        type: 'error',
        text: `Inventario insuficiente: deseas dar salida a ${numQty} prendas, pero solo hay ${currentStock} disponibles.`,
      });
      return;
    }

    const res = registerMovement({
      type: formType,
      blouseId: currentBlouse.id,
      variantId: currentVariant.id,
      quantity: numQty,
      reason: formReason,
      responsible: formResponsible,
      note: formNote,
    });

    if (res.success) {
      setFeedback({ type: 'success', text: res.message });
      setFormQuantity(1);
      setFormNote('');
      setTimeout(() => {
        setFeedback(null);
        setActiveSubTab('historial');
      }, 1200);
    } else {
      setFeedback({ type: 'error', text: res.message });
    }
  };

  // Filter Movements History
  const filteredMovements = useMemo(() => {
    const now = new Date().getTime();
    return movements.filter((m) => {
      // Search term
      if (filterSearch.trim()) {
        const term = filterSearch.toLowerCase().trim();
        const codeMatch = m.blouseCode.toLowerCase().includes(term);
        const nameMatch = m.blouseName.toLowerCase().includes(term);
        const skuMatch = m.sku.toLowerCase().includes(term);
        const reasonMatch = (m.reason || '').toLowerCase().includes(term);
        const userMatch = (m.responsible || '').toLowerCase().includes(term);
        if (!codeMatch && !nameMatch && !skuMatch && !reasonMatch && !userMatch) return false;
      }

      // Type filter
      if (filterType !== 'ALL' && m.type !== filterType) {
        return false;
      }

      // Responsible filter
      if (filterResponsible !== 'ALL' && m.responsible !== filterResponsible) {
        return false;
      }

      // Period filter
      if (filterPeriod !== 'ALL') {
        const movTime = new Date(m.timestamp).getTime();
        const diffMs = now - movTime;
        if (filterPeriod === 'TODAY' && diffMs > 86400000) return false;
        if (filterPeriod === 'WEEK' && diffMs > 7 * 86400000) return false;
        if (filterPeriod === 'MONTH' && diffMs > 30 * 86400000) return false;
      }

      return true;
    });
  }, [movements, filterSearch, filterType, filterResponsible, filterPeriod]);

  // Aggregate stats of filtered movements
  const totalUnitsEntered = filteredMovements
    .filter((m) => m.type === 'ENTRADA')
    .reduce((sum, m) => sum + m.quantity, 0);

  const totalUnitsExited = filteredMovements
    .filter((m) => m.type === 'SALIDA')
    .reduce((sum, m) => sum + m.quantity, 0);

  return (
    <div className="space-y-6">
      {/* Top Header & Sub-Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Control de Entradas, Salidas y Ajustes</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Registro detallado e historial cronológico con motivos y responsables
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Sub-tab pills */}
          <div className="flex items-center p-1 bg-slate-100 rounded-lg text-xs font-medium">
            <button
              onClick={() => setActiveSubTab('historial')}
              className={`px-3.5 py-1.5 rounded-md transition-colors ${
                activeSubTab === 'historial'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Historial de Movimientos ({movements.length})
            </button>
            <button
              onClick={() => setActiveSubTab('registrar')}
              className={`px-3.5 py-1.5 rounded-md transition-colors ${
                activeSubTab === 'registrar'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              + Registrar Movimiento
            </button>
          </div>

          {activeSubTab === 'historial' && (
            <button
              onClick={() => exportMovementsToCSV(filteredMovements)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium transition-colors"
              title="Descargar historial filtrado en formato CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Exportar CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* SUBTAB 1: HISTORIAL COMPLETO */}
      {activeSubTab === 'historial' && (
        <div className="space-y-4">
          {/* Summary Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-emerald-50/60 border border-emerald-200/80 p-4 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-emerald-800 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-600" /> Entradas en Período
                </span>
                <span className="text-[11px] text-emerald-700/80 mt-0.5 block">
                  Mercancía ingresada a almacén
                </span>
              </div>
              <span className="text-2xl font-mono font-bold text-emerald-800">
                +{totalUnitsEntered} un.
              </span>
            </div>

            <div className="bg-rose-50/60 border border-rose-200/80 p-4 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-rose-800 flex items-center gap-1.5">
                  <TrendingDown className="w-4 h-4 text-rose-600" /> Salidas en Período
                </span>
                <span className="text-[11px] text-rose-700/80 mt-0.5 block">
                  Ventas y mermas despachadas
                </span>
              </div>
              <span className="text-2xl font-mono font-bold text-rose-800">
                -{totalUnitsExited} un.
              </span>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                  <ArrowLeftRight className="w-4 h-4 text-slate-600" /> Balance Neto
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5 block">
                  Diferencia entradas vs salidas
                </span>
              </div>
              <span
                className={`text-2xl font-mono font-bold ${
                  totalUnitsEntered - totalUnitsExited >= 0 ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                {totalUnitsEntered - totalUnitsExited >= 0 ? '+' : ''}
                {totalUnitsEntered - totalUnitsExited} un.
              </span>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              {/* Search */}
              <div className="relative min-w-[220px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={filterSearch}
                  onChange={(e) => setFilterSearch(e.target.value)}
                  placeholder="Buscar por blusa, SKU, motivo o usuario..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              {/* Type Filter */}
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="ALL">Todos los Tipos</option>
                <option value="ENTRADA">Entradas</option>
                <option value="SALIDA">Salidas</option>
                <option value="AJUSTE">Ajustes</option>
              </select>

              {/* Period Filter */}
              <select
                value={filterPeriod}
                onChange={(e) => setFilterPeriod(e.target.value as any)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="ALL">Cualquier Fecha</option>
                <option value="TODAY">Hoy (Últimas 24h)</option>
                <option value="WEEK">Últimos 7 días</option>
                <option value="MONTH">Últimos 30 días</option>
              </select>

              {/* Responsible Filter */}
              <select
                value={filterResponsible}
                onChange={(e) => setFilterResponsible(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="ALL">Todos los Responsables</option>
                {settings.responsibles.map((resp) => (
                  <option key={resp} value={resp}>
                    {resp}
                  </option>
                ))}
              </select>
            </div>

            {(filterSearch || filterType !== 'ALL' || filterResponsible !== 'ALL' || filterPeriod !== 'ALL') && (
              <button
                onClick={() => {
                  setFilterSearch('');
                  setFilterType('ALL');
                  setFilterResponsible('ALL');
                  setFilterPeriod('ALL');
                }}
                className="text-xs text-rose-600 hover:text-rose-800 font-medium flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                <span>Restablecer filtros</span>
              </button>
            )}
          </div>

          {/* Movements Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            {filteredMovements.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Fecha y Hora</th>
                      <th className="px-4 py-3">Tipo</th>
                      <th className="px-4 py-3">Blusa / Modelo</th>
                      <th className="px-4 py-3">Variante</th>
                      <th className="px-4 py-3">SKU</th>
                      <th className="px-4 py-3 text-right">Cantidad</th>
                      <th className="px-4 py-3 text-right">Stock (Ant &rarr; Nuevo)</th>
                      <th className="px-4 py-3">Motivo</th>
                      <th className="px-4 py-3">Responsable</th>
                      <th className="px-4 py-3">Observaciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredMovements.map((mov) => {
                      const isEntry = mov.type === 'ENTRADA';
                      const isExit = mov.type === 'SALIDA';

                      return (
                        <tr key={mov.id} className="hover:bg-slate-50/70">
                          <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                            {formatDate(mov.timestamp)}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
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
                              ) : (
                                <RotateCcw className="w-3 h-3 text-blue-600" />
                              )}
                              {mov.type}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-semibold text-slate-900 block">{mov.blouseName}</span>
                            <span className="text-[11px] text-slate-500 font-mono">{mov.blouseCode}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5 font-medium text-slate-800">
                              <span
                                className="w-3 h-3 rounded-full border border-slate-300 shrink-0"
                                style={{ backgroundColor: getColorHex(mov.color) }}
                              />
                              <span>{mov.color}</span>
                              <span className="text-slate-400">·</span>
                              <span className="font-bold text-slate-900">{mov.size}</span>
                            </div>
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
                            <span className="font-bold text-slate-900">{mov.newStock} un.</span>
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
              <div className="p-12 text-center text-xs text-slate-500">
                No hay movimientos registrados que coincidan con los filtros aplicados.
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 2: REGISTRAR ENTRADA / SALIDA / AJUSTE */}
      {activeSubTab === 'registrar' && (
        <div className="max-w-2xl mx-auto bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50">
            <h3 className="text-sm font-bold text-slate-900">Formulario de Registro de Movimiento</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Actualiza las existencias de forma inmediata aplicando reglas de validación
            </p>
          </div>

          <form onSubmit={handleRegisterSubmit} className="p-6 space-y-5">
            {feedback && (
              <div
                className={`p-3 rounded-lg text-xs font-medium flex items-center gap-2 ${
                  feedback.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {feedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                )}
                <span>{feedback.text}</span>
              </div>
            )}

            {/* Movement Type Toggle */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Tipo de Operación *
              </label>
              <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => setFormType('ENTRADA')}
                  className={`flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-md transition-colors ${
                    formType === 'ENTRADA'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ArrowDownRight className="w-4 h-4" />
                  <span>Entrada</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormType('SALIDA')}
                  className={`flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-md transition-colors ${
                    formType === 'SALIDA'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ArrowUpRight className="w-4 h-4" />
                  <span>Salida</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormType('AJUSTE')}
                  className={`flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-md transition-colors ${
                    formType === 'AJUSTE'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Ajuste</span>
                </button>
              </div>
            </div>

            {/* Blouse Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Blusa / Modelo *</label>
              <select
                value={formBlouseId}
                onChange={(e) => setFormBlouseId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                {blouses.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.code} — {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Variant Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Variante (Color y Talla) *
              </label>
              {currentBlouse && currentBlouse.variants.length > 0 ? (
                <select
                  value={formVariantId}
                  onChange={(e) => setFormVariantId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  {currentBlouse.variants.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.color} / Talla {v.size} — Stock disponible: {v.currentStock} un. (SKU: {v.sku})
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-xs text-rose-600">Este modelo no tiene variantes configuradas.</p>
              )}
            </div>

            {/* Stock live calculation box */}
            {currentVariant && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className="w-4 h-4 rounded-full border border-slate-300 shrink-0"
                    style={{ backgroundColor: getColorHex(currentVariant.color) }}
                  />
                  <div>
                    <span className="font-semibold text-slate-800">
                      {currentVariant.color} · Talla {currentVariant.size}
                    </span>
                    <span className="text-[11px] text-slate-400 block font-mono">{currentVariant.sku}</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-slate-500">
                    Stock actual: <span className="font-mono font-bold text-slate-800">{currentStock}</span>
                  </div>
                  <div className="font-medium text-slate-700">
                    Proyección:{' '}
                    <span
                      className={`font-mono font-bold ${
                        isInsufficient
                          ? 'text-rose-600'
                          : projectedStock <= currentVariant.minStock
                          ? 'text-amber-600'
                          : 'text-emerald-700'
                      }`}
                    >
                      {projectedStock} un.
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Validation warning */}
            {isInsufficient && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>
                  <strong>Atención:</strong> La salida ({numQty} prendas) no puede superar el stock
                  disponible ({currentStock} prendas).
                </span>
              </div>
            )}

            {/* Quantity */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {formType === 'AJUSTE' ? 'Nuevo Stock Ajustado' : 'Cantidad de Unidades'} *
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={formQuantity}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : parseInt(e.target.value, 10);
                    setFormQuantity(val);
                  }}
                  className="w-32 px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                  required
                />
                <div className="flex items-center gap-1">
                  {[1, 5, 10, 25].map((step) => (
                    <button
                      key={step}
                      type="button"
                      onClick={() => setFormQuantity(step)}
                      className="px-2.5 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors"
                    >
                      +{step}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Reason & Responsible */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Motivo *</label>
                <select
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  {(formType === 'ENTRADA'
                    ? settings.entryReasons
                    : formType === 'SALIDA'
                    ? settings.exitReasons
                    : settings.adjustmentReasons
                  ).map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Usuario o Responsable *
                </label>
                <select
                  value={formResponsible}
                  onChange={(e) => setFormResponsible(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  {settings.responsibles.map((resp) => (
                    <option key={resp} value={resp}>
                      {resp}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Note */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nota u Observaciones <span className="text-slate-400 font-normal">(Opcional)</span>
              </label>
              <input
                type="text"
                placeholder="Número de ticket, remisión, cliente, condición..."
                value={formNote}
                onChange={(e) => setFormNote(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            {/* Buttons */}
            <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveSubTab('historial')}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
              >
                Volver al Historial
              </button>
              <button
                type="submit"
                disabled={isInsufficient || numQty <= 0}
                className={`px-6 py-2 text-xs font-semibold text-white rounded-lg transition-colors shadow-xs ${
                  isInsufficient || numQty <= 0
                    ? 'bg-slate-400 cursor-not-allowed'
                    : formType === 'ENTRADA'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : formType === 'SALIDA'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                Guardar {formType === 'ENTRADA' ? 'Entrada' : formType === 'SALIDA' ? 'Salida' : 'Ajuste'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
