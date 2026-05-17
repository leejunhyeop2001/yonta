import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SetPasswordForm from '../components/auth/SetPasswordForm';
import { getMyInfo } from '../api/authApi';

export default function SetPasswordPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      navigate('/auth', { replace: true });
      return;
    }
    getMyInfo()
      .then((res) => {
        if (res.data.data.hasPassword) {
          navigate('/rides', { replace: true });
        }
      })
      .catch(() => navigate('/auth', { replace: true }));
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-100 via-white to-sky-50/40">
      <main className="flex-1 flex items-start justify-center pt-12 px-4 pb-12">
        <SetPasswordForm />
      </main>
    </div>
  );
}
