import { useEffect, useState } from "react";
import ImagePositioner from "./ImagePositioner";

export default function ImageAdjustModal({ imageUrl, initialPosition, initialScale, onCancel, onSave }) {
  const [position, setPosition] = useState(initialPosition || "50% 50%");
  const [scale, setScale] = useState(initialScale || 1);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Adjust photo</h2>
          <button type="button" className="modal-close" onClick={onCancel} aria-label="Cancel">
            ✕
          </button>
        </div>

        <ImagePositioner
          imageUrl={imageUrl}
          position={position}
          scale={scale}
          onPositionChange={setPosition}
          onScaleChange={setScale}
        />

        <div className="modal-footer">
          <button type="button" className="btn" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={() => onSave(position, scale)}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
