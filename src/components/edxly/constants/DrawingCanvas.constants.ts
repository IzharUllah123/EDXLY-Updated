// Canvas limits and constraints
export const CANVAS_MAX_PAN = 2000;
export const CANVAS_MIN_SCALE = 0.1;
export const CANVAS_MAX_SCALE = 5.0;

// Mouse and gesture settings
export const CANVAS_PAN_SPEED = 0.15;
export const DOUBLE_CLICK_THRESHOLD = 300; // ms
export const NUDGE_DISTANCE_BASE = 1;
export const NUDGE_DISTANCE_ALT = 10;

// Drawing settings
export const MIN_STROKE_WIDTH = 0.5;
export const MAX_STROKE_WIDTH = 20;
export const MIN_PRESSURE_WIDTH = 0.5;

// Smoothing and curve settings
export const MIN_DISTANCE_BETWEEN_POINTS = 2;
export const MAX_DISTANCE_FOR_SMOOTHING = 15;
export const ERASER_RADIUS_FACTOR = 0.5;

// Grid and snapping
export const DEFAULT_GRID_SIZE = 20;

// Shape defaults
export const DEFAULT_CORNER_RADIUS = 8;
export const DEFAULT_POLYGON_SIDES = 6;
export const DEFAULT_STAR_POINTS = 5;
export const DEFAULT_ELLIPSE_POINTS = 64;

// Animation and redraw settings
export const ANIMATION_FRAME_SKIP_DURING_PAN = 1;

// Tool panel positioning
export const TOOL_PANEL_TOP_OFFSET = 20;
export const TOOL_PANEL_LEFT_OFFSET = 6;

// Font settings for text notes
export const SIMPLE_TEXT_FONT = '400 14px Helvetica, Arial, sans-serif';
export const COLORFUL_TEXT_FONT = '500 16px Helvetica, Arial, sans-serif';

// Resize handle settings
export const HANDLE_SIZE = 8;
export const HANDLE_OFFSET = 20;

// Tool cursors
export const CURSOR_STYLES = {
  hand: 'grab',
  selection: 'pointer',
  pencil: "url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTggMlYxNEwxNCA4TDEyIDEwYzAtMi0yLTItMi0xLjNzLjctMiAyLTEuNnoiIGZpbGw9IiMwMDAiIG9wYWNpdHk9IjAuNyIvPgo8L3N2Zz4='), crosshair",
  eraser: "url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3QgeD0iOCIgeT0iOCIgd2lkdGg9IjgiIGhlaWdodD0iOCIgZmlsbD0iIzk5OSIgfjVwYWNpdHk9IjAuOCIgc3Ryb2tlPSIjMzMzIiBzdHJva2Utd2lkdGg9IjAuNSIvPgo8L3N2Zz4='), pointer",
  text: 'text',
  sticky: 'pointer',
  emoji: 'pointer',
  shapes: 'crosshair',
  graph: 'pointer',
  default: 'crosshair',
} as const;

// Background colors for canvas
export const CANVAS_BACKGROUNDS = [
  { color: '#ffffff', name: 'White' },
  { color: '#e3f2fd', name: 'Blue' },
  { color: '#e8f5e8', name: 'Green' },
  { color: '#fffde7', name: 'Yellow' },
  { color: '#fce4ec', name: 'Pink' },
] as const;

// Graph settings
export const GRAPH_GRID_SPACING = 20;
export const GRAPH_DIMENSIONS = { width: 400, height: 300 };

// Keyboard shortcuts
export const KEYBOARD_SHORTCUTS = {
  undo: ['Ctrl+Z', 'Cmd+Z'],
  redo: ['Ctrl+Y', 'Cmd+Y'],
  eraserSizeUp: [']'],
  eraserSizeDown: ['['],
  penModeToggle: ['P'],
  shapes: {
    rectangle: 'R',
    ellipse: 'E',
    circle: 'C',
    line: 'L',
  },
} as const;
