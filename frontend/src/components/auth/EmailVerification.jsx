import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendVerificationEmail, verifyEmailCode } from '../../api/authApi';
import toast from 'react-hot-toast';

const TIMER_SECONDS = 300;

export default function EmailVerification({ onVerified }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [step, setStep] = useState('email'); // email | code | done
  const [timer, setTimer] = useState(0);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const inputRefs = useRef([]);

  useEffect(() => {
    if (timer <= 0) return;
    const id = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [timer]);

  const formatTime = (sec) => {
    const m = String(Math.floor(sec / 60)).padStart(2, '0');
    const s = String(sec % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  const isYonseiEmail = (e) => e.toLowerCase().endsWith('@yonsei.ac.kr');

  // ──────────────────────────────────────────
  // 1) 인증번호 발송
  // ──────────────────────────────────────────
  const handleSendCode = useCallback(async () => {
    if (!email.trim()) {
      toast.error('이메일을 입력해주세요.');
      return;
    }
    if (!isYonseiEmail(email)) {
      alert('@yonsei.ac.kr 메일만 사용할 수 있습니다.');
      return;
    }

    setSending(true);
    try {
      const res = await sendVerificationEmail(email);
      setStep('code');
      setTimer(TIMER_SECONDS);
      setCode(['', '', '', '', '', '']);

      // 서버 응답 메시지를 alert로 표시
      alert(res.data?.message || '메일이 발송되었습니다.');
      toast.success('인증번호를 입력해주세요!');
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch (err) {
      const msg = err.response?.data?.message || '메일 발송에 실패했습니다.';
      alert(msg);
    } finally {
      setSending(false);
    }
  }, [email]);

  // ──────────────────────────────────────────
  // 2) 인증번호 확인
  // ──────────────────────────────────────────
  const handleVerify = useCallback(async () => {
    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      toast.error('6자리 인증 번호를 입력해주세요.');
      return;
    }

    setVerifying(true);
    try {
      const res = await verifyEmailCode(email, fullCode);
      setStep('done');

      // 인증 성공 alert
      alert(res.data?.message || '인증 성공!');
      toast.success('이메일 인증이 완료되었습니다!');

      onVerified?.(email);

      // 3초 후 다음 페이지(합승 목록)로 이동
      setTimeout(() => navigate('/rides'), 2000);
    } catch (err) {
      const msg = err.response?.data?.message || '인증에 실패했습니다.';
      alert(msg);
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setVerifying(false);
    }
  }, [code, email, onVerified, navigate]);

  const handleCodeChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];

    // 붙여넣기로 6자리가 한번에 들어온 경우
    if (value.length === 6) {
      const digits = value.split('').slice(0, 6);
      digits.forEach((d, i) => (newCode[i] = d));
      setCode(newCode);
      inputRefs.current[5]?.focus();
      return;
    }

    newCode[index] = value.slice(-1);
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'Enter' && code.every((d) => d !== '')) {
      handleVerify();
    }
  };

  // ──────────────────────────────────────────
  // 인증 완료 화면
  // ──────────────────────────────────────────
  if (step === 'done') {
    return (
      <div className="w-full max-w-md mx-auto text-center py-8">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
          <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-1">인증 완료!</h3>
        <p className="text-gray-500 text-sm mb-4">{email}</p>
        <p className="text-gray-400 text-xs">잠시 후 합승 페이지로 이동합니다...</p>
      </div>
    );
  }

  // ──────────────────────────────────────────
  // 메인 UI
  // ──────────────────────────────────────────
  return (
    <div className="w-full max-w-md mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-800 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200">
          <span className="text-2xl">🏫</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">연세대학교 메일 인증</h2>
        <p className="text-gray-500 text-sm">재학생 인증을 위해 학교 메일을 확인합니다</p>
      </div>

      {/* Email Input */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">학교 이메일</label>
        <div className="relative">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && step === 'email' && handleSendCode()}
            disabled={step === 'code'}
            placeholder="학번@yonsei.ac.kr"
            className={`
              w-full px-4 py-3.5 rounded-xl border-2 text-sm font-medium
              transition-all duration-200 outline-none
              ${step === 'code'
                ? 'bg-gray-50 border-gray-200 text-gray-500'
                : 'border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'
              }
            `}
          />
          {step === 'code' && (
            <button
              onClick={() => { setStep('email'); setTimer(0); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-blue-600 font-semibold hover:text-blue-800"
            >
              변경
            </button>
          )}
        </div>
        <p className="mt-1.5 text-xs text-gray-400">@yonsei.ac.kr 도메인만 가능합니다</p>
      </div>

      {/* Step: email → 발송 버튼 */}
      {step === 'email' ? (
        <button
          onClick={handleSendCode}
          disabled={sending || !email.trim()}
          className={`
            w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-200
            ${sending || !email.trim()
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-800 to-blue-600 text-white hover:shadow-lg hover:shadow-blue-200 hover:-translate-y-0.5 active:translate-y-0'
            }
          `}
        >
          {sending ? (
            <span className="inline-flex items-center gap-2">
              <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              발송 중...
            </span>
          ) : (
            '인증번호 발송'
          )}
        </button>
      ) : (
        <div>
          {/* Timer */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-600">인증 번호 입력</span>
            <span className={`
              text-sm font-bold tabular-nums
              ${timer <= 60 ? 'text-red-500' : 'text-blue-600'}
            `}>
              {timer > 0 ? formatTime(timer) : '만료됨'}
            </span>
          </div>

          {/* 6-digit Code Inputs */}
          <div className="flex gap-2 mb-4">
            {code.map((digit, i) => (
              <input
                key={i}
                ref={(el) => (inputRefs.current[i] = el)}
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={digit}
                onChange={(e) => handleCodeChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onPaste={(e) => {
                  e.preventDefault();
                  const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
                  if (pasted.length === 6) handleCodeChange(0, pasted);
                }}
                className={`
                  w-full aspect-square max-w-[52px] text-center text-xl font-bold
                  rounded-xl border-2 outline-none transition-all duration-200
                  ${digit
                    ? 'border-blue-500 bg-blue-50 text-blue-800'
                    : 'border-gray-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-100'
                  }
                `}
              />
            ))}
          </div>

          {/* Timer Progress Bar */}
          <div className="w-full h-1 bg-gray-100 rounded-full mb-5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-linear
                ${timer <= 60 ? 'bg-red-400' : 'bg-blue-500'}
              `}
              style={{ width: `${(timer / TIMER_SECONDS) * 100}%` }}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleSendCode}
              disabled={sending || timer > TIMER_SECONDS - 60}
              className={`
                flex-1 py-3 rounded-xl font-semibold text-sm border-2 transition-all
                ${sending || timer > TIMER_SECONDS - 60
                  ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                  : 'border-blue-200 text-blue-600 hover:bg-blue-50'
                }
              `}
            >
              재발송
            </button>
            <button
              onClick={handleVerify}
              disabled={verifying || code.some((d) => !d) || timer <= 0}
              className={`
                flex-[2] py-3 rounded-xl font-semibold text-sm transition-all duration-200
                ${verifying || code.some((d) => !d) || timer <= 0
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-800 to-blue-600 text-white hover:shadow-lg hover:shadow-blue-200'
                }
              `}
            >
              {verifying ? (
                <span className="inline-flex items-center gap-2">
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  확인 중...
                </span>
              ) : (
                '인증 확인'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
