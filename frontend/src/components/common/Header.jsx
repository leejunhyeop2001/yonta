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
    <header className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-3xl mx-auto px-4">
        {/* Top Bar */}
        <div className="flex items-center justify-between py-3">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl">🚕</span>
            <h1 className="text-xl font-extrabold bg-gradient-to-r from-blue-800 to-blue-500 bg-clip-text text-transparent">
              연타
            </h1>
          </Link>

          {userName ? (
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-gray-700">{userName}</span>
              <button
                onClick={handleLogout}
                className="text-xs text-gray-400 hover:text-red-500 font-medium transition-colors"
              >
                로그아웃
              </button>
            </div>
          ) : (
            <Link
              to="/auth"
              className="px-4 py-2 rounded-lg bg-blue-800 text-white text-xs font-semibold hover:bg-blue-700 transition-colors"
            >
              로그인
            </Link>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex gap-1 -mb-px">
          {NAV.map((item) => {
            const active = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`
                  flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold
                  border-b-2 transition-all duration-200
                  ${active
                    ? 'border-blue-800 text-blue-800'
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                  }
                `}
              >
                <span className="text-sm">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
