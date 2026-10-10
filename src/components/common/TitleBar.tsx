// ============================================================================
// File: TitleBar.tsx
// Description: Custom frameless desktop window title bar with drag region,
//              double-click maximize, and native window control buttons.
// ============================================================================

import React, { useEffect, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Minus, Square, Copy, X, Shield } from "lucide-react";

export interface TitleBarProps {
  title?: string;
}

// ----------------------------------------------------------------------------
// 1. TitleBar
// - Desktop window frame providing window movement and minimize/maximize/close.
// ----------------------------------------------------------------------------
export const TitleBar: React.FC = () => {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    const initWindow = async () => {
      try {
        const appWindow = getCurrentWindow();
        setIsMaximized(await appWindow.isMaximized());
        unlisten = await appWindow.onResized(async () => {
          setIsMaximized(await appWindow.isMaximized());
        });
      } catch (err) {
        // Fallback for non-tauri or test environments
        console.warn("TitleBar: Tauri window API unavailable", err);
      }
    };
    initWindow();
    return () => {
      if (unlisten) unlisten();
    };
  }, []);

  const handleMinimize = async () => {
    try {
      await getCurrentWindow().minimize();
    } catch (err) {
      console.warn("Minimize error", err);
    }
  };

  const handleToggleMaximize = async () => {
    try {
      const appWindow = getCurrentWindow();
      const maximized = await appWindow.isMaximized();
      if (maximized) {
        await appWindow.unmaximize();
        setIsMaximized(false);
      } else {
        await appWindow.maximize();
        setIsMaximized(true);
      }
    } catch (err) {
      console.warn("Toggle maximize error", err);
    }
  };

  const handleClose = async () => {
    try {
      await getCurrentWindow().close();
    } catch (err) {
      console.warn("Close error", err);
    }
  };

  const handleMouseDown = async (e: React.MouseEvent) => {
    // Only respond to primary left click
    if (e.button !== 0) return;

    // Do nothing if clicked on a button or inside one
    if ((e.target as HTMLElement).closest("button")) return;

    try {
      const appWindow = getCurrentWindow();
      if (e.detail === 2) {
        // Double-click detected: explicitly toggle maximize
        const maximized = await appWindow.isMaximized();
        if (maximized) {
          await appWindow.unmaximize();
          setIsMaximized(false);
        } else {
          await appWindow.maximize();
          setIsMaximized(true);
        }
      } else if (e.detail === 1) {
        // Single-click detected: start dragging window
        await appWindow.startDragging();
      }
    } catch (err) {
      console.warn("TitleBar mouse interaction error", err);
    }
  };

  return (
    <div
      onMouseDown={handleMouseDown}
      className="h-8 w-full bg-zinc-950/85 dark:bg-zinc-950/85 light:bg-zinc-100/90 border-b border-zinc-800/80 dark:border-zinc-800/80 light:border-zinc-200/80 flex items-center justify-between select-none shrink-0 z-50 backdrop-blur-md transition-colors duration-200 cursor-default"
    >
      {/* Left Branding / Title */}
      <div className="flex items-center gap-2 pl-3 select-none pointer-events-none">
        <Shield size={14} className="text-zinc-300 dark:text-zinc-300 light:text-zinc-700 pointer-events-none" />
        <span className="text-xs tracking-wide select-none pointer-events-none">
          <strong className="font-bold text-white dark:text-white light:text-zinc-950">
            BigKey
          </strong>
          <span className="font-normal text-zinc-400 dark:text-zinc-400 light:text-zinc-600">
            {" "}
            - One Key for All
          </span>
        </span>
      </div>

      {/* Center Drag Region */}
      <div className="flex-1 h-full pointer-events-none" />

      {/* Right Window Control Buttons */}
      <div className="flex items-center h-full pointer-events-auto">
        {/* Minimize Button */}
        <button
          type="button"
          onClick={handleMinimize}
          aria-label="Minimize Window"
          title="Minimize"
          className="w-11 h-8 flex items-center justify-center text-zinc-400 dark:text-zinc-400 hover:text-zinc-100 dark:hover:text-zinc-100 light:text-zinc-500 light:hover:text-zinc-950 hover:bg-zinc-800/80 dark:hover:bg-zinc-800/80 light:hover:bg-zinc-200/80 transition-colors cursor-pointer"
        >
          <Minus size={13} />
        </button>

        {/* Maximize / Restore Button */}
        <button
          type="button"
          onClick={handleToggleMaximize}
          aria-label={isMaximized ? "Restore Window" : "Maximize Window"}
          title={isMaximized ? "Restore" : "Maximize"}
          className="w-11 h-8 flex items-center justify-center text-zinc-400 dark:text-zinc-400 hover:text-zinc-100 dark:hover:text-zinc-100 light:text-zinc-500 light:hover:text-zinc-950 hover:bg-zinc-800/80 dark:hover:bg-zinc-800/80 light:hover:bg-zinc-200/80 transition-colors cursor-pointer"
        >
          {isMaximized ? <Copy size={11} className="rotate-180" /> : <Square size={11} />}
        </button>

        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close Window"
          title="Close"
          className="w-11 h-8 flex items-center justify-center text-zinc-400 dark:text-zinc-400 hover:text-white dark:hover:text-white light:text-zinc-500 light:hover:text-white hover:bg-rose-600 dark:hover:bg-rose-600 light:hover:bg-rose-600 transition-colors cursor-pointer"
        >
          <X size={13} />
        </button>
      </div>
    </div>
  );
};
