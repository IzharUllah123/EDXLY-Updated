import { createBrowserRouter, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import RoomPage from "./pages/RoomPage";
import NotFound from "./pages/NotFound";
import BoardPage from "./pages/BoardPage";

/**
 * This component's only job is to create a new board
 * and send the user to it.
 */
const HomeRedirect = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Create a new, unique board ID
    const newBoardId = Math.random().toString(36).substring(2, 15);
    
    // 2. Immediately send the user to this new board page.
    navigate(`/board/${newBoardId}`, { replace: true });
  }, [navigate]);

  // Return a loading spinner while redirecting
  return (
    <div className="h-screen w-full flex items-center justify-center">
      <div>Creating new board...</div>
    </div>
  );
};

export const router = createBrowserRouter([
  {
    path: "/",
    // ✅ All users visiting your homepage are now sent to a new board
    element: <HomeRedirect />,
  },
  {
    path: "/room/:roomId",
    element: <RoomPage />,
  },
  {
    path: "/board/:boardId",
    // ✅ BoardPage is now your main application
    element: <BoardPage />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);