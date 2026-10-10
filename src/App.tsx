// ============================================================================
// File: App.tsx
// Description: Central application coordinator orchestrating lifecycle views
//              (Setup, Lock, Dashboard, Settings), dual theme management,
//              clipboard feedback, and background activity sync.
// ============================================================================

import { useState, useRef, useEffect } from "react";
import { VaultEntry } from "./types";
import { useVault } from "./hooks/useVault";
import { useEntries } from "./hooks/useEntries";
import { useSecureClipboard } from "./hooks/useSecureClipboard";
import { useActivityTracker } from "./hooks/useActivityTracker";
import { useTheme } from "./hooks/useTheme";

import { SetupScreen } from "./components/auth/SetupScreen";
import { LockScreen } from "./components/auth/LockScreen";
import { Sidebar } from "./components/dashboard/Sidebar";
import { EntryList } from "./components/dashboard/EntryList";
import { EntryDetail } from "./components/dashboard/EntryDetail";
import { SettingsView } from "./components/dashboard/SettingsView";
import { EntryFormModal } from "./components/dashboard/EntryFormModal";
import { PasswordGeneratorModal } from "./components/generator/PasswordGeneratorModal";
import { TitleBar } from "./components/common/TitleBar";
import { Toast } from "./components/common/Toast";
import { Modal } from "./components/common/Modal";
import { Button } from "./components/common/Button";

