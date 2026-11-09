import Home from './pages/home';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ModeSelection from './pages/ModeSelection';
import SoloMode from './pages/solo/SoloMode';
import SoloQuizSession from './pages/solo/SoloQuizSession';
import SoloResults from './pages/solo/SoloResults';
import CollabLanding from './pages/collaborative/CollabLanding';
import CreateQuiz from './pages/collaborative/CreateQuiz';
import QuizLobby from './pages/collaborative/QuizLobby';
import CollabQuizSession from './pages/collaborative/CollabQuizSession';
import AttemptQuiz from './pages/collaborative/AttemptQuiz';
import AuthGuard from './components/AuthGuard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        {/* Join & Attempt Collaborative Quiz - Accessible directly via share link or room code */}
        <Route path="/collab/join" element={<AttemptQuiz />} />
        <Route path="/collab/attempt-quiz" element={<AttemptQuiz />} />
        <Route path="/join" element={<AttemptQuiz />} />
        <Route path="/collab/quiz-session" element={<CollabQuizSession />} />

        {/* Protected Private Routes wrapped in AuthGuard */}
        <Route path="/mode-selection" element={<AuthGuard><ModeSelection /></AuthGuard>} />
        <Route path="/solo-mode" element={<AuthGuard><SoloMode /></AuthGuard>} />
        <Route path="/quiz-session" element={<AuthGuard><SoloQuizSession /></AuthGuard>} />
        <Route path="/solo-results" element={<AuthGuard><SoloResults /></AuthGuard>} />
        <Route path="/collaborative" element={<AuthGuard><CollabLanding /></AuthGuard>} />
        <Route path="/collab/create-quiz" element={<AuthGuard><CreateQuiz /></AuthGuard>} />
        <Route path="/collab/quiz-lobby" element={<AuthGuard><QuizLobby /></AuthGuard>} />

        {/* Catch-all fallback to Home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;