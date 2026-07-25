import Home from './pages/home';
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
        {/* Public Route */}
        <Route path="/" element={<Home />} />

        {/* Protected Private Routes wrapped in AuthGuard */}
        <Route path="/mode-selection" element={<AuthGuard><ModeSelection /></AuthGuard>} />
        <Route path="/solo-mode" element={<AuthGuard><SoloMode /></AuthGuard>} />
        <Route path="/quiz-session" element={<AuthGuard><SoloQuizSession /></AuthGuard>} />
        <Route path="/solo-results" element={<AuthGuard><SoloResults /></AuthGuard>} />
        <Route path="/collaborative" element={<AuthGuard><CollabLanding /></AuthGuard>} />
        <Route path="/collab/create-quiz" element={<AuthGuard><CreateQuiz /></AuthGuard>} />
        <Route path="/collab/quiz-lobby" element={<AuthGuard><QuizLobby /></AuthGuard>} />
        <Route path="/collab/quiz-session" element={<AuthGuard><CollabQuizSession /></AuthGuard>} />
        <Route path="/collab/attempt-quiz" element={<AuthGuard><AttemptQuiz /></AuthGuard>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;