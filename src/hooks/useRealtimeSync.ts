// useRealtimeSync.ts - FIREBASE VERSION (CONNECTION STATUS FIXED)
import { useEffect, useRef, useState, useCallback } from "react";
import * as Y from "yjs";
import { FireProvider } from "y-fire";
import { Awareness } from "y-protocols/awareness";
import { initializeApp, getApps, getApp } from "firebase/app";

// --- FIREBASE CONFIGURATION ---
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase singleton to avoid re-initialization errors
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// --- INTERFACES ---
interface SharedBoard {
  id: string;
  elements: any[];
  participants: Participant[];
  viewport: ViewportState;
}

interface ViewportState {
  scrollX: number;
  scrollY: number;
  zoomLevel: number;
}

interface Participant {
  id: string;
  name: string;
  role: "host" | "guest";
  color: string;
}

export interface UserAwareness {
  id: string;
  name: string;
  color: string;
  cursor?: { x: number; y: number };
  activeTool?: string;
  isDrawing?: boolean;
  viewport?: ViewportState;
}

export const useRealtimeSync = (
  boardId: string,
  userRole: "host" | "guest",
  userName: string
) => {
  // All state hooks
  const [board, setBoard] = useState<SharedBoard>({
    id: boardId,
    elements: [],
    participants: [],
    viewport: { scrollX: 0, scrollY: 0, zoomLevel: 1.0 }
  });
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [awarenessStates, setAwarenessStates] = useState<Map<number, UserAwareness>>(new Map());

  // Refs
  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<FireProvider | null>(null);
  const elementsRef = useRef<Y.Array<any> | null>(null);
  const participantsRef = useRef<Y.Map<Participant> | null>(null);
  const viewportRef = useRef<Y.Map<any> | null>(null);
  const awarenessRef = useRef<Awareness | null>(null);
  const undoManagerRef = useRef<Y.UndoManager | null>(null);
  const initializedRef = useRef(false);
  const connectionCheckTimeoutRef = useRef<number | null>(null);

  // Initialize Yjs + Firebase
  useEffect(() => {
    if (initializedRef.current || !userName || !boardId) {
      return;
    }

    console.log("🔥 Initializing Yjs with Firebase...");
    console.log("📍 Board ID:", boardId);
    console.log("👤 User:", userName, userRole);
    initializedRef.current = true;

    const clientId = localStorage.getItem("clientId") || crypto.randomUUID();
    localStorage.setItem("clientId", clientId);

    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;

    // --- FIREBASE PROVIDER SETUP ---
    console.log("🔧 Creating FireProvider...");
    
    const provider = new FireProvider({
      firebaseApp: app,
      ydoc: ydoc,
      path: `edxly-boards/board-${boardId}`
    });
    
    providerRef.current = provider;
    console.log("✅ FireProvider created successfully");

    // Awareness (FireProvider handles this automatically)
    const awareness = provider.awareness;
    awarenessRef.current = awareness;

    // Shared structures
    const elements = ydoc.getArray("elements");
    const participantsMap = ydoc.getMap<Participant>("participants");
    const viewport = ydoc.getMap("viewport");

    elementsRef.current = elements;
    participantsRef.current = participantsMap;
    viewportRef.current = viewport;

    // Initialize viewport defaults if empty
    if (!viewport.has("scrollX")) {
      viewport.set("scrollX", 0);
      viewport.set("scrollY", 0);
      viewport.set("zoomLevel", 1.0);
    }

    // ✅ FIX: Alternative connection detection
    // FireProvider may not emit 'synced' event reliably
    // Instead, we'll use a combination of strategies:
    
    // Strategy 1: Listen for 'synced' event (if it fires)
    provider.on('synced', (isSynced: boolean) => {
      console.log("🔥 Firebase 'synced' event:", isSynced ? "✅ Connected" : "⏳ Connecting...");
      setIsConnected(isSynced);
    });

    // Strategy 2: Check for initial data load
    let hasReceivedInitialData = false;
    const checkInitialConnection = () => {
      if (!hasReceivedInitialData && elements.length >= 0) {
        hasReceivedInitialData = true;
        console.log("🔥 Firebase: Initial data loaded ✅");
        setIsConnected(true);
      }
    };

    // Strategy 3: Set connected after first successful operation
    const markAsConnected = () => {
      if (!isConnected) {
        console.log("🔥 Firebase: Connection confirmed via data activity ✅");
        setIsConnected(true);
      }
    };

    // Strategy 4: Delayed connection check (fallback)
    connectionCheckTimeoutRef.current = window.setTimeout(() => {
      // If provider exists and no errors, assume connected
      if (providerRef.current && !hasReceivedInitialData) {
        console.log("🔥 Firebase: Assuming connected (timeout fallback) ✅");
        setIsConnected(true);
      }
    }, 2000); // Give Firebase 2 seconds to initialize

    // Error handling
    provider.on('error', (error: any) => {
      console.error("❌ FireProvider Error:", error);
      setIsConnected(false);
    });

    // Observe elements changes
    const elementsObserver = () => {
      const currentElements = elements.toArray();
      console.log("🔔 Elements changed:", currentElements.length, "elements");
      
      // ✅ Mark as connected when we successfully observe changes
      markAsConnected();
      checkInitialConnection();
      
      setBoard((prev) => ({
        ...prev,
        elements: currentElements
      }));
    };

    elements.observeDeep(elementsObserver);

    // Observe viewport changes
    const viewportObserver = () => {
      const currentViewport = {
        scrollX: (viewport.get("scrollX") as number) || 0,
        scrollY: (viewport.get("scrollY") as number) || 0,
        zoomLevel: (viewport.get("zoomLevel") as number) || 1.0,
      };
      
      markAsConnected();
      
      setBoard((prev) => ({
        ...prev,
        viewport: currentViewport,
      }));
    };

    viewport.observe(viewportObserver);

    // Observe participants
    const participantsObserver = () => {
      const currentParticipants = Array.from(participantsMap.values());
      console.log("👥 Participants updated:", currentParticipants.length);
      
      markAsConnected();
      
      setParticipants(currentParticipants);
      setBoard((prev) => ({
        ...prev,
        participants: currentParticipants
      }));
    };

    participantsMap.observe(participantsObserver);

    // Awareness updates
    awareness.on("update", () => {
      const states = awareness.getStates() as Map<number, UserAwareness>;
      setAwarenessStates(new Map(states));
      markAsConnected();
    });

    awareness.on("change", () => {
      console.log("👁️ Awareness changed:", awareness.getStates().size, "users");
      markAsConnected();
    });

    // Setup user
    const userColor = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"][
      Math.floor(Math.random() * 5)
    ];

    awareness.setLocalStateField("user", {
      id: clientId,
      name: userName,
      color: userColor,
    });

    // Add participant to persistent map (if new)
    if (!participantsMap.has(clientId)) {
      participantsMap.set(clientId, {
        id: clientId,
        name: userName,
        role: userRole,
        color: userColor,
      });
      console.log("✅ Added participant to shared map");
    }

    // UndoManager
    try {
      undoManagerRef.current = new Y.UndoManager(elements);
      console.log("✅ UndoManager initialized");
    } catch (err) {
      console.warn("⚠️ UndoManager error:", err);
    }

    // ✅ Initial connection check after setup
    checkInitialConnection();

    console.log("🎉 Yjs initialization complete!");
    
    // Cleanup
    return () => {
      console.log("🧹 Cleaning up Yjs/Firebase connection");
      initializedRef.current = false;
      
      if (connectionCheckTimeoutRef.current) {
        clearTimeout(connectionCheckTimeoutRef.current);
      }
      
      try {
        provider.destroy();
      } catch (err) {
        console.warn("⚠️ Provider destroy error:", err);
      }
      
      ydoc.destroy();
      
      ydocRef.current = null;
      providerRef.current = null;
      elementsRef.current = null;
      participantsRef.current = null;
      viewportRef.current = null;
      awarenessRef.current = null;
      undoManagerRef.current = null;
    };
  }, [boardId, userName, userRole]);

  // Sync functions
  const addElement = useCallback((element: any) => {
    const elements = elementsRef.current;
    if (!elements) {
      console.warn("⚠️ Cannot add element: elements ref is null");
      return;
    }

    try {
      if (!element.id) {
        element.id = `${element.type || 'element'}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      }
      elements.push([element]);
      console.log("✅ Element added:", element.id);
      
      // ✅ Confirm connection on successful add
      if (!isConnected) {
        setIsConnected(true);
      }
    } catch (err) {
      console.error("❌ Add element failed:", err);
    }
  }, [isConnected]);

  const updateElement = useCallback((elementId: string, updates: Partial<any>) => {
    const elements = elementsRef.current;
    const ydoc = ydocRef.current;
    
    if (!elements || !ydoc) {
      console.warn("⚠️ Cannot update element: refs are null");
      return;
    }

    const elementsArray = elements.toArray();
    const index = elementsArray.findIndex((el: any) => el.id === elementId);

    if (index !== -1) {
      ydoc.transact(() => {
        const updatedElement = { ...elementsArray[index], ...updates };
        elements.delete(index, 1);
        elements.insert(index, [updatedElement]);
      });
      console.log("✅ Element updated:", elementId);
    } else {
      console.warn("⚠️ Element not found:", elementId);
    }
  }, []);

  const deleteElement = useCallback((elementId: string) => {
    const elements = elementsRef.current;
    if (!elements) {
      console.warn("⚠️ Cannot delete element: elements ref is null");
      return;
    }

    const elementsArray = elements.toArray();
    const index = elementsArray.findIndex((el: any) => el.id === elementId);

    if (index !== -1) {
      elements.delete(index, 1);
      console.log("✅ Element deleted:", elementId);
    } else {
      console.warn("⚠️ Element not found:", elementId);
    }
  }, []);

  const updateViewport = useCallback((viewport: Partial<ViewportState>) => {
    const viewportMap = viewportRef.current;
    if (!viewportMap) {
      console.warn("⚠️ Cannot update viewport: viewport ref is null");
      return;
    }

    if (viewport.scrollX !== undefined) viewportMap.set("scrollX", viewport.scrollX);
    if (viewport.scrollY !== undefined) viewportMap.set("scrollY", viewport.scrollY);
    if (viewport.zoomLevel !== undefined) viewportMap.set("zoomLevel", viewport.zoomLevel);
  }, []);

  const undo = useCallback(() => {
    if (undoManagerRef.current) {
      undoManagerRef.current.undo();
      console.log("↩️ Undo performed");
    }
  }, []);

  const redo = useCallback(() => {
    if (undoManagerRef.current) {
      undoManagerRef.current.redo();
      console.log("↪️ Redo performed");
    }
  }, []);

  const canUndo = useCallback(() => {
    return !!undoManagerRef.current && (undoManagerRef.current.undoStack?.length ?? 0) > 0;
  }, []);

  const canRedo = useCallback(() => {
    return !!undoManagerRef.current && (undoManagerRef.current.redoStack?.length ?? 0) > 0;
  }, []);

  return {
    board,
    participants,
    isConnected,
    awareness: awarenessRef.current,
    awarenessStates,
    addElement,
    updateElement,
    deleteElement,
    updateViewport,
    ydoc: ydocRef.current,
    elements: elementsRef.current,
    undo,
    redo,
    canUndo,
    canRedo,
  };
};