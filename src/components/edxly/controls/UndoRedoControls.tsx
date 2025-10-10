import { Undo2, Redo2 } from "lucide-react";

interface UndoRedoControlsProps {
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
}

export const UndoRedoControls = ({
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo
}: UndoRedoControlsProps) => {
  return (
    <div className="bg-white/90 backdrop-blur-sm border border-gray-200/50 rounded-md shadow-md flex items-center px-1 py-1 gap-0.5">
      <button
        className={`h-6 w-6 p-0 rounded-sm flex items-center justify-center transition-colors ${
          canUndo
            ? "hover:bg-gray-100/80 text-gray-600"
            : "text-gray-300 cursor-not-allowed"
        }`}
        onClick={() => onUndo?.()}
        disabled={!canUndo}
        title="Undo"
      >
        <Undo2 className="h-3 w-3" />
      </button>

      <button
        className={`h-6 w-6 p-0 rounded-sm flex items-center justify-center transition-colors ${
          canRedo
            ? "hover:bg-gray-100/80 text-gray-600"
            : "text-gray-300 cursor-not-allowed"
        }`}
        onClick={() => onRedo?.()}
        disabled={!canRedo}
        title="Redo"
      >
        <Redo2 className="h-3 w-3" />
      </button>
    </div>
  );
};
