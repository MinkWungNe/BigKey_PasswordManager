// ============================================================================
// File: App.tsx
// Description: Central application coordinator orchestrating lifecycle views
//              (Setup, Lock, Dashboard), clipboard feedback, and background activity sync.
// ============================================================================

import { useState } from "react";
import { VaultEntry } from "./types";
import { useVault } from "./hooks/useVault";
import { useEntries } from "./hooks/useEntries";
import { useSecureClipboard } from "./hooks/useSecureClipboard";
import { useActivityTracker } from "./hooks/useActivityTracker";

import { SetupScreen } from "./components/auth/SetupScreen";
import { LockScreen } from "./components/auth/LockScreen";
import { Sidebar } from "./components/dashboard/Sidebar";
import { EntryList } from "./components/dashboard/EntryList";
import { EntryDetail } from "./components/dashboard/EntryDetail";
import { EntryFormModal } from "./components/dashboard/EntryFormModal";
import { PasswordGeneratorModal } from "./components/generator/PasswordGeneratorModal";
import { Toast } from "./components/common/Toast";
import { Modal } from "./components/common/Modal";
import { Button } from "./components/common/Button";

// ----------------------------------------------------------------------------
// 1. App
// - Top-level coordinator routing lifecycle states and bridging security hooks.
//
// Args:
//   - None.
//
// Return:
//   - JSX.Element: Root application interface tree.
// ----------------------------------------------------------------------------
export function App() {
  // Step 1. Initialize lifecycle and session hooks
  const { status, isLoading: isVaultLoading, initialize, unlock, lock } = useVault();
  const isUnlocked = Boolean(status?.is_initialized && status?.is_unlocked);

  // Step 2. Attach throttled activity listener for auto-lock reset
  useActivityTracker(isUnlocked);

  // Step 3. Secure clipboard hook with 30s auto-clear & mobile resume detection
  const { copiedFieldId, copiedMessage, copyToClipboard } = useSecureClipboard();

  // Step 4. Initialize entries management state
  const {
    headers,
    selectedEntry,
    selectedId,
    selectedCategory,
    searchQuery,
    isLoading: isListLoading,
    isDetailLoading,
    setSelectedCategory,
    setSearchQuery,
    selectEntryById,
    saveEntry,
    removeEntry,
    toggleEntryFavorite,
  } = useEntries(isUnlocked);

  // Modal Dialog States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<VaultEntry | null>(null);

  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [targetFieldForGen, setTargetFieldForGen] = useState<string | null>(null);
  const [generatedPasswordPayload, setGeneratedPasswordPayload] = useState<{
    fieldId: string;
    value: string;
  } | null>(null);

  const [deleteCandidateId, setDeleteCandidateId] = useState<string | null>(null);

  // --------------------------------------------------------------------------
  // Modal Trigger Handlers
  // --------------------------------------------------------------------------
  const handleAddNew = () => {
    setEditingEntry(null);
    setIsFormOpen(true);
  };

  const handleEdit = (entry: VaultEntry) => {
    setEditingEntry(entry);
    setIsFormOpen(true);
  };

  const handleOpenGeneratorForField = (fieldId: string) => {
    setTargetFieldForGen(fieldId);
    setIsGeneratorOpen(true);
  };

  const handleApplyGeneratedPassword = (password: string) => {
    if (targetFieldForGen) {
      setGeneratedPasswordPayload({ fieldId: targetFieldForGen, value: password });
      setTargetFieldForGen(null);
    }
  };

  const confirmDelete = async () => {
    if (deleteCandidateId) {
      await removeEntry(deleteCandidateId);
      setDeleteCandidateId(null);
    }
  };

  // --------------------------------------------------------------------------
  // Early Render: Loading State
  // --------------------------------------------------------------------------
  if (isVaultLoading && !status) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-zinc-950 text-zinc-400 text-xs">
        Initializing secure environment...
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // Lifecycle Router: Uninitialized -> Setup Screen
  // --------------------------------------------------------------------------
  if (!status?.is_initialized) {
    return <SetupScreen onInitialize={initialize} isLoading={isVaultLoading} />;
  }

  // --------------------------------------------------------------------------
  // Lifecycle Router: Locked -> Lock Screen
  // --------------------------------------------------------------------------
  if (!status?.is_unlocked) {
    return <LockScreen onUnlock={unlock} isLoading={isVaultLoading} />;
  }

  // --------------------------------------------------------------------------
  // Lifecycle Router: Unlocked -> Dashboard Viewport
  // --------------------------------------------------------------------------
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-zinc-950 text-zinc-100 font-sans">
      {/* Column 1: Navigation Sidebar */}
      <Sidebar
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        onOpenGenerator={() => {
          setTargetFieldForGen(null);
          setIsGeneratorOpen(true);
        }}
        onLock={lock}
      />

      {/* Column 2: Search & Item Header List */}
      <EntryList
        headers={headers}
        selectedId={selectedId}
        onSelectId={selectEntryById}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onAddNew={handleAddNew}
        isLoading={isListLoading}
      />

      {/* Column 3: Decrypted Detail Inspector Pane */}
      <EntryDetail
        entry={selectedEntry}
        isLoading={isDetailLoading}
        onEdit={handleEdit}
        onDelete={(id) => setDeleteCandidateId(id)}
        onToggleFavorite={toggleEntryFavorite}
        onCopy={copyToClipboard}
        copiedFieldId={copiedFieldId}
      />

      {/* Item Form Modal (Create / Edit) */}
      <EntryFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={saveEntry}
        initialEntry={editingEntry}
        onOpenGeneratorForField={handleOpenGeneratorForField}
        generatedPassword={generatedPasswordPayload}
      />

      {/* Standalone Password Generator Modal */}
      <PasswordGeneratorModal
        isOpen={isGeneratorOpen}
        onClose={() => {
          setIsGeneratorOpen(false);
          setTargetFieldForGen(null);
        }}
        onApply={targetFieldForGen ? handleApplyGeneratedPassword : undefined}
        onCopy={copyToClipboard}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteCandidateId)}
        onClose={() => setDeleteCandidateId(null)}
        title="Delete Vault Item"
        maxWidth="sm"
      >
        <div className="flex flex-col gap-4 text-left">
          <p className="text-xs text-zinc-300">
            Are you sure you want to permanently delete this item? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setDeleteCandidateId(null)}
            >
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={confirmDelete}>
              Delete Item
            </Button>
          </div>
        </div>
      </Modal>

      {/* Global Feedback Toast */}
      <Toast message={copiedMessage} />
    </div>
  );
}

export default App;
