import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { VaultStatus } from "./types";
import "./App.css";

function App() {
  const [status, setStatus] = useState<VaultStatus | null>(null);

  useEffect(() => {
    invoke<VaultStatus>("get_vault_status")
      .then(setStatus)
      .catch(console.error);
  }, []);

  return (
    <main className="container p-8 font-sans">
      <h1 className="text-2xl font-bold mb-4">BigKey Password Manager</h1>
      <div className="bg-slate-100 p-4 rounded text-left">
        <p className="font-semibold">Backend Core Status (Phase 4):</p>
        <p>Initialized: {status?.is_initialized ? "Yes" : "No (First setup required)"}</p>
        <p>Unlocked: {status?.is_unlocked ? "Yes" : "Locked"}</p>
      </div>
    </main>
  );
}

export default App;
