import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginForm from '../components/auth/LoginForm';
import { getMyInfo } from '../api/authApi';

export default function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState(null); // null | 'login' | 'signup'

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    getMyInfo()
      .then((res) => {
        if (!res.data.data.hasPassword) {
          navigate('/auth/set-password', { replace: true });
        } else {
          navigate('/rides', { replace: true });
        }
      })
      .catch(() => navigate('/rides', { replace: true }));
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-100 via-white to-sky-50/40">
      <header className="border-b border-white/60 bg-white/70 backdrop-blur-xl">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => (mode ? setMode(null) : navigate('/'))}
            className="p-2 rounded-xl hover:bg-slate-100/90 transition-colors text-slate-600"
            aria-label="뒤로"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <h1 className="text-lg font-extrabold text-slate-900">
            {mode === 'login' ? '로그인' : mode === 'signup' ? '회원가입' : '시작하기'}
          </h1>
        </div>
      </header>

      <main className="flex-1 flex items-start justify-center pt-10 sm:pt-12 px-4 pb-12">
        {!mode && <AuthChoice onSelect={setMode} />}
        {mode === 'login' && <LoginForm />}
        {mode === 'signup' && <LoginForm />}
      </main>
    </div>
  );
}

function AuthChoice({ onSelect }) {
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-10">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-800 to-sky-600 text-3xl shadow-lg shadow-blue-900/20 mb-5 ring-4 ring-white/80">
          🚕
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 mb-2 tracking-tight">연타에 오신 것을 환영합니다</h2>
        <p className="text-slate-500 text-sm font-medium">연세대 미래캠퍼스 학생 전용 택시 합승</p>
      </div>

      <div className="rounded-3xl bg-white/90 backdrop-blur-sm border border-slate-200/80 p-6 shadow-xl shadow-slate-900/[0.06] space-y-3">
        <button
          type="button"
          onClick={() => onSelect('login')}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-800 to-blue-600 text-white text-lg font-bold shadow-lg shadow-blue-900/20 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
        >
          로그인
        </button>
        <button
          type="button"
          onClick={() => onSelect('signup')}
          className="w-full py-4 rounded-2xl bg-white text-slate-800 text-lg font-semibold border-2 border-slate-200 hover:border-sky-300 hover:bg-sky-50/80 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
        >
          처음 이용 (OTP 인증)
        </button>
      </div>

      <p className="text-center text-xs text-slate-500 mt-6 font-medium leading-relaxed px-2">
        처음이시면 <strong className="text-slate-700">학교 메일 OTP 인증</strong> 후 비밀번호를 설정해 주세요.
        <br />
        @yonsei.ac.kr 메일만 사용할 수 있습니다.
      </p>
    </div>
  );
}
