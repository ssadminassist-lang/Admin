import React, { useState, useEffect } from 'react';
import { Blouse, BlouseVariant } from '../../types/inventory';
import { useInventory } from '../../context/InventoryContext';
import { X, Plus, AlertCircle, Sparkles, Check } from 'lucide-react';
import { getColorHex, generateVariantsForBlouse } from '../../utils/stockUtils';

interface BlouseModalProps {
  isOpen: boolean;
  onClose: () => void;
  blouseToEdit?: Blouse | null;
  onSuccess?: (blouseId: string) => void;
}

export const BlouseModal: React.FC<BlouseModalProps> = ({
  isOpen,
  onClose,
  blouseToEdit,
  onSuccess,
}) => {
  const { addBlouse, updateBlouse, settings, blouses } = useInventory();

  const isEditing = Boolean(blouseToEdit);

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [variantsState, setVariantsState] = useState<BlouseVariant[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // New color / size custom inputs
  const [customColorName, setCustomColorName] = useState('');

  // Reset or populate on open
  useEffect(() => {
    if (blouseToEdit) {
      setCode(blouseToEdit.code);
      setName(blouseToEdit.name);
      setCategory(blouseToEdit.category);
      setDescription(blouseToEdit.description || '');
      setSelectedColors(blouseToEdit.colors);
      setSelectedSizes(blouseToEdit.sizes);
      setVariantsState(blouseToEdit.variants);
    } else {
      // Suggest next code
      const nextNum = blouses.length + 1;
      const formattedNum = String(nextNum).padStart(3, '0');
      setCode(`BLU-${formattedNum}`);
      setName('');
      setCategory(settings.categories[0] || 'Casual / Diario');
      setDescription('');
      setSelectedColors(['Blanco', 'Negro']);
      setSelectedSizes(['S', 'M', 'L']);
      setVariantsState([]);
    }
    setErrorMsg(null);
  }, [blouseToEdit, isOpen, blouses.length, settings.categories]);

  // Sync variants when colors, sizes, or code change
  useEffect(() => {
    if (selectedColors.length > 0 && selectedSizes.length > 0) {
      const generated = generateVariantsForBlouse(
        blouseToEdit?.id || 'temp',
        code,
        selectedColors,
        selectedSizes,
        settings.defaultMinStock,
        variantsState
      );
      setVariantsState(generated);
    } else {
      setVariantsState([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedColors, selectedSizes, code]);

  if (!isOpen) return null;

  const toggleColor = (colorName: string) => {
    if (selectedColors.includes(colorName)) {
      if (selectedColors.length === 1) {
        setErrorMsg('La blusa debe tener al menos un color.');
        return;
      }
      setSelectedColors(selectedColors.filter((c) => c !== colorName));
    } else {
      setSelectedColors([...selectedColors, colorName]);
    }
    setErrorMsg(null);
  };

  const addCustomColor = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = customColorName.trim();
    if (!clean) return;
    if (!selectedColors.includes(clean)) {
      setSelectedColors([...selectedColors, clean]);
    }
    setCustomColorName('');
  };

  const toggleSize = (sizeName: string) => {
    if (selectedSizes.includes(sizeName)) {
      if (selectedSizes.length === 1) {
        setErrorMsg('La blusa debe tener al menos una talla.');
        return;
      }
      setSelectedSizes(selectedSizes.filter((s) => s !== sizeName));
    } else {
      setSelectedSizes([...selectedSizes, sizeName]);
    }
    setErrorMsg(null);
  };

  const handleVariantStockChange = (variantId: string, newStock: number) => {
    setVariantsState((prev) =>
      prev.map((v) => (v.id === variantId ? { ...v, currentStock: Math.max(0, newStock) } : v))
    );
  };

  const handleVariantMinStockChange = (variantId: string, newMin: number) => {
    setVariantsState((prev) =>
      prev.map((v) => (v.id === variantId ? { ...v, minStock: Math.max(0, newMin) } : v))
    );
  };

  const handleVariantPriceChange = (variantId: string, newPrice: number) => {
    setVariantsState((prev) =>
      prev.map((v) => (v.id === variantId ? { ...v, price: Math.max(0, newPrice) } : v))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      setErrorMsg('El código de la blusa es requerido.');
      return;
    }
    if (!name.trim()) {
      setErrorMsg('El nombre de la blusa es requerido.');
      return;
    }
    if (selectedColors.length === 0) {
      setErrorMsg('Debes seleccionar al menos un color.');
      return;
    }
    if (selectedSizes.length === 0) {
      setErrorMsg('Debes seleccionar al menos una talla.');
      return;
    }

    if (isEditing && blouseToEdit) {
      const res = updateBlouse(blouseToEdit.id, {
        code: cleanCode,
        name: name.trim(),
        category,
        description: description.trim(),
        colors: selectedColors,
        sizes: selectedSizes,
        variants: variantsState,
      });

      if (!res.success) {
        setErrorMsg(res.message);
        return;
      }
      onSuccess?.(blouseToEdit.id);
      onClose();
    } else {
      const res = addBlouse({
        code: cleanCode,
        name: name.trim(),
        category,
        description: description.trim(),
        active: true,
        colors: selectedColors,
        sizes: selectedSizes,
        customVariants: variantsState,
      });

      if (!res.success) {
        setErrorMsg(res.message);
        return;
      }
      onSuccess?.(res.blouseId || '');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              {isEditing ? `Editar Blusa: ${blouseToEdit?.code}` : 'Nueva Blusa en Inventario'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Genera automáticamente la matriz de variantes por combinación de color y talla
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* General Information */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Código Único *
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="BLU-001"
                className="w-full px-3 py-2 text-sm font-mono uppercase border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                required
              />
              <span className="text-[10px] text-slate-400">Identificador único (SKU raíz)</span>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nombre de la Blusa *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Blusa Seda Manga Larga Cuello V"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Categoría</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                {settings.categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Descripción / Detalles
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Material, tipo de corte, detalles de confección..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          {/* Color Selection */}
          <div className="border-t border-slate-100 pt-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <label className="text-xs font-semibold text-slate-800">
                  Colores Disponibles ({selectedColors.length} seleccionados) *
                </label>
                <p className="text-[11px] text-slate-500">
                  Haz clic para activar o desactivar colores para este modelo
                </p>
              </div>

              {/* Add custom color inline */}
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  placeholder="Otro color..."
                  value={customColorName}
                  onChange={(e) => setCustomColorName(e.target.value)}
                  className="px-2 py-1 text-xs border border-slate-200 rounded-md w-28 focus:outline-none focus:ring-1 focus:ring-slate-800"
                />
                <button
                  type="button"
                  onClick={addCustomColor}
                  className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors"
                  title="Añadir color"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {settings.colorPalette.map((col) => {
                const isSelected = selectedColors.includes(col.name);
                return (
                  <button
                    key={col.name}
                    type="button"
                    onClick={() => toggleColor(col.name)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      isSelected
                        ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0"
                      style={{ backgroundColor: col.hex }}
                    />
                    <span>{col.name}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                  </button>
                );
              })}

              {/* Any custom color not in default palette */}
              {selectedColors
                .filter((c) => !settings.colorPalette.some((p) => p.name === c))
                .map((customName) => (
                  <button
                    key={customName}
                    type="button"
                    onClick={() => toggleColor(customName)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-900 bg-slate-900 text-white shadow-xs"
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0"
                      style={{ backgroundColor: getColorHex(customName) }}
                    />
                    <span>{customName}</span>
                    <Check className="w-3.5 h-3.5 text-white" />
                  </button>
                ))}
            </div>
          </div>

          {/* Size Selection */}
          <div className="border-t border-slate-100 pt-4">
            <div className="mb-2">
              <label className="text-xs font-semibold text-slate-800">
                Tallas Disponibles ({selectedSizes.length} seleccionadas) *
              </label>
              <p className="text-[11px] text-slate-500">
                Selecciona las tallas que se producirán o comercializarán
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {settings.standardSizes.map((sz) => {
                const isSelected = selectedSizes.includes(sz);
                return (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => toggleSize(sz)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      isSelected
                        ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {sz}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Generated Variants Configuration Matrix */}
          <div className="border-t border-slate-100 pt-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-slate-700" />
                  <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                    Variantes Generadas ({variantsState.length} combinaciones color × talla)
                  </h4>
                </div>
                <p className="text-[11px] text-slate-500">
                  Ajusta el stock actual, stock mínimo y precio de cada variante si es necesario
                </p>
              </div>
            </div>

            {variantsState.length > 0 ? (
              <div className="border border-slate-200 rounded-lg overflow-x-auto max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2">Color</th>
                      <th className="px-3 py-2">Talla</th>
                      <th className="px-3 py-2">SKU Generado</th>
                      <th className="px-3 py-2 text-right">Stock Actual</th>
                      <th className="px-3 py-2 text-right">Stock Mínimo</th>
                      <th className="px-3 py-2 text-right">Precio Ref.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {variantsState.map((v) => (
                      <tr key={v.id} className="hover:bg-slate-50/80">
                        <td className="px-3 py-2 font-sans font-medium text-slate-800 flex items-center gap-1.5">
                          <span
                            className="w-3 h-3 rounded-full border border-slate-300 inline-block shrink-0"
                            style={{ backgroundColor: getColorHex(v.color) }}
                          />
                          {v.color}
                        </td>
                        <td className="px-3 py-2 font-sans font-bold text-slate-900">{v.size}</td>
                        <td className="px-3 py-2 text-slate-500 text-[11px]">{v.sku}</td>
                        <td className="px-3 py-2 text-right">
                          <input
                            type="number"
                            min="0"
                            value={v.currentStock}
                            onChange={(e) =>
                              handleVariantStockChange(v.id, parseInt(e.target.value, 10) || 0)
                            }
                            className="w-16 px-2 py-1 text-right border border-slate-200 rounded text-xs focus:ring-1 focus:ring-slate-900"
                          />
                        </td>
                        <td className="px-3 py-2 text-right">
                          <input
                            type="number"
                            min="0"
                            value={v.minStock}
                            onChange={(e) =>
                              handleVariantMinStockChange(v.id, parseInt(e.target.value, 10) || 0)
                            }
                            className="w-16 px-2 py-1 text-right border border-slate-200 rounded text-xs focus:ring-1 focus:ring-slate-900"
                          />
                        </td>
                        <td className="px-3 py-2 text-right">
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={v.price || 0}
                            onChange={(e) =>
                              handleVariantPriceChange(v.id, parseFloat(e.target.value) || 0)
                            }
                            className="w-20 px-2 py-1 text-right border border-slate-200 rounded text-xs focus:ring-1 focus:ring-slate-900"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 rounded-lg text-center text-xs text-slate-500 border border-slate-200">
                Selecciona al menos un color y una talla para generar las variantes del producto.
              </div>
            )}
          </div>

          {/* Footer actions */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
            >
              {isEditing ? 'Guardar Cambios' : 'Registrar Blusa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
