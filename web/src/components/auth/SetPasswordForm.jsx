import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { setPassword } from '../../api/authApi';

export default function SetPasswordForm({ onComplete }) {
  const navigate = useNavigate();
  const [password, setPasswordValue] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error('비밀번호는 8자 이상이어야 합니다.');
      return;
    }
    if (password !== confirm) {
      toast.error('비밀번호 확인이 일치하지 않습니다.');
      return;
    }

    setLoading(true);
    try {
      await setPassword(password);
      toast.success('비밀번호가 설정되었습니다. 다음부터 비밀번호로 로그인할 수 있어요.');
      onComplete?.();
      navigate('/rides', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || '비밀번호 설정에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [password, confirm, navigate, onComplete]);

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto space-y-4">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-200">
          <span className="text-2xl">🔒</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">비밀번호 설정</h2>
        <p className="text-gray-500 text-sm">한 번만 설정하면 다음부터 OTP 없이 로그인할 수 있어요</p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">새 비밀번호</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPasswordValue(e.target.value)}
          placeholder="8자 이상"
          autoComplete="new-password"
          className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 text-sm font-medium outline-none transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">비밀번호 확인</label>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="다시 입력"
          autoComplete="new-password"
          className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 text-sm font-medium outline-none transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        />
      </div>

      <button
        type="submit"
        disabled={loading || password.length < 8 || confirm.length < 8}
        className={`w-full py-3.5 rounded-xl font-semibold text-sm mt-2 ${
          loading || password.length < 8 || confirm.length < 8
            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-blue-800 to-blue-600 text-white hover:shadow-lg'
        }`}
      >
        {loading ? '저장 중...' : '비밀번호 저장'}
      </button>
    </form>
  );
}
