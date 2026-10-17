import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import GlobalLoader from './components/GlobalLoader.jsx';
import Home from './pages/public/Home.jsx';
import Dashboard from './pages/public/Dashboard.jsx';
import Activities from './pages/public/Activities.jsx';
import News from './pages/public/News.jsx';
import Curriculum from './pages/public/Curriculum.jsx';
import Birthdays from './pages/public/Birthdays.jsx';
import WorldMap from './pages/public/WorldMap.jsx';
import Missions from './pages/public/Missions.jsx';
import Login from './pages/admin/Login.jsx';
import AdminHome from './pages/admin/AdminHome.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

export default function App() {
  return (
    <div className="min-h-screen">
      <GlobalLoader />
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 pt-28 pb-16" style={{ width: 'min(1240px, calc(100% - 28px))' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/activities" element={<Activities />} />
          <Route path="/news" element={<News />} />
          <Route path="/curriculum" element={<Curriculum />} />
          <Route path="/birthdays" element={<Birthdays />} />
          <Route path="/map" element={<WorldMap />} />
          <Route path="/missions" element={<Missions />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<ProtectedRoute><AdminHome /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
      <footer className="text-center py-8 text-sm" style={{ color: 'var(--muted)' }}>
        FLAME Function · St. Paul Coptic Service
      </footer>
    </div>
  );
}
