// src/utils/flowchartUtils.ts
// Drop-in replacement — improved anchors, edge labels, and draw order.

type NodeBlueprint = {
  id: string;
  type: "rectangle" | "ellipse" | "diamond" | "text";
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string;
  style?: { backgroundColor?: string; strokeColor?: string; roundness?: any };
};

type EdgeBlueprint = {
  id: string;
  from: string;
  to: string;
  points?: number[][];
  label?: string;
};

let _counter = 0;
const uid = (prefix = "e") => `${prefix}-${Date.now()}-${++_counter}`;

const createBase = (type: string, x: number, y: number, w: number, h: number, extra: any = {}) => ({
  type,
  x,
  y,
  width: w,
  height: h,
  angle: 0,
  strokeColor: "#000000",
  backgroundColor: "#d4a574",
  fillStyle: "solid",
  strokeWidth: 2,
  strokeStyle: "solid",
  roughness: 0,
  opacity: 100,
  groupIds: [],
  frameId: null,
  roundness: type === "rectangle" ? { type: 3 } : null,
  seed: Math.floor(Math.random() * 1_000_000),
  version: 1,
  versionNonce: Math.floor(Math.random() * 1_000_000),
  isDeleted: false,
  boundElements: null,
  updated: Date.now(),
  link: null,
  locked: false,
  id: uid(type),
  ...extra,
});

const textElem = (text: string, x: number, y: number, w: number, h: number) =>
  createBase("text", x, y, w, h, {
    backgroundColor: "transparent",
    text,
    fontSize: 14,
    fontFamily: 1,
    textAlign: "center",
    verticalAlign: "middle",
    baseline: Math.max(12, h * 0.8),
    originalText: text,
    lineHeight: 1.25,
    id: uid("text"),
  });

// ---- geometry helpers ----
// get center of node
const centerOf = (n: NodeBlueprint) => [n.x + n.width / 2, n.y + n.height / 2] as [number, number];

// compute intersection of line from p0 (center) to p1 (target) with rectangle border
function rectBorderIntersection(n: NodeBlueprint, targetX: number, targetY: number) {
  const cx = n.x + n.width / 2;
  const cy = n.y + n.height / 2;
  const dx = targetX - cx;
  const dy = targetY - cy;
  if (Math.abs(dx) < 1e-6 && Math.abs(dy) < 1e-6) {
    // degenerate — return center
    return [cx, cy];
  }
  const hx = n.width / 2;
  const hy = n.height / 2;

  // compute t where cx + dx * t hits vertical/horizontal boundary
  const tx = dx !== 0 ? hx / Math.abs(dx) : Infinity;
  const ty = dy !== 0 ? hy / Math.abs(dy) : Infinity;
  const t = Math.min(tx, ty);
  const ix = cx + dx * t;
  const iy = cy + dy * t;
  return [ix, iy];
}

// diamond intersection — diamond is polygon with points top,right,bottom,left
function diamondBorderIntersection(n: NodeBlueprint, targetX: number, targetY: number) {
  const cx = n.x + n.width / 2;
  const cy = n.y + n.height / 2;
  const halfW = n.width / 2;
  const halfH = n.height / 2;
  const poly = [
    [cx, cy - halfH], // top
    [cx + halfW, cy], // right
    [cx, cy + halfH], // bottom
    [cx - halfW, cy], // left
  ];

  // line from center to target: param eq p(t) = (cx,cy) + t*(dx,dy), t>=0
  const dx = targetX - cx;
  const dy = targetY - cy;
  if (Math.abs(dx) < 1e-6 && Math.abs(dy) < 1e-6) return [cx, cy];

  // check intersection with each segment of polygon
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const intersect = lineSegmentIntersection([cx, cy], [targetX, targetY], a, b);
    if (intersect) return intersect;
  }
  // fallback to center
  return [cx, cy];
}

// general line-segment intersection helper
function lineSegmentIntersection(p1: number[], p2: number[], p3: number[], p4: number[]) {
  const [x1, y1] = p1;
  const [x2, y2] = p2;
  const [x3, y3] = p3;
  const [x4, y4] = p4;
  const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
  if (Math.abs(denom) < 1e-9) return null; // parallel
  const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
  const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;
  // ua gives point on p1->p2, ub on p3->p4
  if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
    return [x1 + ua * (x2 - x1), y1 + ua * (y2 - y1)];
  }
  return null;
}

