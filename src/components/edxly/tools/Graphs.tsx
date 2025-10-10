import { useState } from "react";

interface GraphTemplatesProps {
  addElementsViaAction: (elements: any[]) => void;
}

const GraphTemplates = ({ addElementsViaAction }: GraphTemplatesProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const createElement = (type: string, x: number, y: number, width: number, height: number, extra: any = {}) => ({
    type,
    x,
    y,
    width,
    height,
    angle: 0,
    strokeColor: "#000000",
    backgroundColor: "transparent",
    fillStyle: "solid",
    strokeWidth: 1,
    strokeStyle: "solid",
    roughness: 0,
    opacity: 100,
    groupIds: [],
    frameId: null,
    roundness: null,
    seed: Math.floor(Math.random() * 1000000),
    version: 1,
    versionNonce: Math.floor(Math.random() * 1000000),
    isDeleted: false,
    boundElements: null,
    updated: Date.now(),
    link: null,
    locked: false,
    id: `element-${Date.now()}-${Math.random()}`,
    ...extra,
  });

  // Generate 14x14 grid template
  const generate14x14Grid = () => {
    setIsGenerating(true);
    try {
      const elements: any[] = [];
      const startX = 100;
      const startY = 100;
      const cellSize = 30;
      const rows = 14;
      const cols = 14;

      // Create grid lines - vertical
      for (let i = 0; i <= cols; i++) {
        elements.push(
          createElement("line", startX + i * cellSize, startY, 0, rows * cellSize, {
            points: [[0, 0], [0, rows * cellSize]],
          })
        );
      }

      // Create grid lines - horizontal
      for (let i = 0; i <= rows; i++) {
        elements.push(
          createElement("line", startX, startY + i * cellSize, cols * cellSize, 0, {
            points: [[0, 0], [cols * cellSize, 0]],
          })
        );
      }

      addElementsViaAction(elements);
      setIsVisible(false);
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate 14x14 axes template
  const generate7x7Axes = () => {
    setIsGenerating(true);
    try {
      const elements: any[] = [];
      const centerX = 300;
      const centerY = 300;
      const cellSize = 30;
      const gridSize = 14;
      const halfGrid = Math.floor(gridSize / 2);

      // Create vertical grid lines
      for (let i = -halfGrid; i <= halfGrid; i++) {
        elements.push(
          createElement("line", centerX + i * cellSize, centerY - halfGrid * cellSize, 0, gridSize * cellSize, {
            points: [[0, 0], [0, gridSize * cellSize]],
            strokeWidth: i === 0 ? 2 : 1,
            strokeColor: i === 0 ? "#000000" : "#cccccc",
          })
        );
      }

      // Create horizontal grid lines
      for (let i = -halfGrid; i <= halfGrid; i++) {
        elements.push(
          createElement("line", centerX - halfGrid * cellSize, centerY + i * cellSize, gridSize * cellSize, 0, {
            points: [[0, 0], [gridSize * cellSize, 0]],
            strokeWidth: i === 0 ? 2 : 1,
            strokeColor: i === 0 ? "#000000" : "#cccccc",
          })
        );
      }

      // Add arrows for axes
      const arrowSize = 15;
      
      // X-axis arrow (right)
      elements.push(
        createElement("line", centerX + halfGrid * cellSize, centerY, arrowSize, 0, {
          type: "arrow",
          points: [[0, 0], [arrowSize, 0]],
          strokeWidth: 2,
          endArrowhead: "arrow",
        })
      );

      // Y-axis arrow (up)
      elements.push(
        createElement("line", centerX, centerY - halfGrid * cellSize, 0, -arrowSize, {
          type: "arrow",
          points: [[0, 0], [0, -arrowSize]],
          strokeWidth: 2,
          endArrowhead: "arrow",
        })
      );

      // X-axis arrow (left)
      elements.push(
        createElement("line", centerX - halfGrid * cellSize, centerY, -arrowSize, 0, {
          type: "arrow",
          points: [[0, 0], [-arrowSize, 0]],
          strokeWidth: 2,
          endArrowhead: "arrow",
        })
      );

      // Y-axis arrow (down)
      elements.push(
        createElement("line", centerX, centerY + halfGrid * cellSize, 0, arrowSize, {
          type: "arrow",
          points: [[0, 0], [0, arrowSize]],
          strokeWidth: 2,
          endArrowhead: "arrow",
        })
      );

      addElementsViaAction(elements);
      setIsVisible(false);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div style={{ padding: "1rem" }}>
      <button
        onClick={generate14x14Grid}
        disabled={isGenerating}
        style={{
          padding: "0.5rem 1rem",
          backgroundColor: "#6baed6",
          color: "#ffffff",
          border: "none",
          cursor: isGenerating ? "not-allowed" : "pointer",
          fontSize: "14px",
          fontWeight: "bold",
          marginBottom: "0.5rem",
          width: "100%",
        }}
      >
        {isGenerating ? "Generating..." : "14×14 Blank Grid"}
      </button>

      <button
        onClick={generate7x7Axes}
        disabled={isGenerating}
        style={{
          padding: "0.5rem 1rem",
          backgroundColor: "#b39ddb",
          color: "#ffffff",
          border: "none",
          cursor: isGenerating ? "not-allowed" : "pointer",
          fontSize: "14px",
          fontWeight: "bold",
          width: "100%",
        }}
      >
        {isGenerating ? "Generating..." : "14×14 Axes Grid"}
      </button>
    </div>
  );
};

export default GraphTemplates;