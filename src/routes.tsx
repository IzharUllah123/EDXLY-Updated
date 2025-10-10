import { createBrowserRouter } from "react-router-dom";
import Index from "./pages/index";
import RoomPage from "./pages/RoomPage";
import NotFound from "./pages/NotFound";

import BoardPage from "./pages/BoardPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Index />,
  },
  {
    path: "/room/:roomId",
    element: <RoomPage />,
  },
  {
    path: "/board/:boardId",
    element: <BoardPage />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);
