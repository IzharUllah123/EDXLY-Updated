import React, { useState, useCallback, forwardRef, useImperativeHandle } from 'react';

interface UndoRedoToolProps {
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
}

export interface UndoRedoToolRef {
  updateUndoRedoState: (undo: boolean, redo: boolean) => void;
}

export const UndoRedoTool = forwardRef<UndoRedoToolRef, UndoRedoToolProps>(({
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo
}, ref) => {
  const [internalCanUndo, setInternalCanUndo] = useState(canUndo);
  const [internalCanRedo, setInternalCanRedo] = useState(canRedo);
  const currentCanUndo = canUndo !== undefined ? canUndo : internalCanUndo;
  const currentCanRedo = canRedo !== undefined ? canRedo : internalCanRedo;

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

  useImperativeHandle(ref, () => ({
    updateUndoRedoState,
  }), [updateUndoRedoState]);

  return (
    <div className="bg-white/90 backdrop-blur-sm border border-gray-200/50 rounded-md shadow-md flex items-center px-1 py-1 gap-0.5">
      <button
        onClick={handleUndo}
        className={`h-6 w-6 p-0 rounded-sm transition-colors ${
          currentCanUndo
            ? "hover:bg-gray-100/80 text-gray-600"
            : "text-gray-300 cursor-not-allowed"
        }`}
        disabled={!currentCanUndo}
        title="Undo (Ctrl+Z)"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 7v6h6"></path>
          <path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13"></path>
        </svg>
      </button>

      <button
        onClick={handleRedo}
        className={`h-6 w-6 p-0 rounded-sm transition-colors ${
          currentCanRedo
            ? "hover:bg-gray-100/80 text-gray-600"
            : "text-gray-300 cursor-not-allowed"
        }`}
        disabled={!currentCanRedo}
        title="Redo (Ctrl+Y)"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 7v6h-6"></path>
          <path d="M3 17a9 9 0 019-9 9 9 0 006 2.3L21 13"></path>
        </svg>
      </button>
    </div>
  );
});

UndoRedoTool.displayName = 'UndoRedoTool';

export default UndoRedoTool;
