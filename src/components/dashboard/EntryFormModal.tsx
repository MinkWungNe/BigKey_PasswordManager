// ============================================================================
// File: EntryFormModal.tsx
// Description: Interactive modal form creating or updating vault entries with
//              custom field dynamic templates, generator integration, and validation
//              styled with Neutral Monochromatic glassmorphism.
// ============================================================================

import React, { useEffect, useState } from "react";
import { Plus, Trash2, Sparkles } from "lucide-react";
import { CustomField, FieldType, VaultEntry } from "../../types";
import { Modal } from "../common/Modal";
import { Input } from "../common/Input";
import { Button } from "../common/Button";

export interface EntryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: VaultEntry, isNew: boolean) => Promise<boolean>;
  initialEntry?: VaultEntry | null;
  onOpenGeneratorForField: (fieldId: string) => void;
  generatedPassword?: { fieldId: string; value: string } | null;
}

// ----------------------------------------------------------------------------
// 1. EntryFormModal
// - Renders form for creating or modifying dynamic entries and custom fields.
//
// Args:
//   - isOpen: Modal visibility trigger.
//   - onClose: Callback closing the modal.
//   - onSave: Callback persisting item changes.
//   - initialEntry: Existing item data when editing or null when creating.
//   - onOpenGeneratorForField: Callback launching generator for specific password field.
//   - generatedPassword: Newly assigned password payload from generator modal.
//
// Return:
//   - JSX.Element | null: Rendered form modal.
// ----------------------------------------------------------------------------
export const EntryFormModal: React.FC<EntryFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialEntry,
  onOpenGeneratorForField,
  generatedPassword,
}) => {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>("login");
  const [fields, setFields] = useState<CustomField[]>([]);
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --------------------------------------------------------------------------
  // Initialize default template fields based on active category
  // --------------------------------------------------------------------------
  const getTemplateFields = (cat: string): CustomField[] => {
    switch (cat) {
      case "login":
        return [
          { id: "username", label: "Username / Email", field_type: "text", value: "" },
          { id: "password", label: "Password", field_type: "concealed", value: "" },
          { id: "url", label: "Website URL", field_type: "url", value: "" },
        ];
      case "card":
        return [
          { id: "cardholder", label: "Cardholder Name", field_type: "text", value: "" },
          { id: "card_number", label: "Card Number", field_type: "concealed", value: "" },
          { id: "expiry", label: "Expiry Date (MM/YY)", field_type: "text", value: "" },
          { id: "cvv", label: "Security Code (CVV)", field_type: "concealed", value: "" },
        ];
      case "note":
        return [];
      default:
        return [{ id: "field_1", label: "Custom Field", field_type: "text", value: "" }];
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (initialEntry) {
        setTitle(initialEntry.title);
        setCategory(initialEntry.category);
        setFields([...initialEntry.fields]);
        setNotes(initialEntry.notes || "");
      } else {
        setTitle("");
        setCategory("login");
        setFields(getTemplateFields("login"));
        setNotes("");
      }
      setError(null);
    }
  }, [isOpen, initialEntry]);

  // Sync password injected from generator modal
  useEffect(() => {
    if (generatedPassword) {
      setFields((prev) =>
        prev.map((f) =>
          f.id === generatedPassword.fieldId ? { ...f, value: generatedPassword.value } : f
        )
      );
    }
  }, [generatedPassword]);

  const handleCategoryChange = (newCat: string) => {
    setCategory(newCat);
    if (!initialEntry) {
      setFields(getTemplateFields(newCat));
    }
  };

  const handleFieldChange = (id: string, value: string) => {
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, value } : f)));
  };

  const handleLabelChange = (id: string, label: string) => {
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, label } : f)));
  };

  const handleTypeChange = (id: string, field_type: FieldType) => {
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, field_type } : f)));
  };

  const handleAddField = () => {
    const newId = `field_${Date.now()}`;
    setFields((prev) => [
      ...prev,
      { id: newId, label: "Custom Field", field_type: "text", value: "" },
    ]);
  };

  const handleRemoveField = (id: string) => {
    setFields((prev) => prev.filter((f) => f.id !== id));
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Item Title is required.");
      return;
    }

    setIsSaving(true);
    setError(null);

    const now = Math.floor(Date.now() / 1000);
    const entryPayload: VaultEntry = {
      id: initialEntry ? initialEntry.id : crypto.randomUUID(),
      title: title.trim(),
      category,
      is_favorite: initialEntry ? initialEntry.is_favorite : false,
      fields,
      notes: notes.trim() || undefined,
      created_at: initialEntry ? initialEntry.created_at : now,
      updated_at: now,
    };

    const success = await onSave(entryPayload, !initialEntry);
    setIsSaving(false);
    if (success) {
      onClose();
    } else {
      setError("Failed to save entry. Please verify inputs.");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialEntry ? "Edit Vault Item" : "New Vault Item"}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5 text-left">
        {/* Title and Category */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              label="Item Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Google Account, Master Card"
              autoFocus
              required
            />
          </div>

          <div className="flex flex-col gap-1.5 w-full sm:w-44">
            <label className="text-xs font-medium text-zinc-400 light:text-zinc-600">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="bg-zinc-900/80 light:bg-white border border-zinc-700 light:border-zinc-300 rounded-xl px-3 py-2 text-sm text-zinc-100 light:text-zinc-900 focus:outline-none focus:border-zinc-400 light:focus:border-zinc-800 cursor-pointer"
            >
              <option value="login">Login</option>
              <option value="card">Credit Card</option>
              <option value="note">Secure Note</option>
              <option value="custom">Custom</option>
            </select>
          </div>
        </div>

        {/* Dynamic Fields Section */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-zinc-800 light:border-zinc-200 pb-1">
            <span className="text-[11px] font-semibold text-zinc-400 light:text-zinc-500 uppercase tracking-wider">
              Fields
            </span>
            <button
              type="button"
              onClick={handleAddField}
              className="flex items-center gap-1 text-xs text-zinc-300 light:text-zinc-700 hover:text-white light:hover:text-zinc-950 cursor-pointer font-medium transition-colors"
            >
              <Plus size={14} />
              <span>Add Custom Field</span>
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {fields.map((field) => (
              <div
                key={field.id}
                className="p-3.5 bg-zinc-950/60 light:bg-zinc-100/70 border border-zinc-800/80 light:border-zinc-300/80 rounded-2xl flex flex-col gap-2 shadow-2xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <input
                    type="text"
                    value={field.label}
                    onChange={(e) => handleLabelChange(field.id, e.target.value)}
                    placeholder="Field Label"
                    className="bg-transparent text-xs font-semibold text-zinc-300 light:text-zinc-700 focus:outline-none focus:text-white light:focus:text-zinc-950"
                  />

                  <div className="flex items-center gap-2">
                    <select
                      value={field.field_type}
                      onChange={(e) =>
                        handleTypeChange(field.id, e.target.value as FieldType)
                      }
                      className="bg-zinc-900 light:bg-white border border-zinc-700 light:border-zinc-300 rounded-lg px-2 py-0.5 text-[11px] text-zinc-300 light:text-zinc-700 focus:outline-none cursor-pointer"
                    >
                      <option value="text">Text</option>
                      <option value="concealed">Concealed (Password/PIN)</option>
                      <option value="url">URL</option>
                    </select>

                    {field.field_type === "concealed" && (
                      <button
                        type="button"
                        onClick={() => onOpenGeneratorForField(field.id)}
                        aria-label="Generate password for this field"
                        className="p-1 rounded-md text-zinc-300 light:text-zinc-700 hover:text-white light:hover:text-zinc-950 hover:bg-zinc-800 light:hover:bg-white light:hover:shadow-xs transition-colors cursor-pointer"
                        title="Generate password for this field"
                      >
                        <Sparkles size={14} />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleRemoveField(field.id)}
                      aria-label="Remove field"
                      className="p-1 rounded-md text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Remove field"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <Input
                  type={field.field_type === "concealed" ? "password" : "text"}
                  isPassword={field.field_type === "concealed"}
                  value={field.value}
                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                  placeholder={`Enter ${field.label.toLowerCase()}`}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Notes Textarea */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-zinc-400 light:text-zinc-600">
            Secure Notes (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Add confidential notes or recovery instructions..."
            className="w-full bg-zinc-900/60 light:bg-white border border-zinc-800 light:border-zinc-300 rounded-xl p-3 text-sm text-zinc-100 light:text-zinc-900 placeholder-zinc-500 light:placeholder-zinc-400 focus:outline-none focus:border-zinc-400 light:focus:border-zinc-800 font-sans"
          />
        </div>

        {error && <div className="text-xs text-rose-400 bg-rose-500/10 p-2.5 rounded-xl">{error}</div>}

        {/* Form Actions */}
        <div className="flex justify-end gap-2.5 pt-2 border-t border-zinc-800 light:border-zinc-200">
          <Button type="button" variant="secondary" size="sm" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isSaving}>
            {initialEntry ? "Save Changes" : "Create Item"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
