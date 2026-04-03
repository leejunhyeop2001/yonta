import { useState, useEffect, useMemo } from 'react';
import { getAllUsers, searchUsers, getAdminStats } from '../api/adminApi';
import toast from 'react-hot-toast';

const TEMP_COLOR = (t) => {
  if (t >= 40) return 'text-red-500';
  if (t >= 37.5) return 'text-orange-500';
  if (t >= 36) return 'text-blue-500';
  return 'text-gray-500';
};

const TEMP_BG = (t) => {
  if (t >= 40) return 'bg-red-50';
  if (t >= 37.5) return 'bg-orange-50';
  if (t >= 36) return 'bg-blue-50';
  return 'bg-gray-50';
};

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ totalUsers: 0, verifiedUsers: 0 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState('createdAt');
  const [sortAsc, setSortAsc] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersRes, statsRes] = await Promise.all([getAllUsers(), getAdminStats()]);
      setUsers(usersRes.data.data || []);
      setStats(statsRes.data.data || { totalUsers: 0, verifiedUsers: 0 });
    } catch {
      toast.error('데이터를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!search.trim()) {
      loadData();
      return;
    }
    setLoading(true);
    try {
      const res = await searchUsers(search.trim());
      setUsers(res.data.data || []);
    } catch {
      toast.error('검색에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const sorted = useMemo(() => {
    return [...users].sort((a, b) => {
      let va = a[sortKey];
      let vb = b[sortKey];
      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();
      if (va < vb) return sortAsc ? -1 : 1;
      if (va > vb) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [users, sortKey, sortAsc]);

  const handleExport = () => {
    toast.success('엑셀 내보내기 기능은 준비 중입니다.');
  };

  const SortIcon = ({ col }) => {
    if (sortKey !== col) return <span className="text-gray-300 ml-1">↕</span>;
    return <span className="text-blue-500 ml-1">{sortAsc ? '↑' : '↓'}</span>;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-800 to-blue-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-200">
              <span className="text-white text-lg">⚙️</span>
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-gray-900">관리자 대시보드</h1>
              <p className="text-xs text-gray-400">연타 · 유저 관리</p>
            </div>
          </div>
          <a href="/" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">← 메인으로</a>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">전체 유저</p>
            <p className="text-3xl font-extrabold text-gray-900">{stats.totalUsers}<span className="text-base font-medium text-gray-400 ml-1">명</span></p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">인증 완료</p>
            <p className="text-3xl font-extrabold text-green-600">{stats.verifiedUsers}<span className="text-base font-medium text-gray-400 ml-1">명</span></p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">미인증</p>
            <p className="text-3xl font-extrabold text-orange-500">{stats.totalUsers - stats.verifiedUsers}<span className="text-base font-medium text-gray-400 ml-1">명</span></p>
          </div>
        </div>

        {/* Search & Actions Bar */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="이름, 이메일, 학번으로 검색..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSearch}
                className="px-5 py-2.5 bg-blue-800 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors"
              >
                검색
              </button>
              <button
                onClick={() => { setSearch(''); loadData(); }}
                className="px-4 py-2.5 bg-gray-100 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-200 transition-colors"
              >
                초기화
              </button>
              <button
                onClick={handleExport}
                className="px-4 py-2.5 border-2 border-green-200 text-green-700 text-sm font-semibold rounded-xl hover:bg-green-50 transition-colors flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                엑셀 내보내기
              </button>
            </div>
          </div>
        </div>

        {/* User Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
            </div>
          ) : sorted.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-400 text-sm">검색 결과가 없습니다.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    {[
                      { key: 'studentId', label: '학번' },
                      { key: 'name', label: '이름' },
                      { key: 'email', label: '이메일' },
                      { key: 'gender', label: '성별' },
                      { key: 'mannerTemp', label: '매너 온도' },
                      { key: 'verified', label: '인증' },
                      { key: 'createdAt', label: '가입일' },
                    ].map((col) => (
                      <th
                        key={col.key}
                        onClick={() => handleSort(col.key)}
                        className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700 select-none"
                      >
                        {col.label}
                        <SortIcon col={col.key} />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {sorted.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-blue-50/30 transition-colors"
                    >
                      <td className="px-5 py-4 text-sm font-mono text-gray-600">{user.studentId}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {user.name[0]}
                          </div>
                          <span className="text-sm font-semibold text-gray-900">{user.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-500">{user.email}</td>
                      <td className="px-5 py-4 text-sm text-gray-500">{user.gender}</td>
                      <td className="px-5 py-4">
                        <span className={`
                          inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold
                          ${TEMP_BG(user.mannerTemp)} ${TEMP_COLOR(user.mannerTemp)}
                        `}>
                          🌡️ {user.mannerTemp.toFixed(1)}°
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {user.verified ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                            인증됨
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                            미인증
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-400 tabular-nums">{formatDate(user.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer */}
          {!loading && sorted.length > 0 && (
            <div className="border-t border-gray-100 px-5 py-3 bg-gray-50/50 flex items-center justify-between">
              <p className="text-xs text-gray-400">
                총 <span className="font-bold text-gray-600">{sorted.length}</span>명 표시됨
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