// ----------------------------------------------------------------------------
// 1. App
// - Top-level coordinator routing lifecycle states, themes, and bridging security hooks.
//
// Args:
//   - None.
//
// Return:
//   - JSX.Element: Root application interface tree.
// ----------------------------------------------------------------------------
export function App() {
  // Step 1. Initialize visual theme manager (Dark / Light)
  const { theme, setTheme } = useTheme();

  // Step 2. Initialize lifecycle and session hooks
  const { status, isLoading: isVaultLoading, initialize, unlock, lock } = useVault();
  const isUnlocked = Boolean(status?.is_initialized && status?.is_unlocked);

  // Step 3. Attach throttled activity listener for auto-lock reset
  useActivityTracker(isUnlocked);

  // Step 4. Secure clipboard hook with 30s auto-clear & mobile resume detection
  const { copiedFieldId, copiedMessage, copyToClipboard } = useSecureClipboard();

  // Step 5. Search input reference for Ctrl+F fast focus
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Step 6. Initialize entries management state
  const {
    headers,
    counts,
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

  // View & Modal Dialog States
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<VaultEntry | null>(null);

  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [targetFieldForGen, setTargetFieldForGen] = useState<string | null>(null);
  const [generatedPasswordPayload, setGeneratedPasswordPayload] = useState<{
    fieldId: string;
    value: string;
  } | null>(null);

  const [deleteCandidateId, setDeleteCandidateId] = useState<string | null>(null);

  // Resize Splitter States
  const [sidebarWidth, setSidebarWidth] = useState<number>(224);
  const [entryListWidth, setEntryListWidth] = useState<number>(320);
  const [isResizingSidebar, setIsResizingSidebar] = useState<boolean>(false);
  const [isResizingList, setIsResizingList] = useState<boolean>(false);

  useEffect(() => {
    if (!isResizingSidebar && !isResizingList) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingSidebar) {
        const newWidth = Math.min(Math.max(e.clientX, 160), 340);
        setSidebarWidth(newWidth);
      } else if (isResizingList) {
        const newWidth = Math.min(Math.max(e.clientX - sidebarWidth, 230), 480);
        setEntryListWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizingSidebar(false);
      setIsResizingList(false);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizingSidebar, isResizingList, sidebarWidth]);

  // Step 7. Global Keyboard Shortcuts: Ctrl+F (Search), Ctrl+N (New Item), Ctrl+L (Lock Vault)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrl = e.ctrlKey || e.metaKey;
      if (!isCtrl) return;

      if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        if (isUnlocked) {
          setIsSettingsOpen(false);
          searchInputRef.current?.focus();
          searchInputRef.current?.select();
        }
      } else if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        if (isUnlocked) {
          setIsSettingsOpen(false);
          handleAddNew();
        }
      } else if (e.key === "l" || e.key === "L") {
        e.preventDefault();
        if (isUnlocked) {
          lock();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isUnlocked, lock]);

  const handleSelectCategory = (cat: string) => {
    setIsSettingsOpen(false);
    setSelectedCategory(cat);
  };

  const handleSelectEntry = (id: string) => {
    setIsSettingsOpen(false);
    selectEntryById(id);
  };

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

  const handleApplyGeneratedPassword = (pwd: string) => {
    if (targetFieldForGen) {
      setGeneratedPasswordPayload({
        fieldId: targetFieldForGen,
        value: pwd,
      });
      setTargetFieldForGen(null);
      setIsGeneratorOpen(false);
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
      <div className="flex flex-col h-screen w-screen overflow-hidden bg-zinc-950 light:bg-zinc-100">
        <TitleBar />
        <div className="flex-1 flex items-center justify-center text-zinc-400 text-xs">
          Initializing secure environment...
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // Lifecycle Router: Uninitialized -> Setup Screen
  // --------------------------------------------------------------------------
  if (!status?.is_initialized) {
    return (
      <div className="flex flex-col h-screen w-screen overflow-hidden bg-zinc-950 light:bg-zinc-100">
        <TitleBar />
        <div className="flex-1 overflow-auto">
          <SetupScreen onInitialize={initialize} isLoading={isVaultLoading} />
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // Lifecycle Router: Locked -> Lock Screen
  // --------------------------------------------------------------------------
  if (!status?.is_unlocked) {
    return (
      <div className="flex flex-col h-screen w-screen overflow-hidden bg-zinc-950 light:bg-zinc-100">
        <TitleBar />
        <div className="flex-1 overflow-auto">
          <LockScreen onUnlock={unlock} isLoading={isVaultLoading} />
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // Lifecycle Router: Unlocked -> Dashboard Viewport
  // --------------------------------------------------------------------------
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-zinc-950 light:bg-zinc-100 text-zinc-100 light:text-zinc-900 font-sans transition-colors duration-200">
      <TitleBar />
      <div className="flex flex-1 overflow-hidden">
        {/* Column 1: Navigation Sidebar */}
        <Sidebar
          width={sidebarWidth}
          selectedCategory={selectedCategory}
          onSelectCategory={handleSelectCategory}
          onOpenGenerator={() => {
            setTargetFieldForGen(null);
            setIsGeneratorOpen(true);
          }}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onLock={lock}
          isSettingsActive={isSettingsOpen}
          counts={counts}
        />

        {/* Resizer Splitter 1: Between Sidebar and EntryList */}
        <div
          onMouseDown={() => setIsResizingSidebar(true)}
          className={`relative w-[3px] -mx-[1.5px] cursor-col-resize select-none shrink-0 z-20 group hover:w-[5px] hover:-mx-[2.5px] transition-all duration-150 ${
            isResizingSidebar
              ? "w-[5px] -mx-[2.5px] bg-zinc-400 dark:bg-zinc-400 light:bg-zinc-600 shadow-sm"
              : "bg-transparent hover:bg-zinc-600/80 dark:hover:bg-zinc-600/80 light:hover:bg-zinc-400"
          }`}
          title="Drag to resize sidebar"
        />

        {/* Column 2: Search & Item Header List */}
        <EntryList
          width={entryListWidth}
          headers={headers}
          selectedId={selectedId}
          onSelectId={handleSelectEntry}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onAddNew={handleAddNew}
          isLoading={isListLoading}
          searchInputRef={searchInputRef}
        />

        {/* Resizer Splitter 2: Between EntryList and Detail/Settings Pane */}
        <div
          onMouseDown={() => setIsResizingList(true)}
          className={`relative w-[3px] -mx-[1.5px] cursor-col-resize select-none shrink-0 z-20 group hover:w-[5px] hover:-mx-[2.5px] transition-all duration-150 ${
            isResizingList
              ? "w-[5px] -mx-[2.5px] bg-zinc-400 dark:bg-zinc-400 light:bg-zinc-600 shadow-sm"
              : "bg-transparent hover:bg-zinc-600/80 dark:hover:bg-zinc-600/80 light:hover:bg-zinc-400"
          }`}
          title="Drag to resize item list"
        />

        {/* Column 3: Decrypted Detail Inspector Pane OR Full-height Settings View */}
        {isSettingsOpen ? (
          <SettingsView
            theme={theme}
            onThemeChange={setTheme}
            onClose={() => setIsSettingsOpen(false)}
          />
        ) : (
          <EntryDetail
            entry={selectedEntry}
            isLoading={isDetailLoading}
            onEdit={handleEdit}
            onDelete={(id) => setDeleteCandidateId(id)}
            onToggleFavorite={toggleEntryFavorite}
            onCopy={copyToClipboard}
            copiedFieldId={copiedFieldId}
          />
        )}
      </div>

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
          <p className="text-xs text-zinc-300 light:text-zinc-600 leading-relaxed">
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
