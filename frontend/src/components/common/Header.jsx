import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

const NAV = [
  { to: '/rides', label: '합승 찾기', icon: '🚕' },
  { to: '/create', label: '파티 만들기', icon: '✏️' },
  { to: '/mypage', label: '마이페이지', icon: '📋' },
];

export default function Header() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [userName, setUserName] = useState(null);

  useEffect(() => {
    setUserName(localStorage.getItem('userName'));
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl shadow-sm shadow-slate-900/[0.04]">
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex items-center justify-between py-3.5">
          <Link
            to="/"
            className="flex items-center gap-2.5 group rounded-xl pr-2 -ml-1 pl-1 py-0.5 hover:bg-slate-50/80 transition-colors"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-700 to-blue-600 text-xl shadow-md shadow-blue-900/20 ring-1 ring-white/30">
              🚕
            </span>
            <div className="text-left leading-tight">
              <h1 className="text-lg font-extrabold bg-gradient-to-r from-blue-900 via-blue-700 to-sky-600 bg-clip-text text-transparent">
                연타
              </h1>
              <p className="text-[10px] font-semibold text-slate-400 tracking-wide">연세 타요</p>
            </div>
          </Link>

          {userName ? (
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-slate-700 max-w-[8rem] truncate" title={userName}>
                {userName}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="text-xs text-slate-400 hover:text-red-500 font-semibold transition-colors px-2 py-1 rounded-lg hover:bg-red-50"
              >
                로그아웃
              </button>
            </div>
          ) : (
            <Link
              to="/auth"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-800 to-blue-600 text-white text-xs font-bold shadow-md shadow-blue-900/15 hover:shadow-lg hover:brightness-105 active:scale-[0.98] transition-all"
            >
              로그인
            </Link>
          )}
        </div>

        <nav className="flex gap-1.5 pb-3 -mx-1">
          {NAV.map((item) => {
            const active = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`
                  flex-1 flex items-center justify-center gap-1.5 px-2 py-2.5 text-sm font-bold rounded-xl
                  transition-all duration-200
                  ${active
                    ? 'bg-slate-900 text-white shadow-md shadow-slate-900/15'
                    : 'bg-slate-100/90 text-slate-500 hover:bg-slate-200/90 hover:text-slate-700'
                  }
                `}
              >
                <span className="text-[15px] leading-none shrink-0">{item.icon}</span>
                <span className="truncate text-[13px] sm:text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
