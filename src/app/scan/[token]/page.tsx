'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Shield, Lock } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';

export default function SecureScanPage({ params }: { params: { token: string } }) {
  const { t, locale, user } = useApp();
  const [assetCode, setAssetCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/scan/${params.token}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.assetCode) setAssetCode(data.assetCode);
        else setNotFound(true);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [params.token]);

  const isAr = locale === 'ar';

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="premium-card p-8 max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-lotus-50 flex items-center justify-center mx-auto">
          <Shield className="w-8 h-8 text-lotus-600" />
        </div>

        {loading && <p className="text-slate-500">{t('loading')}</p>}

        {notFound && !loading && (
          <>
            <h1 className="text-xl font-bold text-slate-900">
              {isAr ? 'رمز غير صالح' : 'Invalid Tag'}
            </h1>
            <p className="text-sm text-slate-500">
              {isAr ? 'هذا الرمز غير معروف أو منتهي الصلاحية.' : 'This asset tag is not recognized.'}
            </p>
          </>
        )}

        {assetCode && !loading && (
          <>
            <h1 className="text-xl font-bold text-slate-900">
              {isAr ? 'أصل مسجّل' : 'Registered Asset'}
            </h1>
            <p className="font-mono text-2xl font-bold text-lotus-700">{assetCode}</p>
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-left">
              <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                {isAr
                  ? 'هذا الرمز محمي. تفاصيل الأصل (بيانات الموظف، كلمات المرور، IP) متاحة فقط للمستخدمين المسجّلين داخل النظام.'
                  : 'This tag is secured. Asset details (employee data, passwords, IP) are only visible to logged-in system users.'}
              </p>
            </div>
            {user ? (
              <Link href="/assets" className="btn-primary inline-flex">
                {isAr ? 'فتح النظام' : 'Open System'}
              </Link>
            ) : (
              <Link href="/login" className="btn-primary inline-flex">
                {isAr ? 'تسجيل الدخول لعرض التفاصيل' : 'Login to View Details'}
              </Link>
            )}
          </>
        )}
      </div>
    </div>
  );
}
