import React, { useState } from 'react';
import { InventoryProvider, useInventory } from './context/InventoryContext';
import { ActiveTab, Blouse, BlouseVariant, MovementType } from './types/inventory';
import { Sidebar } from './components/Navigation/Sidebar';
import { Header } from './components/Navigation/Header';
import { DashboardView } from './components/Dashboard/DashboardView';
import { BlouseProfileView } from './components/BlouseDetail/BlouseProfileView';
import { InventoryListView } from './components/Inventory/InventoryListView';
import { MovementsView } from './components/Movements/MovementsView';
import { ReportsView } from './components/Reports/ReportsView';
import { SettingsView } from './components/Settings/SettingsView';
import { QuickMovementModal } from './components/Modals/QuickMovementModal';
import { BlouseModal } from './components/Modals/BlouseModal';

function InventoryApp() {
  const { blouses } = useInventory();

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [selectedBlouseId, setSelectedBlouseId] = useState<string | null>(
    blouses[0]?.id || null
  );
  const [isOpenMobile, setIsOpenMobile] = useState(false);

  // Modal States
  const [isBlouseModalOpen, setIsBlouseModalOpen] = useState(false);
  const [blouseToEdit, setBlouseToEdit] = useState<Blouse | null>(null);

  const [quickMovementState, setQuickMovementState] = useState<{
    isOpen: boolean;
    blouse?: Blouse;
    variant?: BlouseVariant;
    defaultType?: MovementType;
  }>({
    isOpen: false,
    defaultType: 'ENTRADA',
  });

  const handleOpenNewBlouse = () => {
    setBlouseToEdit(null);
    setIsBlouseModalOpen(true);
  };

  const handleEditBlouse = (blouse: Blouse) => {
    setBlouseToEdit(blouse);
    setIsBlouseModalOpen(true);
  };

  const handleOpenQuickMovement = (
    blouse?: Blouse,
    variant?: BlouseVariant,
    defaultType: MovementType = 'ENTRADA'
  ) => {
    setQuickMovementState({
      isOpen: true,
      blouse: blouse || (selectedBlouseId ? blouses.find((b) => b.id === selectedBlouseId) : undefined),
      variant,
      defaultType,
    });
  };

  const handleSelectBlouseForDetail = (blouseId: string) => {
    setSelectedBlouseId(blouseId);
    setActiveTab('buscador');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row text-slate-900 font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpenMobile={isOpenMobile}
        setIsOpenMobile={setIsOpenMobile}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenNewBlouse={handleOpenNewBlouse}
          onOpenQuickMovement={() => handleOpenQuickMovement()}
          onSelectBlouseForDetail={handleSelectBlouseForDetail}
          setIsOpenMobile={setIsOpenMobile}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              setActiveTab={setActiveTab}
              onSelectBlouseForDetail={handleSelectBlouseForDetail}
              onQuickMovementForVariant={(b, v) => handleOpenQuickMovement(b, v, 'ENTRADA')}
            />
          )}

          {activeTab === 'buscador' && (
            <BlouseProfileView
              selectedBlouseId={selectedBlouseId}
              onSelectBlouse={(id) => setSelectedBlouseId(id)}
              onEditBlouse={handleEditBlouse}
              onQuickMovement={(b, v, type) => handleOpenQuickMovement(b, v, type || 'ENTRADA')}
              onOpenNewBlouse={handleOpenNewBlouse}
            />
          )}

          {activeTab === 'inventario' && (
            <InventoryListView
              onSelectBlouseForDetail={handleSelectBlouseForDetail}
              onEditBlouse={handleEditBlouse}
              onQuickMovement={(b, v, type) => handleOpenQuickMovement(b, v, type || 'ENTRADA')}
              onOpenNewBlouse={handleOpenNewBlouse}
            />
          )}

          {activeTab === 'movimientos' && <MovementsView />}

          {activeTab === 'reportes' && <ReportsView />}

          {activeTab === 'configuracion' && <SettingsView />}
        </main>
      </div>

      {/* Global Quick Movement Modal */}
      <QuickMovementModal
        isOpen={quickMovementState.isOpen}
        onClose={() => setQuickMovementState((prev) => ({ ...prev, isOpen: false }))}
        blouse={quickMovementState.blouse}
        variant={quickMovementState.variant}
        defaultType={quickMovementState.defaultType}
      />

      {/* Global Blouse Create/Edit Modal */}
      <BlouseModal
        isOpen={isBlouseModalOpen}
        onClose={() => setIsBlouseModalOpen(false)}
        blouseToEdit={blouseToEdit}
        onSuccess={(id) => {
          setSelectedBlouseId(id);
          setActiveTab('buscador');
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <InventoryProvider>
      <InventoryApp />
    </InventoryProvider>
  );
}
