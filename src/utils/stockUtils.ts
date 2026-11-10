import { Blouse, BlouseVariant, StockMovement, StockStatus } from '../types/inventory';

export const DEFAULT_COLORS = [
  { name: 'Blanco', hex: '#FFFFFF' },
  { name: 'Negro', hex: '#0F172A' },
  { name: 'Azul Marino', hex: '#1E3A8A' },
  { name: 'Palo de Rosa', hex: '#FDA4AF' },
  { name: 'Rojo Carmesí', hex: '#BE123C' },
  { name: 'Verde Esmeralda', hex: '#047857' },
  { name: 'Beige Arena', hex: '#F5E6D3' },
  { name: 'Mostaza', hex: '#D97706' },
  { name: 'Terracota', hex: '#C2410C' },
  { name: 'Lila Pastel', hex: '#C084FC' },
  { name: 'Gris Perla', hex: '#94A3B8' },
  { name: 'Vino Tinto', hex: '#881337' },
];

export const DEFAULT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export function calculateStockStatus(currentStock: number, minStock: number): StockStatus {
  if (currentStock <= 0) return 'AGOTADO';
  if (currentStock <= minStock) return 'STOCK_BAJO';
  return 'EN_STOCK';
}

export function getStockStatusLabel(status: StockStatus): string {
  switch (status) {
    case 'AGOTADO':
      return 'Agotado';
    case 'STOCK_BAJO':
      return 'Stock bajo';
    case 'EN_STOCK':
      return 'En stock';
  }
}

export function getStockStatusStyle(status: StockStatus) {
  switch (status) {
    case 'AGOTADO':
      return {
        badge: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800',
        dot: 'bg-rose-600',
        text: 'text-rose-700 font-semibold',
        bgSubtle: 'bg-rose-50/60',
      };
    case 'STOCK_BAJO':
      return {
        badge: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800',
        dot: 'bg-amber-600',
        text: 'text-amber-700 font-medium',
        bgSubtle: 'bg-amber-50/60',
      };
    case 'EN_STOCK':
      return {
        badge: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800',
        dot: 'bg-emerald-600',
        text: 'text-emerald-700 font-medium',
        bgSubtle: 'bg-emerald-50/60',
      };
  }
}

export function getColorHex(colorName: string, palette = DEFAULT_COLORS): string {
  const match = palette.find(
    (c) => c.name.trim().toLowerCase() === colorName.trim().toLowerCase()
  );
  if (match) return match.hex;

  // Fallbacks for common names
  const lower = colorName.toLowerCase();
  if (lower.includes('blanco') || lower.includes('white')) return '#FFFFFF';
  if (lower.includes('negro') || lower.includes('black')) return '#0F172A';
  if (lower.includes('azul') || lower.includes('blue')) return '#1E3A8A';
  if (lower.includes('rosa') || lower.includes('pink')) return '#FDA4AF';
  if (lower.includes('rojo') || lower.includes('red')) return '#DC2626';
  if (lower.includes('verde') || lower.includes('green')) return '#059669';
  if (lower.includes('amarillo') || lower.includes('yellow')) return '#EAB308';
  if (lower.includes('morado') || lower.includes('lila') || lower.includes('purple')) return '#9333EA';
  if (lower.includes('gris') || lower.includes('gray')) return '#64748B';
  if (lower.includes('beige') || lower.includes('crema')) return '#F5E6D3';
  if (lower.includes('naranja') || lower.includes('orange')) return '#EA580C';

  return '#94A3B8';
}

/**
 * Generate standardized SKU like: BLU-001-NEG-M
 */
export function generateSKU(blouseCode: string, color: string, size: string): string {
  const cleanCode = (blouseCode || 'BLU').trim().toUpperCase().replace(/\s+/g, '-');
  const cleanColor = color
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .substring(0, 3);
  const cleanSize = size.trim().toUpperCase().replace(/\s+/g, '');
  return `${cleanCode}-${cleanColor}-${cleanSize}`;
}

