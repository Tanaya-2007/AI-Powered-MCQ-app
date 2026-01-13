import Home from './pages/Home';
import ModeSelection from './pages/ModeSelection';
import SoloMode from './pages/SoloMode';
import QuizSession from './pages/QuizSession';

function App() {
  return (
    <BrowserRouter>
     <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/mode-selection" element={<ModeSelection />} />
      <Route path="/solo-mode" element={<SoloMode />} />
      <Route path="/quiz-session" element={<QuizSession />} />
    </Routes>
    </BrowserRouter>
  );
}

export default App;