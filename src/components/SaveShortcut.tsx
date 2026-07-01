"use client";

import { CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";

export default function SaveShortcut() {
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isSave = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s";

      if (!isSave) return;

      event.preventDefault();
      setShowToast(true);

      window.setTimeout(() => {
        setShowToast(false);
      }, 1400);
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  if (!showToast) return null;

  return (
    <div className="fixed bottom-10 right-4 z-50 flex items-center gap-2 panel-bg border app-border text-white px-4 py-2 rounded-lg shadow-lg text-sm">
      <CheckCircle size={16} className="text-green-400" />
      Saved locally
    </div>
  );
}
