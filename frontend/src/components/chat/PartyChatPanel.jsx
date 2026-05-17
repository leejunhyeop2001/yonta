import { useEffect, useRef, useState } from 'react';
import { usePartyChat } from '../../hooks/usePartyChat';

export default function PartyChatPanel({ partyId, enabled = true }) {
  const { messages, loading, sending, sendMessage } = usePartyChat(partyId, enabled);
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setInput('');
    await sendMessage(text);
  };

  return (
    <section className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/80 overflow-hidden">
      <header className="px-4 py-2.5 border-b border-slate-200 bg-white flex items-center justify-between">
        <p className="text-sm font-bold text-slate-800">파티 채팅</p>
        <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
          실시간
        </span>
      </header>

      <div className="h-48 overflow-y-auto px-3 py-3 space-y-2">
        {loading ? (
          <p className="text-center text-xs text-slate-400 py-8">채팅 불러오는 중...</p>
        ) : messages.length === 0 ? (
          <p className="text-center text-xs text-slate-400 py-8">
            파티원끼리만 대화할 수 있어요. 첫 메시지를 남겨보세요!
          </p>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="flex flex-col gap-0.5">
              <span className="text-[10px] font-semibold text-slate-500">{msg.senderAlias}</span>
              <div className="inline-block self-start max-w-[85%] rounded-2xl rounded-tl-md bg-white border border-slate-200 px-3 py-2 text-sm text-slate-800 shadow-sm">
                {msg.content}
              </div>
              <span className="text-[9px] text-slate-400">
                {msg.sentAt?.slice(11, 16) ?? ''}
              </span>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 p-3 border-t border-slate-200 bg-white">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={500}
          placeholder="메시지 입력..."
          className="flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="shrink-0 px-4 py-2.5 rounded-xl bg-blue-700 text-white text-sm font-bold disabled:opacity-50"
        >
          전송
        </button>
      </form>
    </section>
  );
}
