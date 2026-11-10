import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  Blouse,
  BlouseVariant,
  InventorySettings,
  MovementFormData,
  MovementType,
  StockMovement,
  StockStatus,
} from '../types/inventory';
import { INITIAL_BLOUSES, INITIAL_MOVEMENTS, INITIAL_SETTINGS } from '../data/initialData';
import { calculateStockStatus, downloadFile, generateVariantsForBlouse } from '../utils/stockUtils';

const STORAGE_KEY_BLOUSES = 'blouse_inv_data_blouses_v1';
const STORAGE_KEY_MOVEMENTS = 'blouse_inv_data_movements_v1';
const STORAGE_KEY_SETTINGS = 'blouse_inv_data_settings_v1';

interface MovementResult {
  success: boolean;
  message: string;
}

interface InventoryContextType {
  blouses: Blouse[];
  movements: StockMovement[];
  settings: InventorySettings;
  // Metrics
  metrics: {
    totalBlouses: number;
    totalActiveBlouses: number;
    totalVariants: number;
    totalUnits: number;
    totalEntries: number;
    totalExits: number;
    inStockVariants: number;
    lowStockVariants: number;
    outOfStockVariants: number;
    stockByColor: Record<string, number>;
    stockBySize: Record<string, number>;
    criticalAlerts: Array<{ blouse: Blouse; variant: BlouseVariant; status: StockStatus }>;
  };
  // Actions
  addBlouse: (
    blouseData: Omit<Blouse, 'id' | 'createdAt' | 'updatedAt' | 'variants'> & {
      customVariants?: BlouseVariant[];
    }
  ) => { success: boolean; message: string; blouseId?: string };
  updateBlouse: (
    id: string,
    blouseData: Partial<Omit<Blouse, 'id' | 'createdAt'>>
  ) => { success: boolean; message: string };
  toggleBlouseActive: (id: string) => void;
  deleteBlouse: (id: string) => { success: boolean; message: string };
  registerMovement: (data: MovementFormData) => MovementResult;
  updateVariantInfo: (
    blouseId: string,
    variantId: string,
    updates: { minStock?: number; price?: number }
  ) => void;
  updateSettings: (newSettings: InventorySettings) => void;
  resetToInitialData: () => void;
  clearAllData: () => void;
  exportJSONBackup: () => void;
  importJSONBackup: (jsonContent: string) => { success: boolean; message: string };
  getBlouseById: (id: string) => Blouse | undefined;
  getVariantById: (variantId: string) => { blouse: Blouse; variant: BlouseVariant } | undefined;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Initialize State from localStorage with initialData fallback
  const [blouses, setBlouses] = useState<Blouse[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_BLOUSES);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading blouses from localStorage', e);
    }
    return INITIAL_BLOUSES;
  });

  const [movements, setMovements] = useState<StockMovement[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MOVEMENTS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading movements from localStorage', e);
    }
    return INITIAL_MOVEMENTS;
  });

  const [settings, setSettings] = useState<InventorySettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading settings from localStorage', e);
    }
    return INITIAL_SETTINGS;
  });

  // 2. Persist to localStorage whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_BLOUSES, JSON.stringify(blouses));
    } catch (e) {
      console.error('Error saving blouses', e);
    }
  }, [blouses]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_MOVEMENTS, JSON.stringify(movements));
    } catch (e) {
      console.error('Error saving movements', e);
    }
  }, [movements]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Error saving settings', e);
    }
  }, [settings]);

  // 3. Compute Metrics
  const metrics = useMemo(() => {
    let totalVariants = 0;
    let totalUnits = 0;
    let totalEntries = 0;
    let totalExits = 0;
    let inStockVariants = 0;
    let lowStockVariants = 0;
    let outOfStockVariants = 0;
    const stockByColor: Record<string, number> = {};
    const stockBySize: Record<string, number> = {};
    const criticalAlerts: Array<{ blouse: Blouse; variant: BlouseVariant; status: StockStatus }> = [];

    blouses.forEach((blouse) => {
      blouse.variants.forEach((variant) => {
        totalVariants += 1;
        totalUnits += variant.currentStock;
        totalEntries += variant.totalEntries || 0;
        totalExits += variant.totalExits || 0;

        const status = calculateStockStatus(variant.currentStock, variant.minStock);
        if (status === 'EN_STOCK') inStockVariants += 1;
        else if (status === 'STOCK_BAJO') {
          lowStockVariants += 1;
          criticalAlerts.push({ blouse, variant, status });
        } else if (status === 'AGOTADO') {
          outOfStockVariants += 1;
          criticalAlerts.push({ blouse, variant, status });
        }

        // Color counter
        stockByColor[variant.color] = (stockByColor[variant.color] || 0) + variant.currentStock;
        // Size counter
        stockBySize[variant.size] = (stockBySize[variant.size] || 0) + variant.currentStock;
      });
    });

    return {
      totalBlouses: blouses.length,
      totalActiveBlouses: blouses.filter((b) => b.active).length,
      totalVariants,
      totalUnits,
      totalEntries,
      totalExits,
      inStockVariants,
      lowStockVariants,
      outOfStockVariants,
      stockByColor,
      stockBySize,
      criticalAlerts: criticalAlerts.sort((a, b) => a.variant.currentStock - b.variant.currentStock),
    };
  }, [blouses]);

  // 4. Blouse CRUD
  const addBlouse = (
    blouseData: Omit<Blouse, 'id' | 'createdAt' | 'updatedAt' | 'variants'> & {
      customVariants?: BlouseVariant[];
    }
  ) => {
    // Validate unique blouse code
    const cleanCode = blouseData.code.trim().toUpperCase();
    if (!cleanCode) {
      return { success: false, message: 'El código de la blusa es obligatorio.' };
    }
    if (!blouseData.name.trim()) {
      return { success: false, message: 'El nombre de la blusa es obligatorio.' };
    }
    if (blouseData.colors.length === 0) {
      return { success: false, message: 'Debes seleccionar al menos un color.' };
    }
    if (blouseData.sizes.length === 0) {
      return { success: false, message: 'Debes seleccionar al menos una talla.' };
    }

    const codeExists = blouses.some((b) => b.code.trim().toUpperCase() === cleanCode);
    if (codeExists) {
      return {
        success: false,
        message: `El código "${cleanCode}" ya existe. Usa un código único para cada blusa.`,
      };
    }

    const newId = `blu-${Date.now()}`;
    const generatedVariants = blouseData.customVariants?.length
      ? blouseData.customVariants
      : generateVariantsForBlouse(
          newId,
          cleanCode,
          blouseData.colors,
          blouseData.sizes,
          settings.defaultMinStock
        );

    const now = new Date().toISOString();
    const newBlouse: Blouse = {
      id: newId,
      code: cleanCode,
      name: blouseData.name.trim(),
      description: blouseData.description || '',
      category: blouseData.category || 'General',
      active: true,
      createdAt: now,
      updatedAt: now,
      colors: blouseData.colors,
      sizes: blouseData.sizes,
      variants: generatedVariants,
    };

    setBlouses((prev) => [newBlouse, ...prev]);

    // If variants were created with initial stock > 0, record initial entry movements
    const initialMovements: StockMovement[] = [];
    newBlouse.variants.forEach((v) => {
      if (v.currentStock > 0) {
        initialMovements.push({
          id: `mov-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          timestamp: now,
          type: 'ENTRADA',
          blouseId: newBlouse.id,
          blouseCode: newBlouse.code,
          blouseName: newBlouse.name,
          variantId: v.id,
          sku: v.sku,
          color: v.color,
          size: v.size,
          quantity: v.currentStock,
          previousStock: 0,
          newStock: v.currentStock,
          reason: 'Inventario inicial de creación',
          responsible: settings.responsibles[0] || 'Sistema',
          note: 'Stock inicial al registrar modelo',
        });
      }
    });

    if (initialMovements.length > 0) {
      setMovements((prev) => [...initialMovements, ...prev]);
    }

    return {
      success: true,
      message: `Blusa "${newBlouse.name}" (${newBlouse.code}) registrada exitosamente.`,
      blouseId: newId,
    };
  };

  const updateBlouse = (id: string, blouseData: Partial<Omit<Blouse, 'id' | 'createdAt'>>) => {
    const existing = blouses.find((b) => b.id === id);
    if (!existing) {
      return { success: false, message: 'La blusa no fue encontrada.' };
    }

    if (blouseData.code) {
      const cleanCode = blouseData.code.trim().toUpperCase();
      const codeExists = blouses.some(
        (b) => b.id !== id && b.code.trim().toUpperCase() === cleanCode
      );
      if (codeExists) {
        return {
          success: false,
          message: `El código "${cleanCode}" ya está en uso por otra blusa.`,
        };
      }
    }

    setBlouses((prev) =>
      prev.map((b) => {
        if (b.id !== id) return b;

        const newCode = (blouseData.code || b.code).trim().toUpperCase();
        const newColors = blouseData.colors || b.colors;
        const newSizes = blouseData.sizes || b.sizes;

        // If colors or sizes changed, regenerate variants preserving existing data
        const colorsOrSizesChanged =
          JSON.stringify(newColors) !== JSON.stringify(b.colors) ||
          JSON.stringify(newSizes) !== JSON.stringify(b.sizes) ||
          newCode !== b.code;

        const updatedVariants = colorsOrSizesChanged
          ? generateVariantsForBlouse(
              b.id,
              newCode,
              newColors,
              newSizes,
              settings.defaultMinStock,
              blouseData.variants || b.variants
            )
          : blouseData.variants || b.variants;

        return {
          ...b,
          ...blouseData,
          code: newCode,
          colors: newColors,
          sizes: newSizes,
          variants: updatedVariants,
          updatedAt: new Date().toISOString(),
        };
      })
    );

    return { success: true, message: 'Blusa actualizada con éxito.' };
  };

  const toggleBlouseActive = (id: string) => {
    setBlouses((prev) =>
      prev.map((b) => (b.id === id ? { ...b, active: !b.active, updatedAt: new Date().toISOString() } : b))
    );
  };

  const deleteBlouse = (id: string) => {
    const target = blouses.find((b) => b.id === id);
    if (!target) return { success: false, message: 'Blusa no encontrada.' };

    setBlouses((prev) => prev.filter((b) => b.id !== id));
    return {
      success: true,
      message: `Blusa "${target.name}" (${target.code}) eliminada del catálogo.`,
    };
  };

  // 5. Stock Movement Management
  const registerMovement = (formData: MovementFormData): MovementResult => {
    const { type, blouseId, variantId, quantity, reason, responsible, note } = formData;

    // Validate quantities
    const qty = Number(quantity);
    if (isNaN(qty) || qty <= 0 || !Number.isInteger(qty)) {
      return { success: false, message: 'La cantidad debe ser un número entero mayor a 0.' };
    }

    const blouse = blouses.find((b) => b.id === blouseId);
    if (!blouse) {
      return { success: false, message: 'Blusa no encontrada.' };
    }

    const variant = blouse.variants.find((v) => v.id === variantId);
    if (!variant) {
      return { success: false, message: 'Variante de color y talla no encontrada.' };
    }

    const currentStock = variant.currentStock;
    let newStock = currentStock;

    if (type === 'ENTRADA') {
      newStock = currentStock + qty;
    } else if (type === 'SALIDA') {
      if (qty > currentStock) {
        return {
          success: false,
          message: `Stock insuficiente: intentas retirar ${qty} unidad(es), pero solo hay ${currentStock} disponible(s) en ${variant.color} / Talla ${variant.size}.`,
        };
      }
      newStock = currentStock - qty;
    } else if (type === 'AJUSTE') {
      // For Ajuste, the user can choose new exact stock or difference; here quantity is the applied adjustment or new balance
      // We interpret quantity as the new absolute stock if specified or adjustment amount.
      // Let's standardise: in the modal, we can specify either delta or absolute stock.
      // If note mentions 'Absoluto', handle accordingly, or use qty as delta.
      newStock = qty;
    }

    if (newStock < 0) {
      return { success: false, message: 'El stock resultante no puede ser negativo.' };
    }

    const now = new Date().toISOString();
    const newMovement: StockMovement = {
      id: `mov-${Date.now()}`,
      timestamp: now,
      type,
      blouseId: blouse.id,
      blouseCode: blouse.code,
      blouseName: blouse.name,
      variantId: variant.id,
      sku: variant.sku,
      color: variant.color,
      size: variant.size,
      quantity: qty,
      previousStock: currentStock,
      newStock,
      reason: reason || (type === 'ENTRADA' ? 'Entrada manual' : type === 'SALIDA' ? 'Salida manual' : 'Ajuste manual'),
      responsible: responsible || settings.responsibles[0] || 'Administrador',
      note: note || '',
    };

    // Update blouse state
    setBlouses((prev) =>
      prev.map((b) => {
        if (b.id !== blouseId) return b;
        return {
          ...b,
          updatedAt: now,
          variants: b.variants.map((v) => {
            if (v.id !== variantId) return v;
            return {
              ...v,
              currentStock: newStock,
              totalEntries: type === 'ENTRADA' ? v.totalEntries + qty : v.totalEntries,
              totalExits: type === 'SALIDA' ? v.totalExits + qty : v.totalExits,
            };
          }),
        };
      })
    );

    // Prepend to movements
    setMovements((prev) => [newMovement, ...prev]);

    return {
      success: true,
      message: `${type === 'ENTRADA' ? 'Entrada' : type === 'SALIDA' ? 'Salida' : 'Ajuste'} de ${qty} unidad(es) de ${blouse.name} (${variant.color} - ${variant.size}) registrada correctamente. Stock actual: ${newStock}.`,
    };
  };

  const updateVariantInfo = (
    blouseId: string,
    variantId: string,
    updates: { minStock?: number; price?: number }
  ) => {
    setBlouses((prev) =>
      prev.map((b) => {
        if (b.id !== blouseId) return b;
        return {
          ...b,
          variants: b.variants.map((v) => (v.id === variantId ? { ...v, ...updates } : v)),
        };
      })
    );
  };

  const updateSettings = (newSettings: InventorySettings) => {
    setSettings(newSettings);
  };

  const resetToInitialData = () => {
    setBlouses(INITIAL_BLOUSES);
    setMovements(INITIAL_MOVEMENTS);
    setSettings(INITIAL_SETTINGS);
    localStorage.removeItem(STORAGE_KEY_BLOUSES);
    localStorage.removeItem(STORAGE_KEY_MOVEMENTS);
    localStorage.removeItem(STORAGE_KEY_SETTINGS);
  };

  const clearAllData = () => {
    setBlouses([]);
    setMovements([]);
    localStorage.setItem(STORAGE_KEY_BLOUSES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEY_MOVEMENTS, JSON.stringify([]));
  };

  const exportJSONBackup = () => {
    const backupData = {
      appName: 'Sistema de Inventario de Blusas',
      exportedAt: new Date().toISOString(),
      version: '1.0',
      settings,
      blouses,
      movements,
    };
    downloadFile(
      JSON.stringify(backupData, null, 2),
      `respaldo_inventario_blusas_${new Date().toISOString().slice(0, 10)}.json`,
      'application/json'
    );
  };

  const importJSONBackup = (jsonContent: string): { success: boolean; message: string } => {
    try {
      const data = JSON.parse(jsonContent);
      if (!data || !Array.isArray(data.blouses)) {
        return {
          success: false,
          message: 'El archivo JSON no tiene un formato válido de inventario de blusas.',
        };
      }
      setBlouses(data.blouses);
      if (Array.isArray(data.movements)) setMovements(data.movements);
      if (data.settings && typeof data.settings === 'object') setSettings(data.settings);
      return { success: true, message: 'Respaldo importado y restaurado exitosamente.' };
    } catch {
      return { success: false, message: 'Error al interpretar el archivo JSON. Verifica el formato.' };
    }
  };

  const getBlouseById = (id: string) => blouses.find((b) => b.id === id);

  const getVariantById = (variantId: string) => {
    for (const b of blouses) {
      const found = b.variants.find((v) => v.id === variantId);
      if (found) return { blouse: b, variant: found };
    }
    return undefined;
  };

  return (
    <InventoryContext.Provider
      value={{
        blouses,
        movements,
        settings,
        metrics,
        addBlouse,
        updateBlouse,
        toggleBlouseActive,
        deleteBlouse,
        registerMovement,
        updateVariantInfo,
        updateSettings,
        resetToInitialData,
        clearAllData,
        exportJSONBackup,
        importJSONBackup,
        getBlouseById,
        getVariantById,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};

export function useInventory(): InventoryContextType {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
}
