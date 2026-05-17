import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, loginWithPassword, sendVerificationEmail, getAccountStatus } from '../../api/authApi';
import toast from 'react-hot-toast';

export default function LoginForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [mode, setMode] = useState('otp');
  const [hasPassword, setHasPassword] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed.endsWith('@yonsei.ac.kr')) {
      setHasPassword(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await getAccountStatus(trimmed);
        const { hasPassword: hp, registered } = res.data.data;
        setHasPassword(hp);
        if (registered && hp) setMode('password');
        else if (registered && !hp) setMode('otp');
      } catch {
        setHasPassword(null);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [email]);

  const finishLogin = useCallback((res) => {
    const { token, name, requiresPasswordSetup } = res.data.data;
    if (!token) throw new Error('로그인에 실패했습니다.');
    localStorage.setItem('accessToken', token);
    localStorage.setItem('userName', name);
    toast.success(`${name}님, 환영합니다!`);
    if (requiresPasswordSetup) {
      navigate('/auth/set-password', { replace: true });
    } else {
      navigate('/rides', { replace: true });
    }
  }, [navigate]);

  const handleSendOtp = useCallback(async () => {
    if (!email.trim()) {
      toast.error('이메일을 입력해주세요.');
      return;
    }
    if (!email.toLowerCase().endsWith('@yonsei.ac.kr')) {
      toast.error('@yonsei.ac.kr 메일만 가능합니다.');
      return;
    }
    setLoading(true);
    try {
      await sendVerificationEmail(email);
      toast.success('OTP를 이메일로 보냈습니다.');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'OTP 발송에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [email]);

  const handlePasswordLogin = useCallback(async (e) => {
    e?.preventDefault();
    if (!email.trim() || password.length < 8) {
      toast.error('이메일과 비밀번호(8자 이상)를 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const res = await loginWithPassword(email, password);
      finishLogin(res);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [email, password, finishLogin]);

  const handleOtpLogin = useCallback(async (e) => {
    e?.preventDefault();
    if (!email.trim() || otp.length !== 6) {
      toast.error('이메일과 6자리 OTP를 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const res = await login(email, otp);
      finishLogin(res);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [email, otp, finishLogin]);

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-800 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200">
          <span className="text-2xl">🔑</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">로그인</h2>
        <p className="text-gray-500 text-sm">
          {hasPassword
            ? '비밀번호 또는 OTP로 로그인하세요'
            : '처음 이용 시 학교 메일 OTP 인증이 필요합니다'}
        </p>
      </div>

      {hasPassword !== true && <OtpFirstGuide />}

      <div className="flex rounded-xl bg-gray-100 p-1 mb-5">
        <button
          type="button"
          onClick={() => setMode('password')}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${
            mode === 'password' ? 'bg-white text-blue-800 shadow-sm' : 'text-gray-500'
          }`}
        >
          비밀번호
        </button>
        <button
          type="button"
          onClick={() => setMode('otp')}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${
            mode === 'otp' ? 'bg-white text-blue-800 shadow-sm' : 'text-gray-500'
          }`}
        >
          OTP
        </button>
      </div>

      {mode === 'password' ? (
        <form onSubmit={handlePasswordLogin} className="space-y-4">
          <EmailField email={email} setEmail={setEmail} />
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="8자 이상"
              autoComplete="current-password"
              className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 text-sm font-medium outline-none transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>
          {hasPassword !== true && (
            <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 leading-relaxed">
              비밀번호가 아직 없습니다. <strong>OTP 탭</strong>에서 학교 메일 인증 후 비밀번호를 설정해 주세요.
            </p>
          )}
          {hasPassword === true && (
            <p className="text-xs text-slate-500">
              비밀번호를 잊으셨다면 OTP 탭에서 다시 인증할 수 있습니다.
            </p>
          )}
          <SubmitButton
            loading={loading}
            disabled={loading || !email.trim() || password.length < 8}
            label={loading ? '로그인 중...' : '로그인'}
          />
        </form>
      ) : (
        <form onSubmit={handleOtpLogin} className="space-y-4">
          <p className="text-xs text-blue-800 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2.5 leading-relaxed">
            <span className="font-bold">1.</span> 학교 이메일 입력 후 「OTP 받기」를 누르세요.
            <br />
            <span className="font-bold">2.</span> 메일로 온 6자리 번호를 입력해 로그인하세요.
            <br />
            <span className="font-bold">3.</span> 로그인 후 비밀번호를 설정하면 다음부터는 비밀번호 탭을 이용할 수 있어요.
          </p>
          <EmailField email={email} setEmail={setEmail} />
          <button
            type="button"
            onClick={handleSendOtp}
            disabled={loading || !email.trim()}
            className={`w-full py-3 rounded-xl font-semibold text-sm border-2 ${
              loading || !email.trim()
                ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                : 'border-blue-600 text-blue-700 hover:bg-blue-50'
            }`}
          >
            OTP 받기
          </button>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">OTP (6자리)</label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 text-sm font-medium outline-none transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>
          <SubmitButton
            loading={loading}
            disabled={loading || !email.trim() || otp.length !== 6}
            label={loading ? '로그인 중...' : 'OTP로 로그인'}
          />
        </form>
      )}
    </div>
  );
}

function OtpFirstGuide() {
  return (
    <div
      role="note"
      className="mb-5 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-left"
    >
      <p className="text-sm font-bold text-sky-900 mb-1.5">처음이신가요? OTP 인증부터 진행해 주세요</p>
      <ol className="text-xs text-sky-800 space-y-1 list-decimal list-inside leading-relaxed">
        <li>아래 <strong>OTP</strong> 탭을 선택합니다</li>
        <li>@yonsei.ac.kr 메일로 인증번호를 받아 로그인합니다</li>
        <li>로그인 후 비밀번호를 설정하면, 다음부터는 비밀번호로 로그인할 수 있습니다</li>
      </ol>
    </div>
  );
}

function EmailField({ email, setEmail }) {
  return (
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
  );
}

function SubmitButton({ loading, disabled, label }) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className={`w-full py-3.5 rounded-xl font-semibold text-sm mt-2 ${
        disabled
          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
          : 'bg-gradient-to-r from-blue-800 to-blue-600 text-white hover:shadow-lg'
      }`}
    >
      {label}
    </button>
  );
}