/**
 * Combines colors + sizes to form full matrix of variants
 * Preserves stock and id if existing variant already exists
 */
export function generateVariantsForBlouse(
  blouseId: string,
  blouseCode: string,
  colors: string[],
  sizes: string[],
  defaultMinStock: number,
  existingVariants: BlouseVariant[] = []
): BlouseVariant[] {
  const variants: BlouseVariant[] = [];

  colors.forEach((color) => {
    sizes.forEach((size) => {
      const existing = existingVariants.find(
        (v) =>
          v.color.trim().toLowerCase() === color.trim().toLowerCase() &&
          v.size.trim().toLowerCase() === size.trim().toLowerCase()
      );

      if (existing) {
        variants.push({
          ...existing,
          color,
          size,
          // Update SKU if code changed
          sku: existing.sku || generateSKU(blouseCode, color, size),
        });
      } else {
        variants.push({
          id: `var-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          blouseId,
          sku: generateSKU(blouseCode, color, size),
          color,
          size,
          currentStock: 0,
          minStock: defaultMinStock,
          totalEntries: 0,
          totalExits: 0,
        });
      }
    });
  });

  return variants;
}

export function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(d);
  } catch {
    return isoString;
  }
}

export function formatCurrency(amount: number | undefined, symbol = '$'): string {
  if (amount === undefined || isNaN(amount)) return `${symbol}0.00`;
  return `${symbol}${amount.toLocaleString('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Export variants to CSV format
 */
export function exportVariantsToCSV(blouses: Blouse[]): void {
  const headers = [
    'Código Blusa',
    'Nombre Blusa',
    'Categoría',
    'SKU Variante',
    'Color',
    'Talla',
    'Stock Actual',
    'Stock Mínimo',
    'Estado',
    'Total Entradas',
    'Total Salidas',
    'Precio Ref.',
  ];

  const rows: (string | number)[][] = [];

  blouses.forEach((blouse) => {
    blouse.variants.forEach((v) => {
      const status = calculateStockStatus(v.currentStock, v.minStock);
      rows.push([
        `"${blouse.code.replace(/"/g, '""')}"`,
        `"${blouse.name.replace(/"/g, '""')}"`,
        `"${(blouse.category || '').replace(/"/g, '""')}"`,
        `"${v.sku}"`,
        `"${v.color}"`,
        `"${v.size}"`,
        v.currentStock,
        v.minStock,
        `"${getStockStatusLabel(status)}"`,
        v.totalEntries,
        v.totalExits,
        v.price || 0,
      ]);
    });
  });

  const csvContent =
    '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

  downloadFile(
    csvContent,
    `inventario_blusas_${new Date().toISOString().slice(0, 10)}.csv`,
    'text/csv;charset=utf-8;'
  );
}

/**
 * Export movements history to CSV
 */
export function exportMovementsToCSV(movements: StockMovement[]): void {
  const headers = [
    'ID',
    'Fecha y Hora',
    'Tipo',
    'Código Blusa',
    'Nombre Blusa',
    'SKU',
    'Color',
    'Talla',
    'Cantidad',
    'Stock Anterior',
    'Stock Nuevo',
    'Motivo',
    'Responsable',
    'Notas',
  ];

  const rows = movements.map((m) => [
    `"${m.id}"`,
    `"${formatDate(m.timestamp)}"`,
    `"${m.type}"`,
    `"${m.blouseCode}"`,
    `"${m.blouseName.replace(/"/g, '""')}"`,
    `"${m.sku}"`,
    `"${m.color}"`,
    `"${m.size}"`,
    m.quantity,
    m.previousStock,
    m.newStock,
    `"${(m.reason || '').replace(/"/g, '""')}"`,
    `"${(m.responsible || '').replace(/"/g, '""')}"`,
    `"${(m.note || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent =
    '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

  downloadFile(
    csvContent,
    `movimientos_inventario_${new Date().toISOString().slice(0, 10)}.csv`,
    'text/csv;charset=utf-8;'
  );
}

export function downloadFile(content: string, fileName: string, contentType: string) {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
