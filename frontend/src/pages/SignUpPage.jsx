import { useNavigate } from 'react-router-dom';
import EmailVerification from '../components/auth/EmailVerification';

export default function SignUpPage() {
  const navigate = useNavigate();

  const handleVerified = (email) => {
    console.log('Verified email:', email);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <h1 className="text-lg font-bold text-gray-900">회원가입</h1>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-start justify-center pt-12 px-4">
        <EmailVerification onVerified={handleVerified} />
      </main>
    </div>
  );
}
