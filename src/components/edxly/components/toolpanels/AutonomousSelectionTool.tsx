import React, { useState, useCallback, forwardRef, useImperativeHandle, useEffect, useRef, MutableRefObject } from 'react';
import {
  select,
  pointer,
} from "d3-selection";
import { drag } from "d3-drag";
import { DEFAULT_GRID_SIZE } from "@/components/edxly/constants/DrawingCanvas.constants";

interface SelectionSettings {
  selectionMode: 'single' | 'marquee';
  snapEnabled: boolean;
  gridSize: number;
}

interface AutonomousSelectionToolProps {
  selectionSettings?: SelectionSettings;
  onSelectionSettingsChange?: (settings: SelectionSettings) => void;
  selectedElementCount?: number;
  onSelectAll?: () => void;
  onDeleteSelected?: () => void;
  isVisible?: boolean;
  onClose?: () => void;
  isActive: boolean;
  canvasRef: MutableRefObject<HTMLCanvasElement | null>;
  isGridVisible?: boolean;
  onGridVisibilityChange?: (isVisible: boolean) => void;
  onGroup?: () => void;
  onUngroup?: () => void;
  isMovementXLocked?: boolean;
  isMovementYLocked?: boolean;
  onSetMovementLock?: (axis: 'x' | 'y', locked: boolean) => void;
}

export interface AutonomousSelectionToolRef {
  getSettings: () => SelectionSettings;
  setSettings: (settings: SelectionSettings) => void;
  resetToDefaults: () => void;
  show: () => void;
  hide: () => void;
  toggle: () => void;
}

