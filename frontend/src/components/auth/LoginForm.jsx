import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../../api/authApi';
import toast from 'react-hot-toast';

export default function LoginForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = useCallback(async (e) => {
    e?.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error('이메일과 비밀번호를 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const res = await login(email, password);
      const { token, name } = res.data.data;

      localStorage.setItem('accessToken', token);
      localStorage.setItem('userName', name);
      localStorage.setItem('userEmail', email);

      toast.success(`${name}님, 환영합니다!`);
      navigate('/rides', { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || '로그인에 실패했습니다.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [email, password, navigate]);

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-800 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200">
          <span className="text-2xl">🔑</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">로그인</h2>
        <p className="text-gray-500 text-sm">가입한 이메일과 비밀번호를 입력하세요</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">학교 이메일</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="학번@yonsei.ac.kr"
            className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 text-sm font-medium outline-none transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">비밀번호</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 text-sm font-medium outline-none transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
            >
              {showPassword ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !email.trim() || !password.trim()}
          className={`
            w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 mt-2
            ${loading || !email.trim() || !password.trim()
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-800 to-blue-600 text-white hover:shadow-lg hover:shadow-blue-200 hover:-translate-y-0.5 active:translate-y-0'
            }
          `}
        >
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              로그인 중...
            </span>
          ) : (
            '로그인'
          )}
        </button>
      </form>
    </div>
  );
}
