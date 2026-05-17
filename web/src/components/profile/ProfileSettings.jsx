import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getProfile, updateProfile } from '../../api/userApi';
import { setPassword } from '../../api/authApi';

const GENDERS = [
  { key: 'UNSPECIFIED', label: '미선택' },
  { key: 'MALE', label: '남성' },
  { key: 'FEMALE', label: '여성' },
];

export default function ProfileSettings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState('UNSPECIFIED');
  const [prefersQuiet, setPrefersQuiet] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwSaving, setPwSaving] = useState(false);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getProfile();
      const u = res.data.data;
      setProfile(u);
      setFullName(u.fullName ?? '');
      setGender(u.gender ?? 'UNSPECIFIED');
      setPrefersQuiet(Boolean(u.prefersQuiet));
    } catch (err) {
      toast.error(err.response?.data?.message || '프로필을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const onSaveProfile = async () => {
    setSaving(true);
    try {
      const res = await updateProfile({
        fullName: fullName.trim() || undefined,
        gender,
        prefersQuiet,
      });
      setProfile(res.data.data);
      const name = res.data.data.fullName ?? res.data.data.email?.split('@')[0];
      if (name) localStorage.setItem('userName', name);
      toast.success('프로필을 저장했습니다.');
    } catch (err) {
      toast.error(err.response?.data?.message || '저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const onChangePassword = async () => {
    if (newPassword.length < 8) {
      toast.error('비밀번호는 8자 이상이어야 합니다.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('비밀번호 확인이 일치하지 않습니다.');
      return;
    }
    setPwSaving(true);
    try {
      await setPassword(newPassword);
      setNewPassword('');
      setConfirmPassword('');
      await loadProfile();
      toast.success(profile?.hasPassword ? '비밀번호를 변경했습니다.' : '비밀번호를 설정했습니다.');
    } catch (err) {
      toast.error(err.response?.data?.message || '비밀번호 변경에 실패했습니다.');
    } finally {
      setPwSaving(false);
    }
  };

  const onLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    navigate('/', { replace: true });
  };

  if (loading) {
    return <div className="py-12 text-center text-slate-400 text-sm">불러오는 중...</div>;
  }

  const hasPassword = Boolean(profile?.hasPassword);
  const email = profile?.email ?? localStorage.getItem('userEmail') ?? '';

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/[0.04]">
        <h3 className="text-base font-extrabold text-slate-900 mb-4">프로필</h3>

        <label className="block text-xs font-semibold text-slate-500 mb-2">표시 이름</label>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="이름 (선택)"
          maxLength={80}
          className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 text-sm font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 mb-4"
        />

        <label className="block text-xs font-semibold text-slate-500 mb-2">성별</label>
        <div className="flex flex-wrap gap-2 mb-4">
          {GENDERS.map((g) => (
            <button
              key={g.key}
              type="button"
              onClick={() => setGender(g.key)}
              className={`px-4 py-2 rounded-full text-sm font-semibold border-2 transition-colors ${
                gender === g.key
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>

        <label className="flex items-center justify-between gap-4 py-2 mb-4 cursor-pointer">
          <span className="text-sm font-semibold text-slate-800">조용한 합승 선호</span>
          <input
            type="checkbox"
            checked={prefersQuiet}
            onChange={(e) => setPrefersQuiet(e.target.checked)}
            className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
        </label>

        <button
          type="button"
          onClick={onSaveProfile}
          disabled={saving}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-800 to-blue-600 text-white font-bold text-sm disabled:opacity-60 hover:shadow-lg transition-shadow"
        >
          {saving ? '저장 중...' : '프로필 저장'}
        </button>

        {profile && (
          <p className="text-xs text-slate-400 text-center mt-3">
            매너 온도 {profile.mannerTemperature}° · 프로필은 서버에 반영됩니다.
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/[0.04]">
        <h3 className="text-base font-extrabold text-slate-900 mb-2">비밀번호</h3>
        <p className="text-xs text-slate-500 mb-4 leading-relaxed">
          {hasPassword
            ? '새 비밀번호를 입력하면 변경됩니다. (8자 이상)'
            : 'OTP 로그인 후 비밀번호를 설정하면 다음부터 비밀번호로 로그인할 수 있습니다.'}
        </p>

        <label className="block text-xs font-semibold text-slate-500 mb-2">새 비밀번호</label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          autoComplete="new-password"
          placeholder="8자 이상"
          className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 text-sm font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 mb-3"
        />

        <label className="block text-xs font-semibold text-slate-500 mb-2">비밀번호 확인</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
          placeholder="다시 입력"
          className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 text-sm font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 mb-4"
        />

        <button
          type="button"
          onClick={onChangePassword}
          disabled={pwSaving || newPassword.length < 8}
          className="w-full py-3 rounded-xl border-2 border-blue-600 text-blue-700 font-bold text-sm hover:bg-blue-50 disabled:opacity-50 transition-colors"
        >
          {pwSaving ? '처리 중...' : hasPassword ? '비밀번호 변경' : '비밀번호 설정'}
        </button>
      </section>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm shadow-slate-900/[0.04] text-sm text-slate-600">
        <p className="text-xs text-slate-400 mb-1">로그인 계정</p>
        <p className="font-semibold text-slate-800 break-all">{email}</p>
      </section>

      <button
        type="button"
        onClick={onLogout}
        className="w-full py-3 text-red-600 font-bold text-sm hover:bg-red-50 rounded-xl transition-colors"
      >
        로그아웃
      </button>
    </div>
  );
}