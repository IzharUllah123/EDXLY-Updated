import React from 'react';
import { CANVAS_BACKGROUNDS } from '../../constants/DrawingCanvas.constants';

interface BackgroundPanelProps {
  onBackgroundChange: (backgroundColor: string) => void;
}

export const BackgroundPanel: React.FC<BackgroundPanelProps> = ({
  onBackgroundChange
}) => {
  return (
    <div className="absolute top-20 left-6 z-60">
      <style dangerouslySetInnerHTML={{
        __html: `
          .CanvasBackgroundContainer {
            background: white;
            border: 1px solid rgba(0,0,0,0.1);
            border-radius: 8px;
            padding: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            min-width: 120px;
          }

          .CanvasBackgroundOption {
            width: 32px;
            height: 32px;
            margin: 4px;
            border: 2px solid transparent;
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.15s ease;
          }

          .CanvasBackgroundOption:hover {
            border-color: #4285f4;
            transform: scale(1.1);
          }
        `
      }} />

      <div className="CanvasBackgroundContainer">
        <div className="text-xs font-semibold text-gray-800 mb-2">Background</div>
        <div className="flex flex-wrap">
          {CANVAS_BACKGROUNDS.map((bg) => (
            <button
              key={bg.color}
              className="CanvasBackgroundOption"
              style={{ backgroundColor: bg.color }}
              title={bg.name + ' Background'}
              onClick={() => onBackgroundChange(bg.color)}
              aria-label={`Change background to ${bg.name}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default BackgroundPanel;
