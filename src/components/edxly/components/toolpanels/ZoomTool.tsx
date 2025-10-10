import React, { useState, useCallback, forwardRef, useImperativeHandle, useRef, useEffect } from 'react';

interface ZoomToolProps {
  zoomLevel?: number;
  onZoomChange?: (zoomLevel: number) => void;
  minZoom?: number;
  maxZoom?: number;
  zoomStep?: number;
  // New props for enhanced functionality
  canvasRef?: React.RefObject<HTMLCanvasElement>;
  scrollX?: number;
  scrollY?: number;
  onPanChange?: (scrollX: number, scrollY: number) => void;
  enableMouseCenteredZoom?: boolean;
  enableSmoothZoom?: boolean;
}

export interface ZoomToolRef {
  zoomIn: () => void;
  zoomOut: () => void;
  zoomToFit: () => void;
  setZoomLevel: (level: number) => void;
  getZoomLevel: () => number;
  // Enhanced methods
  zoomToPoint: (point: { x: number; y: number }, zoomFactor: number) => void;
  zoomToRect: (rect: { x: number; y: number; width: number; height: number }) => void;
  panTo: (x: number, y: number) => void;
  resetTransform: () => void;
}

export const ZoomTool = forwardRef<ZoomToolRef, ZoomToolProps>(({
  zoomLevel = 100,
  onZoomChange,
  minZoom = 10,
  maxZoom = 500,
  zoomStep = 25,
  canvasRef,
  scrollX = 0,
  scrollY = 0,
  onPanChange,
  enableMouseCenteredZoom = true,
  enableSmoothZoom = true,
}, ref) => {
  const [internalZoom, setInternalZoom] = useState(zoomLevel);
  const currentZoom = zoomLevel || internalZoom;
  const isZoomingRef = useRef(false);

  // Advanced zoom to point functionality with mouse-centered zooming
  const zoomToPoint = useCallback((point: { x: number; y: number }, zoomFactor: number) => {
    const newZoom = Math.max(minZoom, Math.min(zoomFactor * 100, maxZoom));

    if (canvasRef?.current && enableMouseCenteredZoom) {
      const rect = canvasRef.current.getBoundingClientRect();

      // Convert screen point to canvas coordinates (before zoom)
      const canvasX = (point.x - rect.left - scrollX) / (currentZoom / 100);
      const canvasY = (point.y - rect.top - scrollY) / (currentZoom / 100);

      // Convert canvas point to new screen coordinates (after zoom)
      const newScreenX = canvasX * (newZoom / 100) + scrollX;
      const newScreenY = canvasY * (newZoom / 100) + scrollY;

      // Calculate offset to center zoom on mouse point
      const offsetX = (point.x - rect.left) - newScreenX;
      const offsetY = (point.y - rect.top) - newScreenY;

      // Update pan position to maintain mouse-centered zoom
      onPanChange?.(scrollX + offsetX, scrollY + offsetY);
    }

    setInternalZoom(newZoom);
    onZoomChange?.(newZoom);
  }, [minZoom, maxZoom, canvasRef, scrollX, scrollY, currentZoom, enableMouseCenteredZoom, onPanChange, onZoomChange]);

  // Zoom to rectangle (fit content)
  const zoomToRect = useCallback((rect: { x: number; y: number; width: number; height: number }) => {
    if (canvasRef?.current) {
      const canvasRect = canvasRef.current.getBoundingClientRect();
      const canvasWidth = canvasRect.width;
      const canvasHeight = canvasRect.height;

      // Calculate zoom level needed to fit the rectangle
      const zoomX = (canvasWidth / rect.width) * 0.9; // 90% fit with margin
      const zoomY = (canvasHeight / rect.height) * 0.9;
      const newZoom = Math.max(minZoom, Math.min(Math.min(zoomX, zoomY) * 100, maxZoom));

      // Center the rectangle
      const centerX = rect.x + rect.width / 2;
      const centerY = rect.y + rect.height / 2;

      zoomToPoint({ x: canvasRect.left + canvasWidth / 2, y: canvasRect.top + canvasHeight / 2 }, newZoom / 100);

      // Pan to center the rectangle
      const panOffsetX = canvasRect.width / 2 - centerX;
      const panOffsetY = canvasRect.height / 2 - centerY;
      onPanChange?.(panOffsetX, panOffsetY);
    }
  }, [canvasRef, zoomToPoint, minZoom, maxZoom, onPanChange]);

  // Pan to specific coordinates
  const panTo = useCallback((x: number, y: number) => {
    onPanChange?.(x, y);
  }, [onPanChange]);

  // Reset transform to default position and zoom
  const resetTransform = useCallback(() => {
    setInternalZoom(100);
    onZoomChange?.(100);
    onPanChange?.(0, 0);
  }, [onZoomChange, onPanChange]);

  const handleZoomIn = useCallback(() => {
    const newZoom = Math.min(currentZoom + zoomStep, maxZoom);
    setInternalZoom(newZoom);
    onZoomChange?.(newZoom);
  }, [currentZoom, zoomStep, maxZoom, onZoomChange]);

  const handleZoomOut = useCallback(() => {
    const newZoom = Math.max(currentZoom - zoomStep, minZoom);
    setInternalZoom(newZoom);
    onZoomChange?.(newZoom);
  }, [currentZoom, zoomStep, minZoom, onZoomChange]);

  const handleZoomToFit = useCallback(() => {
    const newZoom = 100;
    setInternalZoom(newZoom);
    onZoomChange?.(newZoom);
    onPanChange?.(0, 0); // Also reset pan position
  }, [onZoomChange, onPanChange]);

  const setZoomLevel = useCallback((level: number) => {
    const clampedZoom = Math.max(minZoom, Math.min(level, maxZoom));
    setInternalZoom(clampedZoom);
    onZoomChange?.(clampedZoom);
  }, [minZoom, maxZoom, onZoomChange]);

  // Enhanced wheel zoom handler with mouse centering
  useEffect(() => {
    if (!canvasRef?.current || !enableMouseCenteredZoom) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      if (isZoomingRef.current) return;
      isZoomingRef.current = true;

      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = e.clientX;
      const mouseY = e.clientY;

      // Determine zoom factor based on wheel direction
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.111; // Inverse relationship with delta
      const newZoom = Math.max(minZoom / 100, Math.min(currentZoom / 100 * zoomFactor, maxZoom / 100));

      // Apply mouse-centered zoom
      zoomToPoint({ x: mouseX, y: mouseY }, newZoom);

      // Reset zooming flag after a short delay
      setTimeout(() => {
        isZoomingRef.current = false;
      }, 16); // ~60fps
    };

    const canvas = canvasRef.current;
    canvas.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, [canvasRef, enableMouseCenteredZoom, currentZoom, minZoom, maxZoom, zoomToPoint]);

  useImperativeHandle(ref, () => ({
    zoomIn: handleZoomIn,
    zoomOut: handleZoomOut,
    zoomToFit: handleZoomToFit,
    setZoomLevel,
    getZoomLevel: () => currentZoom,
    zoomToPoint,
    zoomToRect,
    panTo,
    resetTransform,
  }), [handleZoomIn, handleZoomOut, handleZoomToFit, setZoomLevel, currentZoom, zoomToPoint, zoomToRect, panTo, resetTransform]);

  return (
    <div className="bg-white/90 backdrop-blur-sm border border-gray-200/50 rounded-md shadow-md flex items-center px-1.5 py-1">
      <button
        onClick={handleZoomOut}
        className="h-6 w-6 p-0 rounded-sm hover:bg-gray-100/80 text-gray-600 transition-colors"
        title="Zoom out"
        disabled={currentZoom <= minZoom}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>

      <span className="mx-2 text-xs font-medium text-gray-700 min-w-[2.5rem] text-center">
        {currentZoom}%
      </span>

      <button
        onClick={handleZoomIn}
        className="h-6 w-6 p-0 rounded-sm hover:bg-gray-100/80 text-gray-600 transition-colors"
        title="Zoom in"
        disabled={currentZoom >= maxZoom}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>

      <div className="w-px h-4 bg-gray-300 mx-1"></div>
      <button
        onClick={handleZoomToFit}
        className="px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100/80 rounded-sm transition-colors"
        title="Zoom to fit"
      >
        Fit
      </button>
    </div>
  );
});

ZoomTool.displayName = 'ZoomTool';

export default ZoomTool;
