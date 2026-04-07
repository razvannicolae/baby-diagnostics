import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { Login } from './pages/Login';
import { Home } from './pages/Home';
import { Capture } from './pages/Capture';
import { Results } from './pages/Results';
import { Chat } from './pages/Chat';
import { Trends } from './pages/Trends';
import { Profile } from './pages/Profile';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            {/* Pages with bottom nav */}
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/results/:id" element={<Results />} />
              <Route path="/chat/:scanId" element={<Chat />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/trends" element={<Trends />} />
              <Route path="/profile" element={<Profile />} />
            </Route>
            {/* Full-screen pages (no bottom nav) */}
            <Route path="/capture" element={<Capture />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
