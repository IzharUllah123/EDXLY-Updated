import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

// A simple random name generator for the host
const generateRandomName = () => {
  const adjectives = ["Quick", "Creative", "Bright", "Sharp", "Agile"];
  const nouns = ["Mind", "Thinker", "Artist", "Creator", "Spark"];
  return `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${
    nouns[Math.floor(Math.random() * nouns.length)]
  }`;
};

/**
 * This is the new Index page.
 * It automatically creates a new board and navigates to it,
 * marking the user as the host.
 */
function Index() {
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Create a new unique board ID
    const newBoardId = crypto.randomUUID();
    
    // 2. Create a name for the host
    const hostName = generateRandomName();

    // 3. Redirect to the board page
    // We use 'replace: true' so the user can't click "back" to this empty page.
    // We pass 'state' to tell BoardPage that this user is the host.
    navigate(`/board/${newBoardId}`, {
      replace: true,
      state: {
        isHost: true,
        userName: hostName,
      },
    });
  }, [navigate]);

  // Show a loading spinner while redirecting
  return (
    <div className="h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <Loader2 className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
        <p className="text-gray-700 font-medium">Creating your whiteboard...</p>
      </div>
    </div>
  );
}

export default Index;