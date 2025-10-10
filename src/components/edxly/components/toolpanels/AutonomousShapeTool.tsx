import React, { useState, useCallback, forwardRef, useImperativeHandle, useEffect } from 'react';
import { ShapeSettings } from '../../types/DrawingCanvas.types';

interface AutonomousShapeToolProps {
  shapeSettings?: ShapeSettings;
  onShapeSettingsChange?: (settings: ShapeSettings) => void;
  startPoint?: { x: number; y: number };
  mousePosition?: { x: number; y: number };
  isVisible?: boolean;
  onClose?: () => void;
}

export interface AutonomousShapeToolRef {
  getSettings: () => ShapeSettings;
  setSettings: (settings: ShapeSettings) => void;
  resetToDefaults: () => void;
  show: () => void;
  hide: () => void;
  toggle: () => void;
  getSizeReadout: () => string | null;
}

export const AutonomousShapeTool = forwardRef<AutonomousShapeToolRef, AutonomousShapeToolProps>(({
  shapeSettings: externalSettings,
  onShapeSettingsChange,
  startPoint,
  mousePosition,
  isVisible = true,
  onClose
}, ref) => {
  // Default shape settings
  const defaultSettings: ShapeSettings = {
    selectedShape: 'rectangle',
    strokeWidth: 2,
    cornerRadius: 10,
    sides: 6,
    points: 5,
  };

  // Internal state management
  const [internalSettings, setInternalSettings] = useState<ShapeSettings>(defaultSettings);
  const [visible, setVisible] = useState(isVisible);

  // Current settings (priority: external > internal)
  const currentSettings = externalSettings || internalSettings;

  // Update visibility when prop changes
  useEffect(() => {
    setVisible(isVisible);
  }, [isVisible]);

  // Handlers
  const handleSettingsChange = useCallback((newSettings: ShapeSettings) => {
    setInternalSettings(newSettings);
    onShapeSettingsChange?.(newSettings);
  }, [onShapeSettingsChange]);

  const updateSetting = useCallback((key: keyof ShapeSettings, value: any) => {
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

  const getSizeReadout = useCallback(() => {
    if (!startPoint || !mousePosition) return null;
    const width = Math.abs(mousePosition.x - startPoint.x);
    const height = Math.abs(mousePosition.y - startPoint.y);
    return Math.round(width) + " × " + Math.round(height);
  }, [startPoint, mousePosition]);

  // Expose imperative methods
  useImperativeHandle(ref, () => ({
    getSettings: () => currentSettings,
    setSettings: handleSettingsChange,
    resetToDefaults,
    show,
    hide,
    toggle,
    getSizeReadout,
  }), [currentSettings, handleSettingsChange, resetToDefaults, show, hide, toggle, getSizeReadout]);

  if (!visible) return null;

  return (
    <>
      {/* Main Shape Settings Panel */}
      <div className="absolute top-20 left-6 z-50">
        <div className="bg-white/90 backdrop-blur-md rounded-lg shadow-lg p-4 max-w-xs">
          {/* Close button */}
          <div className="flex justify-end mb-2">
            <button
              onClick={hide}
              className="text-gray-400 hover:text-gray-600 text-sm"
              title="Close shape settings"
            >
              ✕
            </button>
          </div>

          <div className="space-y-3">
            {/* Shape Selector */}
            <div>
              <label className="block text-sm font-medium text-black mb-1">Shape</label>
              <select
                value={currentSettings.selectedShape}
                onChange={(e) => updateSetting('selectedShape', e.target.value as ShapeSettings['selectedShape'])}
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                aria-label="Select shape type"
              >
                <option value="rectangle">Rectangle</option>
                <option value="rounded-rectangle">Rounded Rectangle</option>
                <option value="ellipse">Ellipse</option>
                <option value="circle">Circle</option>
                <option value="line">Line</option>
                <option value="polygon">Polygon</option>
                <option value="star">Star</option>
              </select>
            </div>


            {/* Stroke Width */}
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Stroke Width: {currentSettings.strokeWidth}
              </label>
              <input
                type="range"
                min="1"
                max="20"
                value={currentSettings.strokeWidth}
                onChange={(e) => updateSetting('strokeWidth', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded appearance-none cursor-pointer"
                aria-label="Stroke width"
              />
            </div>

            {/* Shape-specific parameters */}
            {(currentSettings.selectedShape === 'rounded-rectangle' ||
              currentSettings.selectedShape === 'polygon' ||
              currentSettings.selectedShape === 'star') && (
              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  {currentSettings.selectedShape === 'rounded-rectangle' ? 'Corner Radius' :
                   currentSettings.selectedShape === 'polygon' ? 'Sides' : 'Points'}:
                  {currentSettings.selectedShape === 'rounded-rectangle' ? currentSettings.cornerRadius :
                   currentSettings.selectedShape === 'polygon' ? currentSettings.sides : currentSettings.points}
                </label>
                <input
                  type="range"
                  min={currentSettings.selectedShape === 'rounded-rectangle' ? 0 :
                       currentSettings.selectedShape === 'polygon' ? 3 : 3}
                  max={currentSettings.selectedShape === 'rounded-rectangle' ? 50 :
                       currentSettings.selectedShape === 'polygon' ? 20 : 10}
                  value={currentSettings.selectedShape === 'rounded-rectangle' ? currentSettings.cornerRadius :
                         currentSettings.selectedShape === 'polygon' ? currentSettings.sides : currentSettings.points}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    if (currentSettings.selectedShape === 'rounded-rectangle') {
                      updateSetting('cornerRadius', value);
                    } else if (currentSettings.selectedShape === 'polygon') {
                      updateSetting('sides', value);
                    } else {
                      updateSetting('points', value);
                    }
                  }}
                  className="w-full h-2 bg-gray-200 rounded appearance-none cursor-pointer"
                  aria-label={`${currentSettings.selectedShape} parameter`}
                />
              </div>
            )}

            {/* Reset button */}
            <div className="pt-2 border-t border-gray-200">
              <button
                onClick={resetToDefaults}
                className="w-full px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
              >
                Reset to Defaults
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Size Readout */}
      {startPoint && mousePosition && getSizeReadout() && (
        <div className="fixed top-32 left-6 bg-black/80 text-white px-3 py-1 rounded text-sm font-mono z-50">
          {getSizeReadout()}
        </div>
      )}
    </>
  );
});

AutonomousShapeTool.displayName = 'AutonomousShapeTool';

export default AutonomousShapeTool;
