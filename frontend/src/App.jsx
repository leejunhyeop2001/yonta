import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { lazy, Suspense } from 'react';

const Header = lazy(() => import('./components/common/Header'));
import HomePage from './pages/HomePage';
import AuthPage from './pages/AuthPage';
import RideListPage from './pages/RideListPage';
import AdminPage from './pages/AdminPage';
import CreatePartyPage from './pages/CreatePartyPage';
import MyPartyPage from './pages/MyPartyPage';

function AppLayout() {
  const { pathname } = useLocation();
  const hideHeader = ['/', '/auth', '/signup', '/admin'].includes(pathname);

  return (
    <>
      {!hideHeader && (
        <Suspense fallback={null}>
          <Header />
        </Suspense>
      )}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/signup" element={<Navigate to="/auth" replace />} />
        <Route path="/rides" element={<RideListPage />} />
        <Route path="/create" element={<CreatePartyPage />} />
        <Route path="/mypage" element={<MyPartyPage />} />
        <Route path="/my" element={<Navigate to="/mypage" replace />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          className: '!font-sans !text-sm !shadow-lg !shadow-slate-900/10 !border !border-slate-100',
          style: {
            fontFamily: 'inherit',
            borderRadius: '14px',
            padding: '12px 16px',
            maxWidth: 'min(92vw, 360px)',
          },
          success: {
            iconTheme: { primary: '#1e40af', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: '#dc2626', secondary: '#fff' },
          },
        }}
      />
      <AppLayout />
    </BrowserRouter>
  );
}
