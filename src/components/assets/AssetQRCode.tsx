'use client';

import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useApp } from '@/contexts/AppContext';

interface AssetQRCodeProps {
  assetId: string;
  assetCode: string;
  assetName: string;
  department?: string;
  branch?: string;
}

export function AssetQRCode({ assetId, assetCode, assetName, department, branch }: AssetQRCodeProps) {
  const { t, companyLogo } = useApp();
  const [qrDataUrl, setQrDataUrl] = useState('');
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const payload = JSON.stringify({
      id: assetId,
      code: assetCode,
      name: assetName,
      url: typeof window !== 'undefined' ? `${window.location.origin}/assets/${assetId}` : '',
    });

    QRCode.toDataURL(payload, {
      width: 200,
      margin: 2,
      color: { dark: '#2d6853', light: '#ffffff' },
    }).then(setQrDataUrl).catch(() => {});
  }, [assetId, assetCode, assetName]);

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
            .logo { max-width: 80px; max-height: 40px; margin-bottom: 12px; }
            .qr { margin: 12px auto; }
            .qr img { width: 180px; height: 180px; }
            .code { font-family: monospace; font-size: 16px; font-weight: bold; color: #2d6853; margin: 8px 0; }
            .name { font-size: 14px; font-weight: 600; color: #333; margin-bottom: 4px; }
            .meta { font-size: 11px; color: #666; margin-top: 4px; }
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

  return (
    <div className="premium-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-900">{t('qrCode')}</h3>
        <Button size="sm" variant="secondary" onClick={handlePrint}>
          <Printer className="w-4 h-4" /> {t('print')}
        </Button>
      </div>

      <div ref={printRef}>
        <div className="label border-2 border-lotus-200 rounded-xl p-6 text-center mx-auto max-w-[280px]">
          {companyLogo && <img src={companyLogo} alt="Logo" className="logo max-w-[80px] max-h-[40px] mx-auto mb-3 object-contain" />}
          <div className="qr">
            <img src={qrDataUrl} alt="QR Code" className="w-[180px] h-[180px] mx-auto" />
          </div>
          <p className="code font-mono text-base font-bold text-lotus-700 mt-3">{assetCode}</p>
          <p className="name text-sm font-semibold text-slate-800">{assetName}</p>
          {department && <p className="meta text-xs text-slate-500 mt-1">{department}</p>}
          {branch && <p className="meta text-xs text-slate-500">{branch}</p>}
          <p className="brand text-[10px] text-slate-400 mt-3 pt-2 border-t border-slate-100">{t('appName')}</p>
        </div>
      </div>
    </div>
  );
}
