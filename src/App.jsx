import Home from './pages/home';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ModeSelection from './pages/ModeSelection';
import SoloMode from './pages/solo/SoloMode';
import SoloQuizSession from './pages/solo/SoloQuizSession';
import SoloResults from './pages/solo/SoloResults';
import CollabLanding from './pages/collaborative/CollabLanding';
import CreateQuiz from './pages/collaborative/CreateQuiz';
import QuizLobby from './pages/collaborative/QuizLobby';

function App() {
  return (
    <BrowserRouter>
     <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/mode-selection" element={<ModeSelection />} />
      <Route path="/solo-mode" element={<SoloMode />} />
      <Route path="/quiz-session" element={<SoloQuizSession />} />
      <Route path="/solo-results" element={<SoloResults />} />
      <Route path="/collaborative" element={<CollabLanding />} />
      <Route path="/collab/create-quiz" element={<CreateQuiz />} />
      <Route path="/collab/quiz-lobby" element={<QuizLobby />} />
    </Routes>
    </BrowserRouter>
  );
}

export default App;