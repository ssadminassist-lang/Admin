import React, { useState, useEffect } from 'react';
import { Blouse, BlouseVariant, MovementType } from '../../types/inventory';
import { useInventory } from '../../context/InventoryContext';
import { ArrowDownRight, ArrowUpRight, RotateCcw, X, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { getColorHex } from '../../utils/stockUtils';

interface QuickMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  blouse?: Blouse;
  variant?: BlouseVariant;
  defaultType?: MovementType;
}

export const QuickMovementModal: React.FC<QuickMovementModalProps> = ({
  isOpen,
  onClose,
  blouse: initialBlouse,
  variant: initialVariant,
  defaultType = 'ENTRADA',
}) => {
  const { blouses, settings, registerMovement } = useInventory();

  const [selectedBlouseId, setSelectedBlouseId] = useState<string>(initialBlouse?.id || '');
  const [selectedVariantId, setSelectedVariantId] = useState<string>(initialVariant?.id || '');
  const [type, setType] = useState<MovementType>(defaultType);
  const [quantity, setQuantity] = useState<number | ''>(1);
  const [reason, setReason] = useState<string>('');
  const [responsible, setResponsible] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  useEffect(() => {
    if (initialBlouse) setSelectedBlouseId(initialBlouse.id);
    if (initialVariant) setSelectedVariantId(initialVariant.id);
    setType(defaultType);
    setQuantity(1);
    setFeedback(null);
  }, [initialBlouse, initialVariant, defaultType, isOpen]);

  // If initial blouse wasn't set, default to first available
  useEffect(() => {
    if (!selectedBlouseId && blouses.length > 0) {
      setSelectedBlouseId(blouses[0].id);
    }
  }, [blouses, selectedBlouseId]);

  const currentBlouse = blouses.find((b) => b.id === selectedBlouseId);

  // If current variant is not in selected blouse, default to first variant
  useEffect(() => {
    if (currentBlouse && currentBlouse.variants.length > 0) {
      const exists = currentBlouse.variants.some((v) => v.id === selectedVariantId);
      if (!exists) {
        setSelectedVariantId(currentBlouse.variants[0].id);
      }
    }
  }, [currentBlouse, selectedVariantId]);

  const currentVariant = currentBlouse?.variants.find((v) => v.id === selectedVariantId);

  // Set default reason & responsible
  useEffect(() => {
    if (type === 'ENTRADA') {
      setReason(settings.entryReasons[0] || 'Compra de proveedor');
    } else if (type === 'SALIDA') {
      setReason(settings.exitReasons[0] || 'Venta en tienda física');
    } else {
      setReason(settings.adjustmentReasons[0] || 'Conteo físico');
    }
    if (!responsible && settings.responsibles.length > 0) {
      setResponsible(settings.responsibles[0]);
    }
  }, [type, settings]);

  if (!isOpen) return null;

  const currentStock = currentVariant?.currentStock ?? 0;
  const numQty = typeof quantity === 'number' ? quantity : 0;
  
  let projectedStock = currentStock;
  if (type === 'ENTRADA') projectedStock = currentStock + numQty;
  else if (type === 'SALIDA') projectedStock = currentStock - numQty;
  else if (type === 'AJUSTE') projectedStock = numQty;

  const isInsufficient = type === 'SALIDA' && numQty > currentStock;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBlouse || !currentVariant) {
      setFeedback({ type: 'error', text: 'Por favor selecciona una blusa y variante.' });
      return;
    }
    if (numQty <= 0) {
      setFeedback({ type: 'error', text: 'La cantidad debe ser mayor a 0.' });
      return;
    }
    if (isInsufficient) {
      setFeedback({
        type: 'error',
        text: `No es posible registrar salida de ${numQty} prendas. Solo hay ${currentStock} disponibles en inventario.`,
      });
      return;
    }

    const res = registerMovement({
      type,
      blouseId: currentBlouse.id,
      variantId: currentVariant.id,
      quantity: numQty,
      reason,
      responsible: responsible || 'Administrador',
      note,
    });

    if (res.success) {
      setFeedback({ type: 'success', text: res.message });
      setTimeout(() => {
        onClose();
      }, 1100);
    } else {
      setFeedback({ type: 'error', text: res.message });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Registrar Movimiento de Inventario</h3>
            <p className="text-xs text-slate-500 mt-0.5">Control de entradas, salidas y ajustes de stock</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
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

          {/* Movement Type Segmented Control */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">Tipo de Movimiento</label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-lg">
              <button
                type="button"
                onClick={() => setType('ENTRADA')}
                className={`flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-md transition-colors ${
                  type === 'ENTRADA'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ArrowDownRight className="w-4 h-4" />
                <span>Entrada</span>
              </button>
              <button
                type="button"
                onClick={() => setType('SALIDA')}
                className={`flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-md transition-colors ${
                  type === 'SALIDA'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>Salida</span>
              </button>
              <button
                type="button"
                onClick={() => setType('AJUSTE')}
                className={`flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-md transition-colors ${
                  type === 'AJUSTE'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <RotateCcw className="w-4 h-4" />
                <span>Ajuste</span>
              </button>
            </div>
          </div>

          {/* Blouse Selector */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Blusa</label>
            <select
              value={selectedBlouseId}
              onChange={(e) => {
                setSelectedBlouseId(e.target.value);
              }}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
            >
              {blouses.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.code} — {b.name} ({b.variants.length} variantes)
                </option>
              ))}
            </select>
          </div>

          {/* Variant Selector (Color + Size) */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Variante (Color y Talla)
            </label>
            {currentBlouse && currentBlouse.variants.length > 0 ? (
              <select
                value={selectedVariantId}
                onChange={(e) => setSelectedVariantId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
              >
                {currentBlouse.variants.map((v) => (
                  <option key={v.id} value={v.id}>
                    Color: {v.color} | Talla: {v.size} — Stock actual: {v.currentStock} un. (SKU: {v.sku})
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-xs text-rose-600">Esta blusa no tiene variantes configuradas.</p>
            )}
          </div>

          {/* Current Stock vs Projected Stock Card */}
          {currentVariant && (
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span
                  className="w-4 h-4 rounded-full border border-slate-300 shrink-0"
                  style={{ backgroundColor: getColorHex(currentVariant.color) }}
                />
                <div>
                  <span className="font-semibold text-slate-800">
                    {currentVariant.color} / Talla {currentVariant.size}
                  </span>
                  <span className="text-slate-500 block font-mono text-[11px]">{currentVariant.sku}</span>
                </div>
              </div>

              <div className="text-right">
                <div className="text-slate-500">
                  Stock actual: <span className="font-mono font-bold text-slate-800">{currentStock}</span>
                </div>
                <div className="font-medium text-slate-700">
                  Nuevo stock:{' '}
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

          {/* Insufficient Stock Warning */}
          {isInsufficient && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>
                <strong>Atención:</strong> La cantidad solicitada supera el stock disponible ({currentStock}{' '}
                unidades). Reduce la cantidad para continuar.
              </span>
            </div>
          )}

          {/* Quantity & Quick Buttons */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-slate-700">
                {type === 'AJUSTE' ? 'Nuevo Stock Total o Ajuste' : 'Cantidad a mover'}
              </label>
              <span className="text-[11px] text-slate-500">Unidades enteras</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                step="1"
                value={quantity}
                onChange={(e) => {
                  const val = e.target.value === '' ? '' : parseInt(e.target.value, 10);
                  setQuantity(val);
                }}
                className="w-32 px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                required
              />
              <div className="flex items-center gap-1">
                {[1, 5, 10, 20].map((step) => (
                  <button
                    key={step}
                    type="button"
                    onClick={() => setQuantity(step)}
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
              <label className="block text-xs font-medium text-slate-700 mb-1">Motivo</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                {(type === 'ENTRADA'
                  ? settings.entryReasons
                  : type === 'SALIDA'
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
              <label className="block text-xs font-medium text-slate-700 mb-1">Responsable</label>
              <select
                value={responsible}
                onChange={(e) => setResponsible(e.target.value)}
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

          {/* Optional Note */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Nota u Observación <span className="text-slate-400 font-normal">(Opcional)</span>
            </label>
            <input
              type="text"
              placeholder="Ej. Factura #5521, pedido cliente, lote nuevo..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isInsufficient || numQty <= 0}
              className={`px-5 py-2 text-xs font-medium text-white rounded-lg transition-colors shadow-xs ${
                isInsufficient || numQty <= 0
                  ? 'bg-slate-400 cursor-not-allowed'
                  : type === 'ENTRADA'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : type === 'SALIDA'
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              Registrar {type === 'ENTRADA' ? 'Entrada' : type === 'SALIDA' ? 'Salida' : 'Ajuste'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
