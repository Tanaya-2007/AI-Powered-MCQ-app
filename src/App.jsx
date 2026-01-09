import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/home';
import ModeSelection from './pages/ModeSelection';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/mode-selection" element={<ModeSelection />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;