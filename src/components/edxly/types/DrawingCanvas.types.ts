export interface Point {
  x: number;
  y: number;
  pressure?: number;
}

export interface Transform {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

export interface ShapeData {
  startPoint?: Point;
  endPoint?: Point;
  width?: number;
  height?: number;
  sides?: number;
  points?: number;
  cornerRadius?: number;
}

export interface ConnectorData {
  startElementId?: string;
  endElementId?: string;
  startPoint: Point;
  endPoint: Point;
  type: 'straight' | 'orthogonal' | 'curved';
  label?: string;
  arrowHead: 'none' | 'arrow' | 'circle' | 'diamond';
  strokeWidth: number;
  strokeColor: string;
  dashPattern: number[];
}

export interface DrawingElement {
  id: string;
  type: 'path' | 'group' | 'shape' | 'flowchart' | 'chart' | 'text';
  path?: Point[];
  children?: string[];
  strokeColor?: string;
  strokeWidth?: number;
  fillColor?: string;
  transform?: Transform;
  opacity?: number;
  cap?: 'round' | 'square';
  join?: 'round' | 'miter' | 'bevel';
  dashPattern?: number[];
  shapeType?: 'rectangle' | 'rounded-rectangle' | 'ellipse' | 'circle' | 'line' | 'polygon' | 'star';
  shapeData?: ShapeData;
  flowchartType?: 'start' | 'end' | 'process' | 'decision' | 'data';
  chartType?: 'bar' | 'line' | 'pie';
  text?: string;
  fontSize?: number;
  chartData?: any[];
  position?: Point;
  size?: { width: number; height: number };
  selectable?: boolean;
  textType?: 'simple' | 'colorful';
  gradientType?: 'blue' | 'purple' | 'green' | 'orange' | 'pink' | 'teal';
  lockMovementX?: boolean;
  lockMovementY?: boolean;
  evented?: boolean;
}

export interface SelectionHandle {
  id: string;
  type: 'corner' | 'edge' | 'rotation';
  position: Point;
  cursor: string;
}

export interface PenSettings {
  strokeWidth: number;
  smoothing: number;
  pressureEnabled: boolean;
  mode: 'vector' | 'raster';
  cap: 'round' | 'square';
  join: 'round' | 'miter' | 'bevel';
  dashPattern: number[];
  stabilizerLevel: number;
  strokeStyle: 'solid' | 'dashed' | 'dotted';
  roughness: number;
}

export interface EraserSettings {
  mode: 'stroke' | 'pixel' | 'object';
  size: number;
  pressureEnabled: boolean;
  previewEnabled: boolean;
}

export interface PanSettings {
  panSpeedMultiplier: number;
  enableInertia: boolean;
}

export interface ShapeSettings {
  selectedShape: 'rectangle' | 'rounded-rectangle' | 'ellipse' | 'circle' | 'line' | 'polygon' | 'star';
  strokeWidth: number;
  cornerRadius: number;
  sides: number; // for polygon
  points: number; // for star
}

export interface DrawingCanvasProps {
  activeTool?: string;
  strokeColor?: string;
  strokeWidth?: number;
  onColorChange?: (color: string) => void;
  panSettings?: PanSettings;
  isSinglePageMode?: boolean;
  penSettings?: PenSettings;
  onPenSettingsChange?: (settings: PenSettings) => void;
  onUndo?: (canUndo: boolean) => void;
  onRedo?: (canRedo: boolean) => void;
  onUndoAction?: () => void;
  onRedoAction?: () => void;
  zoomLevel?: number;
  onZoomChange?: (zoomLevel: number) => void;
  forwardedRef?: React.MutableRefObject<{
    undo: () => void;
    redo: () => void;
    handleImageUpload: (file: File) => void;
    placeEmoji: (emoji: string, position: { x: number; y: number }) => void;
    placeGraph: () => void;
    placeFlowchartShape: (shapeType: 'oval' | 'rectangle' | 'diamond') => void;
    activateSelectionTool: () => void;
    addElementsViaAction: (elements: any[]) => void;
  } | null>;
  textMode?: 'simple' | 'colorful' | null;
  onImageUpload?: (file: File) => void;
  onEmojiPlace?: (emoji: string) => void;
  onGraphPlace?: () => void;
  isDarkMode?: boolean;
  selectedEmoji?: string | null;
  onEmojiPlaced?: () => void;
  onShapeSelect?: (shape: 'rectangle' | 'ellipse' | 'polygon' | 'line') => void;
  shapeColor?: string;
}

export interface ImageElement {
  id: string;
  data: string;
  position: Point;
  size: { width: number; height: number };
  selected: boolean;
  img?: HTMLImageElement;
}
