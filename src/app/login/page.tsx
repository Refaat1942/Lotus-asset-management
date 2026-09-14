'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Globe } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CompanyLogo } from '@/components/ui/CompanyLogo';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { t, setUser, locale, setLocale, companyLogo } = useApp();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 503) {
          setError(data.error || 'Database not configured. Check DATABASE_URL and run npm run db:seed on the server.');
        } else {
          setError(data.error || t('invalidCredentials'));
        }
        return;
      }

      setUser(data.user);
      router.push('/dashboard');
      router.refresh();
    } catch {
      setError(t('error'));
    } finally {
      setLoading(false);
    }
  };

  const toggleLanguage = () => setLocale(locale === 'en' ? 'ar' : 'en');

  const tagline = locale === 'ar'
    ? 'نظام متكامل لإدارة أصول الشركة بكفاءة واحترافية'
    : 'A comprehensive system for efficient and professional company asset management';

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 gradient-header relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-gold-400 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20 text-white w-full">
          {companyLogo ? (
            <>
              <CompanyLogo
                src={companyLogo}
                size="hero"
                className="mix-blend-multiply drop-shadow-sm"
              />
              <p className="mt-10 text-lg text-white/90 leading-relaxed max-w-md">{tagline}</p>
            </>
          ) : (
            <>
              <h1 className="text-4xl font-bold mb-4">{t('appName')}</h1>
              <p className="text-lg text-white/80 max-w-md leading-relaxed">{tagline}</p>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 bg-slate-50">
        <div className="w-full max-w-md">
          <div className="flex justify-end mb-4">
            <button onClick={toggleLanguage} className="flex items-center gap-2 text-sm text-slate-500 hover:text-lotus-600 transition-colors">
              <Globe className="w-4 h-4" />
              {locale === 'en' ? 'العربية' : 'English'}
            </button>
          </div>

          {companyLogo && (
            <div className="mb-8 lg:hidden flex justify-center">
              <CompanyLogo src={companyLogo} size="lg" className="!h-28 !max-w-[320px]" />
            </div>
          )}

          <div className="premium-card p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900">{t('welcomeBack')}</h2>
              <p className="text-slate-500 mt-2">{t('signInToContinue')}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label={t('username')}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
              />
              <Input
                label={t('password')}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                  {error}
                </div>
              )}

              <Button type="submit" loading={loading} className="w-full">
                {t('login')}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