// get border point on node towards target (handles rectangle/diamond/ellipse fallback)
function borderPointTowards(node: NodeBlueprint, targetX: number, targetY: number) {
  if (node.type === "rectangle") return rectBorderIntersection(node, targetX, targetY);
  if (node.type === "diamond") return diamondBorderIntersection(node, targetX, targetY);
  // ellipse & others -> approximate with rectangle border
  return rectBorderIntersection(node, targetX, targetY);
}

// compute perpendicular offset for edge label placement
function perpOffset(a: number[], b: number[], distance = 12) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  // normalized perpendicular: (-dy/len, dx/len)
  return [(-dy / len) * distance, (dx / len) * distance];
}

// create arrow element from absolute start & end
function arrowFromPointsAbs(absPoints: number[][]) {
  const [x0, y0] = absPoints[0];
  const rel = absPoints.map(([x, y]) => [x - x0, y - y0]);
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [rx, ry] of rel) {
    if (rx < minX) minX = rx;
    if (ry < minY) minY = ry;
    if (rx > maxX) maxX = rx;
    if (ry > maxY) maxY = ry;
  }
  const width = Math.max(1, Math.abs(maxX - minX));
  const height = Math.max(1, Math.abs(maxY - minY));
  return {
    type: "arrow",
    x: x0 + minX,
    y: y0 + minY,
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
    roundness: { type: 2 },
    seed: Math.floor(Math.random() * 1_000_000),
    version: 1,
    versionNonce: Math.floor(Math.random() * 1_000_000),
    isDeleted: false,
    boundElements: null,
    updated: Date.now(),
    link: null,
    locked: false,
    points: rel,
    lastCommittedPoint: null,
    startBinding: null,
    endBinding: null,
    startArrowhead: null,
    endArrowhead: "arrow",
    id: uid("arrow"),
  };
}

// ---- main converter ----
export const blueprintToElements = (nodes: NodeBlueprint[], edges: EdgeBlueprint[]) => {
  // build a map for quick lookup
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  // create edge elements (first) so arrows render beneath shapes
  const edgeElements: any[] = [];

  for (const e of edges) {
    if (e.points && e.points.length > 0) {
      edgeElements.push(arrowFromPointsAbs(e.points));
      // optional label handled below
    } else {
      const from = nodeMap.get(e.from);
      const to = nodeMap.get(e.to);
      if (!from || !to) {
        // fallback small arrow
        edgeElements.push(arrowFromPointsAbs([[0, 0], [0, 1]]));
        continue;
      }
      // compute border anchor points
      const [fxCenter, fyCenter] = centerOf(from);
      const [txCenter, tyCenter] = centerOf(to);

      const start = borderPointTowards(from, txCenter, tyCenter); // point on "from" border towards "to"
      const end = borderPointTowards(to, fxCenter, fyCenter); // point on "to" border towards "from"

      const absStart = start;
      const absEnd = end;

      edgeElements.push(arrowFromPointsAbs([absStart, absEnd]));

      // edge label near midpoint, offset perpendicular
      if (e.label) {
        const mid = [(absStart[0] + absEnd[0]) / 2, (absStart[1] + absEnd[1]) / 2];
        const ofs = perpOffset(absStart, absEnd, 14);
        // small text box centered at mid + ofs
        edgeElements.push(
          textElem(e.label, mid[0] + ofs[0] - 30, mid[1] + ofs[1] - 10, 60, 20)
        );
      }
    }
  }

  // create node elements (shapes + labels)
  const nodeElements = nodes.flatMap((n) => {
    const baseStyle = {
      backgroundColor: n.style?.backgroundColor ?? "#d4a574",
      strokeColor: n.style?.strokeColor ?? "#000000",
      roundness: n.style?.roundness ?? (n.type === "rectangle" ? { type: 3 } : null),
    };

    if (n.type === "text") {
      return [textElem(n.label ?? "", n.x, n.y, n.width, n.height)];
    }

    const shape = createBase(n.type, n.x, n.y, n.width, n.height, baseStyle);
    const label = n.label
      ? textElem(n.label, n.x + 6, n.y + Math.max(6, n.height / 3), n.width - 12, Math.max(20, n.height / 3))
      : null;

    return label ? [shape, label] : [shape];
  });

  // return edges first (under), then nodes on top
  return [...edgeElements, ...nodeElements];
};
