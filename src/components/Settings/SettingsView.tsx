import React, { useState, useRef } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { InventorySettings } from '../../types/inventory';
import {
  Save,
  Download,
  Upload,
  RotateCcw,
  Trash2,
  Plus,
  X,
  CheckCircle2,
  AlertTriangle,
  Database,
  Store,
  Layers,
  Users,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    resetToInitialData,
    clearAllData,
    exportJSONBackup,
    importJSONBackup,
  } = useInventory();

  const [formData, setFormData] = useState<InventorySettings>(settings);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form helpers for list items
  const [newEntryReason, setNewEntryReason] = useState('');
  const [newExitReason, setNewExitReason] = useState('');
  const [newAdjustmentReason, setNewAdjustmentReason] = useState('');
  const [newResponsible, setNewResponsible] = useState('');
  const [newCategory, setNewCategory] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
    setFeedback({ type: 'success', text: 'Configuraciones guardadas correctamente.' });
    setTimeout(() => setFeedback(null), 3000);
  };

  // Helper methods to modify lists
  const addToList = (
    key: 'entryReasons' | 'exitReasons' | 'adjustmentReasons' | 'responsibles' | 'categories',
    value: string,
    setter: (s: string) => void
  ) => {
    const clean = value.trim();
    if (!clean) return;
    if (!formData[key].includes(clean)) {
      setFormData((prev) => ({
        ...prev,
        [key]: [...prev[key], clean],
      }));
    }
    setter('');
  };

  const removeFromList = (
    key: 'entryReasons' | 'exitReasons' | 'adjustmentReasons' | 'responsibles' | 'categories',
    index: number
  ) => {
    setFormData((prev) => ({
      ...prev,
      [key]: prev[key].filter((_, i) => i !== index),
    }));
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = importJSONBackup(content);
      if (res.success) {
        setFeedback({ type: 'success', text: res.message });
      } else {
        setFeedback({ type: 'error', text: res.message });
      }
      setTimeout(() => setFeedback(null), 3500);
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = '';
  };

  const handleReset = () => {
    if (
      window.confirm(
        '¿Restablecer el inventario con los datos y movimientos de ejemplo iniciales? Los cambios no guardados se perderán.'
      )
    ) {
      resetToInitialData();
      setFeedback({ type: 'success', text: 'Datos de ejemplo restablecidos con éxito.' });
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const handleClear = () => {
    if (
      window.confirm(
        '¡PELIGRO! ¿Estás seguro de que deseas vaciar por completo todo el inventario de blusas y el historial de movimientos? Esta acción no se puede deshacer.'
      )
    ) {
      clearAllData();
      setFeedback({ type: 'success', text: 'Se ha vaciado todo el inventario.' });
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Title */}
      <div>
        <h2 className="text-base font-bold text-slate-900">Configuración y Personalización</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Adapta el nombre de la tienda, listas de motivos, responsables y copias de seguridad
        </p>
      </div>

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

      {/* Main Settings Form */}
      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Section 1: General Business Identity */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Store className="w-4 h-4 text-slate-700" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Identidad de la Tienda & Parámetros
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nombre de la Tienda / Negocio
              </label>
              <input
                type="text"
                value={formData.storeName}
                onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Símbolo de Moneda</label>
              <input
                type="text"
                value={formData.currencySymbol}
                onChange={(e) => setFormData({ ...formData, currencySymbol: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Stock Mínimo Predeterminado
              </label>
              <input
                type="number"
                min="0"
                value={formData.defaultMinStock}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    defaultMinStock: parseInt(e.target.value, 10) || 0,
                  })
                }
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono"
                required
              />
              <span className="text-[10px] text-slate-400">Umbral inicial para nuevas variantes</span>
            </div>
          </div>
        </div>

        {/* Section 2: Motivos de Entradas y Salidas */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Layers className="w-4 h-4 text-slate-700" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Motivos de Movimiento de Inventario
            </h3>
          </div>

          {/* Motivos de Entrada */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-800">
                Motivos de Entrada ({formData.entryReasons.length})
              </label>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {formData.entryReasons.map((reason, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md text-xs font-medium"
                >
                  <span>{reason}</span>
                  {formData.entryReasons.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeFromList('entryReasons', idx)}
                      className="hover:text-emerald-950"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2 max-w-md">
              <input
                type="text"
                placeholder="Agregar nuevo motivo de entrada..."
                value={newEntryReason}
                onChange={(e) => setNewEntryReason(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addToList('entryReasons', newEntryReason, setNewEntryReason);
                  }
                }}
                className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
              <button
                type="button"
                onClick={() => addToList('entryReasons', newEntryReason, setNewEntryReason)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-medium transition-colors"
              >
                Agregar
              </button>
            </div>
          </div>

          {/* Motivos de Salida */}
          <div className="space-y-2 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-800">
                Motivos de Salida ({formData.exitReasons.length})
              </label>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {formData.exitReasons.map((reason, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 text-rose-800 border border-rose-200 rounded-md text-xs font-medium"
                >
                  <span>{reason}</span>
                  {formData.exitReasons.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeFromList('exitReasons', idx)}
                      className="hover:text-rose-950"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2 max-w-md">
              <input
                type="text"
                placeholder="Agregar nuevo motivo de salida..."
                value={newExitReason}
                onChange={(e) => setNewExitReason(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addToList('exitReasons', newExitReason, setNewExitReason);
                  }
                }}
                className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
              <button
                type="button"
                onClick={() => addToList('exitReasons', newExitReason, setNewExitReason)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-medium transition-colors"
              >
                Agregar
              </button>
            </div>
          </div>

          {/* Motivos de Ajuste */}
          <div className="space-y-2 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-800">
                Motivos de Ajuste ({formData.adjustmentReasons.length})
              </label>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {formData.adjustmentReasons.map((reason, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-md text-xs font-medium"
                >
                  <span>{reason}</span>
                  {formData.adjustmentReasons.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeFromList('adjustmentReasons', idx)}
                      className="hover:text-blue-950"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2 max-w-md">
              <input
                type="text"
                placeholder="Agregar nuevo motivo de ajuste..."
                value={newAdjustmentReason}
                onChange={(e) => setNewAdjustmentReason(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addToList('adjustmentReasons', newAdjustmentReason, setNewAdjustmentReason);
                  }
                }}
                className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
              <button
                type="button"
                onClick={() => addToList('adjustmentReasons', newAdjustmentReason, setNewAdjustmentReason)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-medium transition-colors"
              >
                Agregar
              </button>
            </div>
          </div>
        </div>

        {/* Section 3: Usuarios Responsables & Categorías */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Users className="w-4 h-4 text-slate-700" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Responsables y Categorías de Blusas
            </h3>
          </div>

          {/* Responsables */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-800 block">
              Personal o Usuarios Responsables ({formData.responsibles.length})
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {formData.responsibles.map((user, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-800 border border-slate-200 rounded-md text-xs font-medium"
                >
                  <span>{user}</span>
                  {formData.responsibles.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeFromList('responsibles', idx)}
                      className="hover:text-slate-950"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2 max-w-md">
              <input
                type="text"
                placeholder="Nombre del responsable (ej. Almacén, Ventas)..."
                value={newResponsible}
                onChange={(e) => setNewResponsible(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addToList('responsibles', newResponsible, setNewResponsible);
                  }
                }}
                className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
              <button
                type="button"
                onClick={() => addToList('responsibles', newResponsible, setNewResponsible)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-medium transition-colors"
              >
                Agregar
              </button>
            </div>
          </div>

          {/* Categorías */}
          <div className="space-y-2 pt-4 border-t border-slate-100">
            <label className="text-xs font-semibold text-slate-800 block">
              Categorías de Blusas ({formData.categories.length})
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {formData.categories.map((cat, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-800 border border-slate-200 rounded-md text-xs font-medium"
                >
                  <span>{cat}</span>
                  {formData.categories.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeFromList('categories', idx)}
                      className="hover:text-slate-950"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2 max-w-md">
              <input
                type="text"
                placeholder="Nueva categoría (ej. Oficina, Playa)..."
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addToList('categories', newCategory, setNewCategory);
                  }
                }}
                className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
              <button
                type="button"
                onClick={() => addToList('categories', newCategory, setNewCategory)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-medium transition-colors"
              >
                Agregar
              </button>
            </div>
          </div>
        </div>

        {/* Save button for settings */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
          >
            <Save className="w-4 h-4" />
            <span>Guardar Parámetros</span>
          </button>
        </div>
      </form>

      {/* Section 4: Data Management (Backup, Restore, Samples) */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Database className="w-4 h-4 text-slate-700" />
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Gestión de Datos & Copias de Seguridad (JSON)
          </h3>
        </div>

        <p className="text-xs text-slate-500">
          Tus datos se guardan de forma segura y permanente en el almacenamiento local de tu navegador.
          Puedes descargar una copia de respaldo completa o restaurarla en cualquier momento.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Export JSON */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex flex-col justify-between space-y-3">
            <div>
              <span className="text-xs font-bold text-slate-900 block">Descargar Respaldo JSON</span>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                Exporta toda la base de datos de modelos, variantes, existencias y movimientos.
              </span>
            </div>
            <button
              type="button"
              onClick={exportJSONBackup}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-lg text-xs font-medium transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Exportar Respaldo (.json)</span>
            </button>
          </div>

          {/* Import JSON */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex flex-col justify-between space-y-3">
            <div>
              <span className="text-xs font-bold text-slate-900 block">Restaurar Respaldo JSON</span>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                Carga un archivo de respaldo generado anteriormente para restablecer tu información.
              </span>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileImport}
              accept=".json"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-lg text-xs font-medium transition-colors"
            >
              <Upload className="w-3.5 h-3.5 text-slate-600" />
              <span>Cargar Archivo JSON</span>
            </button>
          </div>
        </div>

        {/* Dangerous actions */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium px-3 py-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar Catálogo de Ejemplo Inicial</span>
          </button>

          <button
            type="button"
            onClick={handleClear}
            className="flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-800 font-medium px-3 py-2 hover:bg-rose-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Vaciar Todo el Inventario</span>
          </button>
        </div>
      </div>
    </div>
  );
};
