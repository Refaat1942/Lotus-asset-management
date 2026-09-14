'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const QUICK_PROMPTS = {
  en: ['How to import Excel?', 'Secure QR codes?', 'Available reports?', 'Dashboard help'],
  ar: ['كيف أستورد Excel؟', 'حماية رمز QR؟', 'التقارير المتاحة؟', 'مساعدة لوحة التحكم'],
};

export function SmartAssistant() {
  const { locale, t } = useApp();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: locale === 'ar'
          ? 'مرحباً! أنا المساعد الذكي لنظام لوتس. اسألني عن أي جزء من النظام بالعربية أو الإنجليزية.'
          : 'Hello! I am the Lotus smart assistant. Ask me about any part of the system in English or Arabic.',
      }]);
    }
  }, [open, locale, messages.length]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: trimmed }]);
    setLoading(true);

    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, locale }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: data.reply || (locale === 'ar' ? 'عذراً، لم أفهم السؤال.' : 'Sorry, I could not understand.'),
      }]);
    } catch {
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: locale === 'ar' ? 'حدث خطأ. حاول مرة أخرى.' : 'An error occurred. Please try again.',
      }]);
    } finally {
      setLoading(false);
    }
  };

  const prompts = locale === 'ar' ? QUICK_PROMPTS.ar : QUICK_PROMPTS.en;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'fixed bottom-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all',
          'bg-lotus-600 text-white hover:bg-lotus-700',
          locale === 'ar' ? 'left-6' : 'right-6'
        )}
        aria-label={t('assistant')}
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>

      {open && (
        <div
          className={cn(
            'fixed bottom-24 z-50 w-[360px] max-w-[calc(100vw-2rem)] h-[480px] flex flex-col',
            'premium-card shadow-elevated overflow-hidden',
            locale === 'ar' ? 'left-6' : 'right-6'
          )}
        >
          <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-lotus-50">
            <div className="w-9 h-9 rounded-xl bg-lotus-600 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-slate-900 text-sm">{t('assistant')}</p>
              <p className="text-xs text-slate-500">{t('assistantSubtitle')}</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  'text-sm rounded-xl px-3 py-2 max-w-[90%] whitespace-pre-wrap',
                  msg.role === 'user'
                    ? 'bg-lotus-600 text-white ms-auto'
                    : 'bg-slate-100 text-slate-800'
                )}
              >
                {msg.content.replace(/\*\*(.*?)\*\*/g, '$1')}
              </div>
            ))}
            {loading && (
              <div className="text-sm text-slate-400 animate-pulse">
                {locale === 'ar' ? 'يكتب...' : 'Typing...'}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="p-3 border-t border-slate-100 space-y-2">
            <div className="flex flex-wrap gap-1">
              {prompts.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => sendMessage(p)}
                  className="text-[10px] px-2 py-1 rounded-full bg-slate-100 text-slate-600 hover:bg-lotus-50 hover:text-lotus-700"
                >
                  {p}
                </button>
              ))}
            </div>
            <form
              onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
              className="flex gap-2"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t('assistantPlaceholder')}
                className="flex-1 text-sm px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-lotus-500"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="w-10 h-10 rounded-xl bg-lotus-600 text-white flex items-center justify-center disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
