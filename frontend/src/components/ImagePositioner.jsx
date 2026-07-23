import { useRef, useState } from "react";

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function parsePosition(position) {
  const [x, y] = (position || "50% 50%").split(" ").map((v) => parseFloat(v));
  return { x: Number.isFinite(x) ? x : 50, y: Number.isFinite(y) ? y : 50 };
}

export default function ImagePositioner({ imageUrl, position, scale, onPositionChange, onScaleChange }) {
  const frameRef = useRef(null);
  const dragRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const { x, y } = parsePosition(position);
  const zoom = Number.isFinite(scale) ? scale : 1;

  function handlePointerDown(e) {
    if (!imageUrl) return;
    frameRef.current.setPointerCapture(e.pointerId);
    dragRef.current = { startClientX: e.clientX, startClientY: e.clientY, startX: x, startY: y };
    setDragging(true);
  }

  function handlePointerMove(e) {
    if (!dragRef.current) return;
    const rect = frameRef.current.getBoundingClientRect();
    const dx = e.clientX - dragRef.current.startClientX;
    const dy = e.clientY - dragRef.current.startClientY;
    const newX = clamp(dragRef.current.startX - (dx / rect.width) * 100, 0, 100);
    const newY = clamp(dragRef.current.startY - (dy / rect.height) * 100, 0, 100);
    onPositionChange(`${newX.toFixed(1)}% ${newY.toFixed(1)}%`);
  }

  function endDrag(e) {
    dragRef.current = null;
    setDragging(false);
    if (frameRef.current?.hasPointerCapture?.(e.pointerId)) {
      frameRef.current.releasePointerCapture(e.pointerId);
    }
  }

  function resetAll() {
    onPositionChange("50% 50%");
    onScaleChange(1);
  }

  return (
    <div className="image-positioner">
      <div
        ref={frameRef}
        className={`image-position-frame${dragging ? " dragging" : ""}${!imageUrl ? " empty" : ""}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        {imageUrl ? (
          <div
            className="image-position-photo"
            style={{
              backgroundImage: `url(${imageUrl})`,
              backgroundPosition: `${x}% ${y}%`,
              transform: `scale(${zoom})`,
              transformOrigin: `${x}% ${y}%`,
            }}
          />
        ) : (
          <span>Add a picture URL to adjust crop</span>
        )}
      </div>
      {imageUrl && (
        <div className="image-position-controls">
          <div className="image-position-zoom">
            <span className="image-position-zoom-icon">−</span>
            <input
              type="range"
              min={MIN_ZOOM}
              max={MAX_ZOOM}
              step={0.05}
              value={zoom}
              onChange={(e) => onScaleChange(parseFloat(e.target.value))}
              aria-label="Zoom"
            />
            <span className="image-position-zoom-icon">+</span>
          </div>
          <div className="image-position-actions">
            <span className="image-position-hint">Drag the photo to reposition it</span>
            <button type="button" className="btn-text" onClick={resetAll}>
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
