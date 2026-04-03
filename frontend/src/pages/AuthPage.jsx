import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginForm from '../components/auth/LoginForm';
import SignupFlow from '../components/auth/SignupFlow';

export default function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState(null); // null | 'login' | 'signup'

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) navigate('/rides', { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => mode ? setMode(null) : navigate('/')}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <h1 className="text-lg font-bold text-gray-900">
            {mode === 'login' ? '로그인' : mode === 'signup' ? '회원가입' : '시작하기'}
          </h1>
        </div>
      </header>

      <main className="flex-1 flex items-start justify-center pt-8 px-4">
        {!mode && <AuthChoice onSelect={setMode} />}
        {mode === 'login' && <LoginForm />}
        {mode === 'signup' && <SignupFlow onSwitchToLogin={() => setMode('login')} />}
      </main>
    </div>
  );
}

function AuthChoice({ onSelect }) {
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-10">
        <span className="text-5xl block mb-4">🚕</span>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">연타에 오신 것을 환영합니다</h2>
        <p className="text-gray-500 text-sm">연세대 미래캠퍼스 학생 전용 택시 합승</p>
      </div>

      <div className="space-y-3">
        <button
          onClick={() => onSelect('login')}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-800 to-blue-600 text-white text-lg font-bold shadow-lg shadow-blue-200 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
        >
          로그인
        </button>
        <button
          onClick={() => onSelect('signup')}
          className="w-full py-4 rounded-2xl bg-white text-gray-800 text-lg font-semibold border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
        >
          회원가입
        </button>
      </div>

      <p className="text-center text-xs text-gray-400 mt-8">
        @yonsei.ac.kr 메일 인증이 필요합니다
      </p>
    </div>
  );
}
