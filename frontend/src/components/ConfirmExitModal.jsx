import { useEffect } from "react";

export default function ConfirmExitModal({ onKeepEditing, onDiscard, onSave }) {
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") onKeepEditing();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onKeepEditing]);

  return (
    <div className="modal-overlay" onClick={onKeepEditing}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Unsaved changes</h2>
          <button type="button" className="modal-close" onClick={onKeepEditing} aria-label="Keep editing">
            ✕
          </button>
        </div>

        <p>You've made changes to this recipe. Save them before leaving?</p>

        <div className="modal-footer">
          <button type="button" className="btn" onClick={onKeepEditing}>
            Keep editing
          </button>
          <button type="button" className="btn btn-danger" onClick={onDiscard}>
            Exit without saving
          </button>
          <button type="button" className="btn btn-primary" onClick={onSave}>
            Save and exit
          </button>
        </div>
      </div>
    </div>
  );
}
