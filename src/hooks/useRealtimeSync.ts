import { useEffect, useRef, useState } from 'react';

// Simple real-time sync hook using localStorage as placeholder for WebSockets/Firebase
interface SharedBoard {
  id: string;
  hostName: string;
  createdAt: Date;
  lastModified: Date;
  elements: any[]; // Drawing elements
  participants: Participant[];
}

interface Participant {
  id: string;
  name: string;
  role: 'host' | 'guest';
  joinedAt: Date;
}

// Placeholder for WebSockets/Firebase sync
export const useRealtimeSync = (boardId: string, userRole: 'host' | 'guest') => {
  const [board, setBoard] = useState<SharedBoard | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!boardId) return;

    // Initialize board for host
    if (userRole === 'host') {
      const initialBoard: SharedBoard = {
        id: boardId,
        hostName: 'Host', // Will be updated from ShareModal
        createdAt: new Date(),
        lastModified: new Date(),
        elements: [],
        participants: [{
          id: 'host-1',
          name: 'Host',
          role: 'host',
          joinedAt: new Date()
        }]
      };
      setBoard(initialBoard);
      setParticipants(initialBoard.participants);
      setIsConnected(true);
    } else {
      // Guest joining: Try to load existing board from localStorage
      console.log(`Guest joining board: ${boardId}`);
      try {
        const existingBoard = localStorage.getItem(`board-${boardId}`);
        if (existingBoard) {
          const parsedBoard = JSON.parse(existingBoard);
          setBoard(parsedBoard);
          setParticipants(parsedBoard.participants || []);
          setIsConnected(true);
          console.log(`Successfully joined board: ${boardId}`);
        } else {
          console.warn(`Board not found: ${boardId}`);
          setIsConnected(false);
        }
      } catch (e) {
        console.error(`Error joining board ${boardId}:`, e);
        setIsConnected(false);
      }
    }

    // Placeholder sync mechanism using localStorage
    const syncInterval = setInterval(() => {
      try {
        const storedBoard = localStorage.getItem(`board-${boardId}`);
        if (storedBoard) {
          const parsedBoard = JSON.parse(storedBoard);
          setBoard(parsedBoard);
          setParticipants(parsedBoard.participants || []);
        }
      } catch (e) {
        console.error('Sync error:', e);
      }
    }, 1000); // Sync every second

    intervalRef.current = syncInterval;

    return () => {
      clearInterval(syncInterval);
    };
  }, [boardId, userRole]);

  // Add drawing element
  const addElement = (element: any) => {
    if (!board) return;

    const updatedBoard = {
      ...board,
      elements: [...board.elements, element],
      lastModified: new Date()
    };

    setBoard(updatedBoard);
    localStorage.setItem(`board-${boardId}`, JSON.stringify(updatedBoard));

    // TODO: Broadcast changes via WebSockets/Firebase
    console.log('Element added:', element);
  };

  // Update element
  const updateElement = (elementId: string, updates: Partial<any>) => {
    if (!board) return;

    const updatedElements = board.elements.map(el =>
      el.id === elementId ? { ...el, ...updates } : el
    );

    const updatedBoard = {
      ...board,
      elements: updatedElements,
      lastModified: new Date()
    };

    setBoard(updatedBoard);
    localStorage.setItem(`board-${boardId}`, JSON.stringify(updatedBoard));

    // TODO: Broadcast changes via WebSockets/Firebase
  };

  // Delete element
  const deleteElement = (elementId: string) => {
    if (!board) return;

    const updatedBoard = {
      ...board,
      elements: board.elements.filter(el => el.id !== elementId),
      lastModified: new Date()
    };

    setBoard(updatedBoard);
    localStorage.setItem(`board-${boardId}`, JSON.stringify(updatedBoard));

    // TODO: Broadcast changes via WebSockets/Firebase
  };

  // Add participant (for guests joining)
  const addParticipant = (name: string) => {
    if (!board) return;

    const newParticipant: Participant = {
      id: `guest-${Date.now()}`,
      name,
      role: 'guest',
      joinedAt: new Date()
    };

    const updatedBoard = {
      ...board,
      participants: [...board.participants, newParticipant]
    };

    setBoard(updatedBoard);
    setParticipants(updatedBoard.participants);
    localStorage.setItem(`board-${boardId}`, JSON.stringify(updatedBoard));

    // TODO: Broadcast participant joined via WebSockets/Firebase
    console.log(`Guest ${name} joined the board`);
  };

  return {
    board,
    participants,
    isConnected,
    addElement,
    updateElement,
    deleteElement,
    addParticipant
  };
};
