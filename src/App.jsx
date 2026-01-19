import Home from './pages/home';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ModeSelection from './pages/ModeSelection';
import SoloMode from './pages/SoloMode';
import SoloQuizSession from './pages/SoloQuizSession';
import SoloResults from './pages/SoloResults';

function App() {
  return (
    <BrowserRouter>
     <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/mode-selection" element={<ModeSelection />} />
      <Route path="/solo-mode" element={<SoloMode />} />
      <Route path="/quiz-session" element={<SoloQuizSession />} />
      <Route path="/solo-results" element={<SoloResults />} />
    </Routes>
    </BrowserRouter>
  );
}

export default App;