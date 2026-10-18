import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import GlobalLoader from './components/GlobalLoader.jsx';
import Loader from './components/Loader.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

// Route-level code splitting: each page loads its own chunk on demand.
// This keeps the initial bundle small (esp. WorldMap/leaflet and the whole
// admin tree), so first paint is much faster.
const Home = lazy(() => import('./pages/public/Home.jsx'));
const Dashboard = lazy(() => import('./pages/public/Dashboard.jsx'));
const Activities = lazy(() => import('./pages/public/Activities.jsx'));
const News = lazy(() => import('./pages/public/News.jsx'));
const Curriculum = lazy(() => import('./pages/public/Curriculum.jsx'));
const Birthdays = lazy(() => import('./pages/public/Birthdays.jsx'));
const WorldMap = lazy(() => import('./pages/public/WorldMap.jsx'));
const Missions = lazy(() => import('./pages/public/Missions.jsx'));
const Login = lazy(() => import('./pages/admin/Login.jsx'));
const AdminHome = lazy(() => import('./pages/admin/AdminHome.jsx'));

export default function App() {
  return (
    <div className="min-h-screen">
      <GlobalLoader />
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 pt-28 pb-16" style={{ width: 'min(1240px, calc(100% - 28px))' }}>
        <Suspense fallback={<Loader label="Loading…" />}>
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
        </Suspense>
      </main>
      <footer className="text-center py-8 text-sm" style={{ color: 'var(--muted)' }}>
        FLAME Function · St. Paul Coptic Service
      </footer>
    </div>
  );
}
