'use client';

import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Printer, Shield } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useApp } from '@/contexts/AppContext';
import { getSecureScanUrl } from '@/lib/qr-url';

interface AssetQRCodeProps {
  assetId: string;
  assetCode: string;
  assetName: string;
  department?: string;
  branch?: string;
}

export function AssetQRCode({ assetId, assetCode, assetName, department, branch }: AssetQRCodeProps) {
  const { t, companyLogo, locale } = useApp();
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [scanUrl, setScanUrl] = useState('');
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/assets/${assetId}/qr`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (!data?.qrToken) return;
        const url = getSecureScanUrl(window.location.origin, data.qrToken);
        setScanUrl(url);
        return QRCode.toDataURL(url, {
          width: 200,
          margin: 2,
          color: { dark: '#2d6853', light: '#ffffff' },
        });
      })
      .then((dataUrl) => { if (dataUrl) setQrDataUrl(dataUrl); })
      .catch(() => {});
  }, [assetId]);

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${assetCode} - QR Label</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
            .label { border: 2px solid #2d6853; border-radius: 12px; padding: 24px; text-align: center; width: 280px; }
            .logo { max-width: 160px; max-height: 48px; margin-bottom: 12px; }
            .qr { margin: 12px auto; }
            .qr img { width: 180px; height: 180px; }
            .code { font-family: monospace; font-size: 16px; font-weight: bold; color: #2d6853; margin: 8px 0; }
            .name { font-size: 14px; font-weight: 600; color: #333; margin-bottom: 4px; }
            .meta { font-size: 11px; color: #666; margin-top: 4px; }
            .secure { font-size: 10px; color: #b45309; margin-top: 8px; }
            .brand { font-size: 10px; color: #999; margin-top: 12px; border-top: 1px solid #eee; padding-top: 8px; }
            @media print { body { min-height: auto; } .label { border-width: 1px; } }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 300);
  };

  if (!qrDataUrl) return null;

  const secureNote = locale === 'ar'
    ? 'رمز محمي — لا يعرض بيانات حساسة عند المسح'
    : 'Secured — no sensitive data when scanned';

  return (
    <div className="premium-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-900">{t('qrCode')}</h3>
        <Button size="sm" variant="secondary" onClick={handlePrint}>
          <Printer className="w-4 h-4" /> {t('print')}
        </Button>
      </div>

      <div className="flex items-center gap-2 mb-4 p-3 bg-lotus-50 rounded-xl text-xs text-lotus-800">
        <Shield className="w-4 h-4 shrink-0" />
        <span>{secureNote}</span>
      </div>

      <div ref={printRef}>
        <div className="label border-2 border-lotus-200 rounded-xl p-6 text-center mx-auto max-w-[280px]">
          {companyLogo && <img src={companyLogo} alt="Logo" className="logo h-10 w-auto max-w-[160px] mx-auto mb-3 object-contain" />}
          <div className="qr">
            <img src={qrDataUrl} alt="QR Code" className="w-[180px] h-[180px] mx-auto" />
          </div>
          <p className="code font-mono text-base font-bold text-lotus-700 mt-3">{assetCode}</p>
          <p className="name text-sm font-semibold text-slate-800">{assetName}</p>
          {department && <p className="meta text-xs text-slate-500 mt-1">{department}</p>}
          {branch && <p className="meta text-xs text-slate-500">{branch}</p>}
          <p className="secure text-[10px] text-amber-700 mt-2">{secureNote}</p>
          <p className="brand text-[10px] text-slate-400 mt-3 pt-2 border-t border-slate-100">{t('appName')}</p>
        </div>
      </div>
      {scanUrl && (
        <p className="text-[10px] text-slate-400 mt-3 break-all text-center">{scanUrl}</p>
      )}
    </div>
  );
}
