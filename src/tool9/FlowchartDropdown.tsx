// import "./FlowchartDropdown.css";
import "./FlowChart.css"

import { useState } from "react";
import { blueprintToElements } from "./flowchartUtils";

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

interface FlowchartDropdownProps {
  addElementsViaAction: (elements: any[]) => void;
  onClose?: () => void;
}

const FlowchartDropdown = ({ addElementsViaAction, onClose }: FlowchartDropdownProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  // 1. Add a new state to control the visibility of the component.
  const [isVisible, setIsVisible] = useState(true);

  const [open, setOpen] = useState(false); // controls dropdown state

const [openFlowSection, setOpenFlowSection] = useState(true); // default open or false, choose what you prefer
const [openGraphSection, setOpenGraphSection] = useState(false);





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
      setOpen(false);
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
      setOpen(false);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateFlowchart = () => {
    console.log("=== FLOWCHART GENERATION STARTED ===");
    setIsGenerating(true);

    try {
      console.log("Step 1: Checking addElementsViaAction function:", typeof addElementsViaAction);
      
      const centerX = 400;
      const startY = 100;

      // Helper to create element with proper structure
      const createElement = (type: string, x: number, y: number, width: number, height: number, extra: any = {}) => {
        const element = {
          type,
          x,
          y,
          width,
          height,
          angle: 0,
          strokeColor: "#000000",
          backgroundColor: "#d4a574",
          // backgroundColor:"#000",
          fillStyle: "solid",
          strokeWidth: 2,
          strokeStyle: "solid",
          roughness: 0,
          opacity: 100,
          groupIds: [],
          frameId: null,
          roundness: type === "rectangle" ? { type: 3 } : null,
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
        };
        console.log(`Created ${type} element at (${x}, ${y}):`, element);
        return element;
      };

      const createText = (text: string, x: number, y: number, width: number, height: number) => {
        const element = {
          type: "text",
          x,
          y,
          width,
          height,
          angle: 0,
          strokeColor: "#000000",
          backgroundColor: "transparent",
          fillStyle: "solid",
          strokeWidth: 2,
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
          text,
          fontSize: 16,
          fontFamily: 1,
          textAlign: "center" as const,
          verticalAlign: "middle" as const,
          baseline: height,
          containerId: null,
          originalText: text,
          lineHeight: 1.25,
          id: `text-${Date.now()}-${Math.random()}`,
        };
        console.log(`Created text "${text}" at (${x}, ${y}):`, element);
        return element;
      };

      // const createArrow = (x: number, y: number, points: number[][]) => {
      //   const element = {
      //     type: "arrow",
      //     x,
      //     y,
      //     width: Math.abs(points[points.length - 1][0] - points[0][0]),
      //     height: Math.abs(points[points.length - 1][1] - points[0][1]),
      //     angle: 0,
      //     strokeColor: "#000000",
      //     backgroundColor: "transparent",
        
      //     fillStyle: "solid",
      //     strokeWidth: 2,
      //     strokeStyle: "solid",
      //     roughness: 0,
      //     opacity: 100,
      //     groupIds: [],
      //     frameId: null,
      //     roundness: { type: 2 },
      //     seed: Math.floor(Math.random() * 1000000),
      //     version: 1,
      //     versionNonce: Math.floor(Math.random() * 1000000),
      //     isDeleted: false,
      //     boundElements: null,
      //     updated: Date.now(),
      //     link: null,
      //     locked: false,
      //     points,
      //     lastCommittedPoint: null,
      //     startBinding: null,
      //     endBinding: null,
      //     startArrowhead: null,
      //     endArrowhead: "arrow",
      //     id: `arrow-${Date.now()}-${Math.random()}`,
      //   };
      //   console.log(`Created arrow at (${x}, ${y}):`, element);
      //   return element;
      // };



      const createArrow = (x: number, y: number, points: number[][]) => {
  const element = {
    type: "arrow",
    x,
    y,
    width: Math.abs(points[points.length - 1][0] - points[0][0]),
    height: Math.abs(points[points.length - 1][1] - points[0][1]),
    angle: 0,
    strokeColor: "#000000",
    backgroundColor: "transparent",
    fillStyle: "solid",
    strokeWidth: 2,
    strokeStyle: "solid",
    roughness: 0,
    opacity: 100,
    groupIds: [],
    frameId: null,
    roundness: { type: 2 },
    seed: Math.floor(Math.random() * 1000000),
    version: 1,
    versionNonce: Math.floor(Math.random() * 1000000),
    isDeleted: false,
    boundElements: null,
    updated: Date.now(),
    link: null,
    locked: false,
    points,
    lastCommittedPoint: null,
    startBinding: null,
    endBinding: null,
    startArrowhead: null,
    endArrowhead: "arrow", // This adds the arrowhead
    id: `arrow-${Date.now()}-${Math.random()}`,
  };
  console.log(`Created arrow at (${x}, ${y}):`, element);
  return element;
};



      
      const elements: any[] = [];
      console.log("Step 2: Starting element creation...");

      // 1. Start Oval
      console.log("Creating Start oval...");
      elements.push(createElement("ellipse", centerX - 60, startY, 120, 60));
      elements.push(createText("Start", centerX - 25, startY + 18, 50, 24));

      // 2. Arrow to Read
      console.log("Creating arrow to Read...");
      elements.push(createArrow(centerX, startY + 60, [[0, 0], [0, 40]]));

      // 3. Read Rectangle
      console.log("Creating Read rectangle...");
      elements.push(createElement("rectangle", centerX - 70, startY + 100, 140, 70));
      elements.push(createText("Read\nA, B, C", centerX - 40, startY + 115, 80, 40));

      // 4. Arrow to first diamond
      console.log("Creating arrow to first diamond...");
      elements.push(createArrow(centerX, startY + 170, [[0, 0], [0, 40]]));

      // 5. Is A > B? Diamond
      console.log("Creating Is A > B diamond...");
      const diamond1Y = startY + 210;
      elements.push(createElement("diamond", centerX - 60, diamond1Y, 120, 100));
      elements.push(createText("Is\nA > B", centerX - 30, diamond1Y + 30, 60, 40));

      // 6. No label and arrow to left (Is B > C?)
      console.log("Creating left branch...");
      elements.push(createText("No", centerX - 100, diamond1Y + 40, 30, 20));
      elements.push(createArrow(centerX - 60, diamond1Y + 50, [[0, 0], [-70, 0], [-70, 80]]));

      // 7. Is B > C? Diamond (left)
      console.log("Creating Is B > C diamond...");
      const leftX = centerX - 250;
      const diamond2Y = diamond1Y + 130;
      elements.push(createElement("diamond", leftX - 60, diamond2Y, 120, 100));
      elements.push(createText("Is\nB > C", leftX - 30, diamond2Y + 30, 60, 40));

      // 8. Yes label and arrow to right (Is A > C?)
      console.log("Creating right branch...");
      elements.push(createText("Yes", centerX + 70, diamond1Y + 40, 30, 20));
      elements.push(createArrow(centerX + 60, diamond1Y + 50, [[0, 0], [70, 0], [70, 80]]));

      // 9. Is A > C? Diamond (right)
      console.log("Creating Is A > C diamond...");
      const rightX = centerX + 250;
      elements.push(createElement("diamond", rightX - 60, diamond2Y, 120, 100));
      elements.push(createText("Is\nA > C", rightX - 30, diamond2Y + 30, 60, 40));

      // 10. Print B (left)
      console.log("Creating Print B...");
      const printY = diamond2Y + 130;
      elements.push(createText("Yes", leftX - 35, diamond2Y + 105, 30, 20));
      elements.push(createArrow(leftX, diamond2Y + 100, [[0, 0], [0, 30]]));
      elements.push(createElement("rectangle", leftX - 80, printY, 160, 70));
      elements.push(createText('Print\n"B is the\nlargest"', leftX - 70, printY + 10, 140, 50));

      // 11. Print C (center)
      console.log("Creating Print C...");
      elements.push(createText("No", leftX + 65, diamond2Y + 40, 30, 20));
      elements.push(createArrow(leftX + 60, diamond2Y + 50, [[0, 0], [70, 0], [70, 80]]));
      elements.push(createText("No", rightX - 95, diamond2Y + 40, 30, 20));
      elements.push(createArrow(rightX - 60, diamond2Y + 50, [[0, 0], [-70, 0], [-70, 80]]));
      elements.push(createElement("rectangle", centerX - 80, printY, 160, 70));
      elements.push(createText('Print\n"C is the\nlargest"', centerX - 70, printY + 10, 140, 50));

      // 12. Print A (right)
      console.log("Creating Print A...");
      elements.push(createText("Yes", rightX - 35, diamond2Y + 105, 30, 20));
      elements.push(createArrow(rightX, diamond2Y + 100, [[0, 0], [0, 30]]));
      elements.push(createElement("rectangle", rightX - 80, printY, 160, 70));
      elements.push(createText('Print\n"A is the\nlargest"', rightX - 70, printY + 10, 140, 50));

      // 13. Converging arrows to Stop
      console.log("Creating converging arrows...");
      const stopY = printY + 110;
      elements.push(createArrow(leftX, printY + 70, [[0, 0], [0, 20], [centerX - leftX, 20]]));
      elements.push(createArrow(centerX, printY + 70, [[0, 0], [0, 40]]));
      elements.push(createArrow(rightX, printY + 70, [[0, 0], [0, 20], [centerX - rightX, 20]]));

      // 14. Stop Oval
      console.log("Creating Stop oval...");
      elements.push(createElement("ellipse", centerX - 60, stopY, 120, 60));
      elements.push(createText("Stop", centerX - 25, stopY + 18, 50, 24));

      console.log("Step 3: Total elements created:", elements.length);
      console.log("Step 4: All elements:", elements);
      
      console.log("Step 5: Calling addElementsViaAction with elements...");
      addElementsViaAction(elements);
      console.log("Step 6: addElementsViaAction called successfully");
      
      // Close the dropdown
      onClose?.();

    } catch (error) {
      console.error("=== ERROR IN FLOWCHART GENERATION ===");
      console.error("Error type:", error instanceof Error ? error.constructor.name : typeof error);
      console.error("Error message:", error instanceof Error ? error.message : String(error));
      console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");
      console.error("Full error object:", error);
    } finally {
      console.log("Step 7: Setting isGenerating to false");
      setIsGenerating(false);
      console.log("=== FLOWCHART GENERATION ENDED ===");
    }
  };

  // 3. Conditionally render the component based on the `isVisible` state.

const generateFlowchart3 = () => {
  console.log("=== FLOWCHART 3 GENERATION STARTED ===");
  setIsGenerating(true);

  try {
    const elements: any[] = [];

    // Starting positions
    const startX = 100;
    const startY = 200;
    const spacing = 180;

    // Helper to create element with proper structure
    const createElementLocal = (type: string, x: number, y: number, width: number, height: number, extra: any = {}) => {
      return {
        type,
        x,
        y,
        width,
        height,
        angle: 0,
        strokeColor: "#000000",
        backgroundColor: extra.backgroundColor || "#d4a574",
        fillStyle: "solid",
        strokeWidth: 2,
        strokeStyle: "solid",
        roughness: 0,
        opacity: 100,
        groupIds: [],
        frameId: null,
        roundness: type === "rectangle" ? { type: 3 } : null,
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
      };
    };

    const createTextLocal = (text: string, x: number, y: number, width: number, height: number) => {
      return {
        type: "text",
        x,
        y,
        width,
        height,
        angle: 0,
        strokeColor: "#000000",
        backgroundColor: "transparent",
        fillStyle: "solid",
        strokeWidth: 2,
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
        text,
        fontSize: 16,
        fontFamily: 1,
        textAlign: "center" as const,
        verticalAlign: "middle" as const,
        baseline: height,
        containerId: null,
        originalText: text,
        lineHeight: 1.25,
        id: `text-${Date.now()}-${Math.random()}`,
      };
    };

    // const createArrowLocal = (x: number, y: number, points: number[][]) => {
    //   return {
    //     type: "arrow",
    //     x,
    //     y,
    //     width: Math.abs(points[points.length - 1][0] - points[0][0]),
    //     height: Math.abs(points[points.length - 1][1] - points[0][1]),
    //     angle: 0,
    //     strokeColor: "#000000",
    //     backgroundColor: "transparent",
    //     fillStyle: "solid",
    //     strokeWidth: 2,
    //     strokeStyle: "solid",
    //     roughness: 0,
    //     opacity: 100,
    //     groupIds: [],
    //     frameId: null,
    //     roundness: { type: 2 },
    //     seed: Math.floor(Math.random() * 1000000),
    //     version: 1,
    //     versionNonce: Math.floor(Math.random() * 1000000),
    //     isDeleted: false,
    //     boundElements: null,
    //     updated: Date.now(),
    //     link: null,
    //     locked: false,
    //     points,
    //     lastCommittedPoint: null,
    //     startBinding: null,
    //     endBinding: null,
    //     startArrowhead: null,
    //     endArrowhead: "arrow",
    //     id: `arrow-${Date.now()}-${Math.random()}`,
    //   };
    // };

   
   const createArrowLocal = (x: number, y: number, points: number[][]) => {
  return {
    type: "arrow",
    x,
    y,
    width: Math.abs(points[points.length - 1][0] - points[0][0]),
    height: Math.abs(points[points.length - 1][1] - points[0][1]),
    angle: 0,
    strokeColor: "#000000",
    backgroundColor: "transparent",
    fillStyle: "solid",
    strokeWidth: 2,
    strokeStyle: "solid",
    roughness: 0,
    opacity: 100,
    groupIds: [],
    frameId: null,
    roundness: { type: 2 },
    seed: Math.floor(Math.random() * 1000000),
    version: 1,
    versionNonce: Math.floor(Math.random() * 1000000),
    isDeleted: false,
    boundElements: null,
    updated: Date.now(),
    link: null,
    locked: false,
    points,
    lastCommittedPoint: null,
    startBinding: null,
    endBinding: null,
    startArrowhead: null,
    endArrowhead: "arrow", // Arrowhead enabled
    id: `arrow-${Date.now()}-${Math.random()}`,
  };
};
   
   
   
    // Row 1: Start (Blue)
    const startBox = createElementLocal("rectangle", startX, startY, 140, 70, {
      backgroundColor: "#a1cedfff",
    });
    elements.push(startBox);
    elements.push(createTextLocal("Start", startX + 10, startY + 20, 120, 30));

    // Arrow 1
    elements.push(createArrowLocal(startX + 140, startY + 35, [[0, 0], [40, 0]]));

    // Row 1: Profile/Workflows (Yellow)
    const profileBox = createElementLocal("rectangle", startX + 180, startY, 140, 70, {
      backgroundColor: "#fafcafff",
    });
    elements.push(profileBox);
    elements.push(createTextLocal("Profile/Workflows", startX + 190, startY + 25, 120, 20));

    // Arrow 2
    elements.push(createArrowLocal(startX + 320, startY + 35, [[0, 0], [40, 0]]));

    // Row 1: Process (Yellow)
    const processBox1 = createElementLocal("rectangle", startX + 360, startY, 140, 70, {
      backgroundColor: "#fcf96dff",
    });
    elements.push(processBox1);
    elements.push(createTextLocal("Process", startX + 390, startY + 25, 80, 20));

    // Arrow 3 to Decision
    elements.push(createArrowLocal(startX + 500, startY + 35, [[0, 0], [100, 0]]));

    // Decision Diamond (Black)
    const decisionX = startX + 600;
    const decisionY = startY - 20;
    const diamond = createElementLocal("diamond", decisionX, decisionY, 110, 110, {
      backgroundColor: "#f38f8fff",
    });
    elements.push(diamond);
    elements.push(createTextLocal("Decision", decisionX + 20, decisionY + 40, 70, 30));

    // Top branch - "Yes" arrow to Process (Purple)
    elements.push(createTextLocal("Yes", decisionX + 50, decisionY - 35, 30, 20));
    elements.push(createArrowLocal(decisionX + 55, decisionY, [[0, 0], [0, -80], [80, -80]]));

    const processTopY = startY - 120;
    const processTop1 = createElementLocal("rectangle", decisionX + 135, processTopY, 140, 70, {
      backgroundColor: "#8787c9ff",
    });
    elements.push(processTop1);
    elements.push(createTextLocal("Process", decisionX + 165, processTopY + 25, 80, 20));

    // Arrow from top Process to another Process (Purple)
    elements.push(createArrowLocal(decisionX + 275, processTopY + 35, [[0, 0], [60, 0]]));

    const processTop2 = createElementLocal("rectangle", decisionX + 335, processTopY, 140, 70, {
      backgroundColor: "#8787c9ff",
    });
    elements.push(processTop2);
    elements.push(createTextLocal("Process", decisionX + 365, processTopY + 25, 80, 20));

    // Arrow down from second purple process to End
    const endX = decisionX + 335;
    const endY = startY;
    elements.push(createArrowLocal(endX + 70, processTopY + 70, [[0, 0], [0, endY - processTopY - 70]]));

    // End Box (Blue)
    const endBox = createElementLocal("rectangle", endX, endY, 140, 70, {
      backgroundColor: "#7add71ff",
    });
    elements.push(endBox);
    elements.push(createTextLocal("End", endX + 50, endY + 25, 40, 20));

   
    // Right branch - "No" arrow to Process (Orange)
    elements.push(createTextLocal("No", decisionX + 120, decisionY + 40, 30, 20));
    elements.push(createArrowLocal(decisionX + 110, decisionY + 55, [[0, 0], [80, 0]]));

    const processRightX = decisionX + 190;
    const processRight = createElementLocal("rectangle", processRightX, startY, 140, 70, {
      backgroundColor: "#448bbbff",
    });
    elements.push(processRight);
    elements.push(createTextLocal("Process", processRightX + 30, startY + 25, 80, 20));

    // Arrow down from orange process
    const bottomY = startY + 120;
    elements.push(createArrowLocal(processRightX + 70, startY + 70, [[0, 0], [0, 50]]));

    // Bottom Process (Orange)
    const processBottom1 = createElementLocal("rectangle", processRightX, bottomY, 140, 70, {
      backgroundColor: "#ff9f4d",
    });
    elements.push(processBottom1);
    elements.push(createTextLocal("Process", processRightX + 30, bottomY + 25, 80, 20));

    // Arrow left from bottom process
    elements.push(createArrowLocal(processRightX, bottomY + 35, [[0, 0], [-60, 0]]));

    // Bottom left Process (Orange)
    const processBottom2 = createElementLocal("rectangle", processRightX - 200, bottomY, 140, 70, {
      backgroundColor: "#37c21bff",
    });
    elements.push(processBottom2);
    elements.push(createTextLocal("Process", processRightX - 170, bottomY + 25, 80, 20));

    // Arrow up and left back to Process (Yellow) - creating the loop
// Arrow straight up from green process to bottom of Decision
const loopStartX = processRightX - 130;
const loopStartY = bottomY;
elements.push(createArrowLocal(loopStartX, loopStartY, [
  [0, 0],
  [0, -(bottomY - (decisionY + 110))]  // Straight up to bottom of decision diamond
]));

    console.log("Total elements created:", elements.length);
    addElementsViaAction(elements);
    setOpen(false);
    onClose?.();

  } catch (error) {
    console.error("Error generating flowchart 3:", error);
  } finally {
    setIsGenerating(false);
  }
};



  if (!isVisible) {
    return null;
  }    
    
return (
  <div className="ffd-container">
    {/* Dropdown options always visible */}
    <div className="ffd-options" id="ffd-dropdown" role="menu">
      {/* SECTION HEADER: Flowcharts (collapsible) */}
      <div className="ffd-section">
        <button
          className="ffd-section-header"
          onClick={() => {
            setOpenFlowSection(!openFlowSection);
            // if you want only one section open at a time, uncomment:
            // setOpenGraphSection(false);
          }}
          aria-expanded={openFlowSection}
          aria-controls="ffd-flow-list"
        >
          <span className="ffd-section-title">FLOWCHARTS</span>
          <span className="ffd-section-caret">{openFlowSection ? "▾" : "▸"}</span>
        </button>

        {/* Flowcharts children */}
        {openFlowSection && (
          <div id="ffd-flow-list" className="ffd-section-children" role="group">
            <button
              onClick={generateFlowchart}
              disabled={isGenerating}
              className={`ffd-option-btn ffd-generate ${isGenerating ? "ffd-disabled" : ""}`}
            >
              {isGenerating ? "Generating..." : "Flowchart 1"}
            </button>

            <button
              onClick={generateFlowchart3}
              disabled={isGenerating}
              className={`ffd-option-btn ffd-generate  ${isGenerating ? "ffd-disabled" : ""}`}
            >
              {isGenerating ? "Generating..." : "Flowchart 2"}
            </button>
          </div>
        )}
      </div>

      {/* SECTION HEADER: Graphs (collapsible) */}
      <div className="ffd-section">
        <button
          className="ffd-section-header"
          onClick={() => {
            setOpenGraphSection(!openGraphSection);
            // if you want only one section open at a time, uncomment:
            // setOpenFlowSection(false);
          }}
          aria-expanded={openGraphSection}
          aria-controls="ffd-graph-list"
        >
          <span className="ffd-section-title">GRAPHS</span>
          <span className="ffd-section-caret">{openGraphSection ? "▾" : "▸"}</span>
        </button>

        {/* Graph children */}
        {openGraphSection && (
          <div id="ffd-graph-list" className="ffd-section-children" role="group">
            <button
              onClick={generate14x14Grid}
              disabled={isGenerating}
              className={`ffd-option-btn ffd-graph ${isGenerating ? "ffd-disabled" : ""}`}
            >
              {isGenerating ? "Generating..." : "14×14 Blank"}
            </button>

            <button
              onClick={generate7x7Axes}
              disabled={isGenerating}
              className={`ffd-option-btn ffd-graph-axes ${isGenerating ? "ffd-disabled" : ""}`}
            >
              {isGenerating ? "Generating..." : "14×14 Axis"}
            </button>
          </div>
        )}
      </div>
    </div>
  </div>
);





};



// Add this function inside your FlowchartDropdown component, after generateFlowchart()


















export default FlowchartDropdown;
