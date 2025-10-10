import React, { useState, useCallback, forwardRef, useImperativeHandle, useEffect } from 'react';
import { PenSettings } from '../../types/DrawingCanvas.types';

interface AutonomousPenToolProps {
  penSettings?: PenSettings;
  onPenSettingsChange?: (settings: PenSettings) => void;
  isVisible?: boolean;
  onClose?: () => void;
}

export interface AutonomousPenToolRef {
  getSettings: () => PenSettings;
  setSettings: (settings: PenSettings) => void;
  resetToDefaults: () => void;
  show: () => void;
  hide: () => void;
  toggle: () => void;
}

export const AutonomousPenTool = forwardRef<AutonomousPenToolRef, AutonomousPenToolProps>(({
  penSettings: externalSettings,
  onPenSettingsChange,
  isVisible = true,
  onClose
}, ref) => {
  // Default pen settings
  const defaultSettings: PenSettings = {
    strokeWidth: 2,
    smoothing: 0.08, // Raster default
    pressureEnabled: true,
    mode: 'raster',
    cap: 'round',
    join: 'round',
    dashPattern: [],
    stabilizerLevel: 1,
    strokeStyle: 'solid',
    roughness: 0
  };

  const [internalSettings, setInternalSettings] = useState<PenSettings>(defaultSettings);
  const [visible, setVisible] = useState(isVisible);
  const [sliderValue, setSliderValue] = useState(30); // Default to raster

  const [isDragging, setIsDragging] = useState(false);

  // Current settings
  const currentSettings = externalSettings || internalSettings;

  // Update from props only when not dragging
  useEffect(() => {
    if (externalSettings && !isDragging) {
      setInternalSettings(externalSettings);
      setSliderValue(getSliderValueFromSmoothing(externalSettings.smoothing));
    }
  }, [externalSettings]);

  // Update visibility when prop changes
  useEffect(() => {
    setVisible(isVisible);
  }, [isVisible]);

  // Initialize on visibility change
  useEffect(() => {
    if (visible) {
      setInternalSettings(defaultSettings);
      setSliderValue(30);
    }
  }, [visible]);

  // Calculate slider value from smoothing (0.08 to 0.25 = 30 to 100)
  const getSliderValueFromSmoothing = (smoothing: number): number => {
    return Math.round(((smoothing - 0.08) / 0.17) * 70 + 30);
  };

  // Calculate smoothing from slider value
  const getSmoothnessFromValue = (value: number): number => {
    const normalized = (value - 30) / 70;
    return 0.08 + (normalized * 0.17);
  };

  // Handlers
  const handleSettingsChange = useCallback((newSettings: PenSettings) => {
    setInternalSettings(newSettings);
    onPenSettingsChange?.(newSettings);
  }, [onPenSettingsChange]);

  const handleStrokeWidthChange = useCallback((width: number) => {
    const newSettings = { ...currentSettings, strokeWidth: width };
    handleSettingsChange(newSettings);
  }, [currentSettings, handleSettingsChange]);

  const handlePressureToggle = useCallback(() => {
    const newSettings = { ...currentSettings, pressureEnabled: !currentSettings.pressureEnabled };
    handleSettingsChange(newSettings);
  }, [currentSettings, handleSettingsChange]);

  const handleGraceSliderDown = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleGraceSliderUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleGraceSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setSliderValue(value);
    const newSmoothing = getSmoothnessFromValue(value);
    const newMode: 'raster' | 'vector' = value >= 65 ? 'vector' : 'raster';
    const newSettings = {
      ...currentSettings,
      mode: newMode,
      smoothing: newSmoothing
    };
    handleSettingsChange(newSettings);
  }, [currentSettings, handleSettingsChange]);

  const resetToDefaults = useCallback(() => {
    handleSettingsChange(defaultSettings);
    setSliderValue(30);
  }, [handleSettingsChange]);

  const show = useCallback(() => setVisible(true), []);
  const hide = useCallback(() => {
    setVisible(false);
    setIsDragging(false);
    onClose?.();
  }, [onClose]);
  const toggle = useCallback(() => {
    if (visible) {
      hide();
    } else {
      show();
    }
  }, [visible, hide]);

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
    <div className="absolute top-16 left-4 z-60">
      <div className="bg-white rounded border p-3 shadow max-w-xs">
        <div className="text-center space-y-3">
          {/* Close button */}
          <div className="flex justify-end">
            <button
              onClick={hide}
              className="text-gray-400 hover:text-gray-600 text-sm"
              title="Close pen settings"
            >
              ✕
            </button>
          </div>

          {/* Stroke Width Slider with Preset Options */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-medium">Stroke</span>
              <span className="text-xs text-gray-500">{currentSettings.strokeWidth}</span>
            </div>

            {/* Preset stroke width buttons */}
            <div className="grid grid-cols-5 gap-1 mb-2">
              {[2, 4, 6, 8, 12].map((width) => (
                <button
                  key={width}
                  onClick={() => handleStrokeWidthChange(width)}
                  className={`px-2 py-1 text-xs rounded border transition-all ${
                    currentSettings.strokeWidth === width
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 bg-white hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  {width}
                </button>
              ))}
            </div>

            {/* Slider for fine control */}
            <input
              type="range"
              min="1"
              max="20"
              step="1"
              value={currentSettings.strokeWidth}
              onChange={(e) => handleStrokeWidthChange(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-300 rounded appearance-none cursor-pointer"
            />
          </div>

          {/* Grace Slider */}
          <div className="pt-3 border-t border-gray-200">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-medium">Grace</span>
              <span className="text-xs text-gray-500">
                {currentSettings.mode === 'raster' ? 'Raster' : 'Vector'}
              </span>
            </div>
            <div className="relative">
              <input
                type="range"
                min="30"
                max="100"
                step="1"
                value={sliderValue}
                onMouseDown={handleGraceSliderDown}
                onMouseUp={handleGraceSliderUp}
                className="w-full h-2 bg-gray-300 rounded cursor-pointer"
                onChange={handleGraceSliderChange}
                style={{
                  background: 'linear-gradient(to right, #10B981 0%, #10B981 30%, #F59E0B 30%, #F59E0B 100%)'
                }}
              />
            </div>
          </div>

          {/* Basic Pressure Toggle */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-200">
            <span className="text-xs">Pressure</span>
            <input
              type="checkbox"
              checked={currentSettings.pressureEnabled}
              onChange={handlePressureToggle}
              className="w-3 h-3"
            />
          </div>

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
  );
});

AutonomousPenTool.displayName = 'AutonomousPenTool';

export default AutonomousPenTool;
