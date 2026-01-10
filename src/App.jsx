import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/home';
import ModeSelection from './pages/ModeSelection';
import SoloMode from './pages/SoloMode';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/mode-selection" element={<ModeSelection />} />
        <Route path="/solo-mode" element={<SoloMode />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;