export const AutonomousSelectionTool = forwardRef<AutonomousSelectionToolRef, AutonomousSelectionToolProps>(({
  selectionSettings: externalSettings,
  onSelectionSettingsChange,
  selectedElementCount = 0,
  onSelectAll,
  onDeleteSelected,
  isVisible = true,
  onClose,
  isActive,
  canvasRef,
  isGridVisible = false,
  onGridVisibilityChange,
  onGroup,
  onUngroup,
  isMovementXLocked = false,
  isMovementYLocked = false,
  onSetMovementLock
}, ref) => {
  // Default selection settings
  const defaultSettings: SelectionSettings = {
    selectionMode: 'marquee',
    snapEnabled: true,
    gridSize: 20
  };

  // Internal state management
  const [internalSettings, setInternalSettings] = useState<SelectionSettings>(defaultSettings);
  const [visible, setVisible] = useState(isVisible);
  
  // Current settings (priority: external > internal)
  const currentSettings = externalSettings || internalSettings;

  // Update visibility when prop changes
  useEffect(() => {
    setVisible(isVisible);
  }, [isVisible]);

  // Handlers
  const handleSettingsChange = useCallback((newSettings: SelectionSettings) => {
    setInternalSettings(newSettings);
    onSelectionSettingsChange?.(newSettings);
  }, [onSelectionSettingsChange]);

  const updateSetting = useCallback((key: keyof SelectionSettings, value: any) => {
    const newSettings = { ...currentSettings, [key]: value };
    handleSettingsChange(newSettings);
  }, [currentSettings, handleSettingsChange]);

  const resetToDefaults = useCallback(() => {
    handleSettingsChange(defaultSettings);
  }, [handleSettingsChange]);

  const show = useCallback(() => setVisible(true), []);
  const hide = useCallback(() => {
    setVisible(false);
    onClose?.();
  }, [onClose]);
  const toggle = useCallback(() => {
    if (visible) {
      hide();
    } else {
      show();
    }
  }, [visible, hide, show]);

  // Expose imperative methods
  useImperativeHandle(ref, () => ({
    getSettings: () => currentSettings,
    setSettings: handleSettingsChange,
    resetToDefaults,
    show,
    hide,
    toggle,
  }), [currentSettings, handleSettingsChange, resetToDefaults, show, hide, toggle]);

  if (!visible) return null;

  return (
    <div className="absolute top-20 left-6 z-50">
      <div className="bg-white/90 backdrop-blur-md rounded-lg shadow-lg p-2 max-w-[220px] text-black">
        {/* Header */}
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-xs font-bold">Selection</h3>
          <button onClick={hide} className="text-gray-400 hover:text-gray-600 text-xs" title="Close">✕</button>
        </div>

        {/* Smart Panel Content */}
        <div className="space-y-2">
          {/* Selection Info */}
          <div className="px-2 py-1 bg-gray-50 rounded text-xs text-gray-600">
            {selectedElementCount === 0
              ? "Nothing selected"
              : `${selectedElementCount} item${selectedElementCount !== 1 ? 's' : ''} selected`}
          </div>

          {/* Actions - visible when items are selected */}
          {selectedElementCount > 0 && (
            <div className="grid grid-cols-2 gap-1 pt-1 border-t border-gray-200">
              <button
                onClick={onDeleteSelected}
                className="px-2 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded"
                title="Delete (Del)"
              >
                Delete
              </button>
              <button
                onClick={onGroup}
                disabled={selectedElementCount < 2}
                className="px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 rounded disabled:bg-gray-100 disabled:text-gray-400"
                title="Group (Ctrl+G)"
              >
                Group
              </button>
              <button
                onClick={onUngroup}
                className="px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 rounded disabled:bg-gray-100 disabled:text-gray-400"
                title="Ungroup (Ctrl+Shift+G)"
              >
                Ungroup
              </button>
              <button
                onClick={onSelectAll}
                className="px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 rounded"
                title="Select All (Ctrl+A)"
              >
                Select All
              </button>
            </div>
          )}

          {/* Settings - for grid and snapping */}
          <div className="pt-1 border-t border-gray-200">
           {selectedElementCount > 0 && (
             <div className="space-y-1">
               <div className="flex justify-between items-center text-xs">
                 <label htmlFor="lock-movement-x" className="cursor-pointer">Lock Horizontal</label>
                 <input
                   type="checkbox"
                   id="lock-movement-x"
                   checked={isMovementXLocked}
                   onChange={(e) => onSetMovementLock?.('x', e.target.checked)}
                   className="w-3 h-3"
                 />
               </div>
               <div className="flex justify-between items-center text-xs">
                 <label htmlFor="lock-movement-y" className="cursor-pointer">Lock Vertical</label>
                 <input
                   type="checkbox"
                   id="lock-movement-y"
                   checked={isMovementYLocked}
                   onChange={(e) => onSetMovementLock?.('y', e.target.checked)}
                   className="w-3 h-3"
                 />
               </div>
             </div>
           )}
            <div className="flex justify-between items-center text-xs">
              <label htmlFor="show-grid" className="cursor-pointer">Show Grid</label>
              <input
                type="checkbox"
                id="show-grid"
                checked={isGridVisible}
                onChange={(e) => onGridVisibilityChange?.(e.target.checked)}
                className="w-3 h-3"
              />
            </div>
            <div className="flex justify-between items-center text-xs">
              <label htmlFor="snap-to-grid" className="cursor-pointer">Snap to Grid</label>
              <input
                type="checkbox"
                id="snap-to-grid"
                checked={currentSettings.snapEnabled}
                onChange={(e) => updateSetting('snapEnabled', e.target.checked)}
                className="w-3 h-3"
              />
            </div>
            {currentSettings.snapEnabled && (
              <div className="mt-1">
                <input
                  type="range"
                  min="5"
                  max="100"
                  step="5"
                  value={currentSettings.gridSize}
                  onChange={(e) => updateSetting('gridSize', parseInt(e.target.value))}
                  className="w-full h-1 bg-gray-200 rounded appearance-none cursor-pointer"
                  title={`Grid Size: ${currentSettings.gridSize}px`}
                />
              </div>
            )}
          </div>
          
          {/* Selection Mode */}
          <div className="pt-1 border-t border-gray-200">
             <div className="grid grid-cols-2 gap-1">
                <button
                  onClick={() => updateSetting('selectionMode', 'single')}
                  className={`px-2 py-1 text-xs rounded ${currentSettings.selectionMode === 'single' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                >
                  Single
                </button>
                <button
                  onClick={() => updateSetting('selectionMode', 'marquee')}
                  className={`px-2 py-1 text-xs rounded ${currentSettings.selectionMode === 'marquee' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                >
                  Marquee
                </button>
              </div>
          </div>

        </div>
      </div>
    </div>
  );
});

AutonomousSelectionTool.displayName = 'AutonomousSelectionTool';

export default AutonomousSelectionTool;
