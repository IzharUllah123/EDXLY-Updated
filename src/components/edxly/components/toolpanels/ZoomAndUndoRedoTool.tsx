import React, { useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { ZoomControls } from '../../controls/ZoomControls';
import { UndoRedoControls } from '../../controls/UndoRedoControls';

interface ZoomAndUndoRedoToolProps {
  // Zoom props
  zoomLevel?: number;
  onZoomChange?: (zoomLevel: number) => void;
  minZoom?: number;
  maxZoom?: number;
  zoomStep?: number;

  // Undo/Redo props
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
}

export interface ZoomAndUndoRedoToolRef {
  // Zoom methods
  zoomIn: () => void;
  zoomOut: () => void;
  zoomToFit: () => void;
  setZoomLevel: (level: number) => void;
  getZoomLevel: () => number;

  // Undo/Redo methods
  updateUndoRedoState: (undo: boolean, redo: boolean) => void;
}

export const ZoomAndUndoRedoTool = forwardRef<ZoomAndUndoRedoToolRef, ZoomAndUndoRedoToolProps>(({
  // Zoom props
  zoomLevel = 1.0, // Default to decimal format (1.0 = 100%)
  onZoomChange,
  minZoom = 0.1, // Minimum zoom level (10%)
  maxZoom = 5.0, // Maximum zoom level (500%)
  zoomStep = 25,

  // Undo/Redo props
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo
}, ref) => {
  // Zoom state
  const [internalZoom, setInternalZoom] = useState(zoomLevel);
  const currentZoom = zoomLevel || internalZoom;

  // Undo/Redo state
  const [internalCanUndo, setInternalCanUndo] = useState(canUndo);
  const [internalCanRedo, setInternalCanRedo] = useState(canRedo);
  const currentCanUndo = canUndo !== undefined ? canUndo : internalCanUndo;
  const currentCanRedo = canRedo !== undefined ? canRedo : internalCanRedo;

  // Professional Zoom handlers with fixed 10% increments
  const handleZoomIn = useCallback(() => {
    const newZoom = currentZoom * 1.1; // Fixed 10% increment for professional zoom
    setInternalZoom(newZoom);
    onZoomChange?.(newZoom);
  }, [currentZoom, onZoomChange]);

  const handleZoomOut = useCallback(() => {
    const newZoom = currentZoom * 0.9; // Fixed 10% decrement for professional zoom
    setInternalZoom(newZoom);
    onZoomChange?.(newZoom);
  }, [currentZoom, onZoomChange]);

  const handleZoomToFit = useCallback(() => {
    const newZoom = 1.0; // Reset to 100% zoom (1.0 in decimal)
    setInternalZoom(newZoom);
    onZoomChange?.(newZoom);
  }, [onZoomChange]);

  const setZoomLevel = useCallback((level: number) => {
    const clampedZoom = Math.max(minZoom, Math.min(level, maxZoom));
    setInternalZoom(clampedZoom);
    onZoomChange?.(clampedZoom);
  }, [minZoom, maxZoom, onZoomChange]);

  // Undo/Redo handlers
  const handleUndo = useCallback(() => {
    if (currentCanUndo) {
      onUndo?.();
    }
  }, [currentCanUndo, onUndo]);

  const handleRedo = useCallback(() => {
    if (currentCanRedo) {
      onRedo?.();
    }
  }, [currentCanRedo, onRedo]);

  const updateUndoRedoState = useCallback((undo: boolean, redo: boolean) => {
    setInternalCanUndo(undo);
    setInternalCanRedo(redo);
  }, []);

  // Expose imperative methods to parent
  useImperativeHandle(ref, () => ({
    zoomIn: handleZoomIn,
    zoomOut: handleZoomOut,
    zoomToFit: handleZoomToFit,
    setZoomLevel,
    getZoomLevel: () => currentZoom,
    updateUndoRedoState,
  }), [handleZoomIn, handleZoomOut, handleZoomToFit, setZoomLevel, currentZoom, updateUndoRedoState]);

  return (
    <div className="fixed bottom-6 left-6 z-40 flex gap-2">
      <ZoomControls
        zoomLevel={Math.round(currentZoom * 100)} // Convert decimal to percentage for display
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
      />

      <UndoRedoControls
        canUndo={currentCanUndo}
        canRedo={currentCanRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
      />
    </div>
  );
});

ZoomAndUndoRedoTool.displayName = 'ZoomAndUndoRedoTool';

export default ZoomAndUndoRedoTool;
