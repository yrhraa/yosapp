import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import BottomNav from './components/layout/BottomNav';
import FormationPage from './pages/Formation';
import CountPage from './pages/Count';
import MusicPage from './pages/Music';
import ChecklistPage from './pages/Checklist';

function SettingsPage() {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-4 text-center p-8">
      <h2 className="text-xl font-bold text-white">Settings</h2>
      <p className="text-white/40 text-sm">準備中</p>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen overflow-hidden bg-[#0A0A0C] text-white">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <main className="flex-1 overflow-hidden pb-16 md:pb-0">
            <Routes>
              <Route path="/"          element={<FormationPage />} />
              <Route path="/count"     element={<CountPage />} />
              <Route path="/music"     element={<MusicPage />} />
              <Route path="/checklist" element={<ChecklistPage />} />
              <Route path="/settings"  element={<SettingsPage />} />
            </Routes>
          </main>
        </div>
        <BottomNav />
      </div>
    </BrowserRouter>
  );
}
