import { NextRequest, NextResponse } from 'next/server';
import { getAssistantReply } from '@/lib/assistant-engine';
import { Locale } from '@/lib/i18n';

export async function POST(request: NextRequest) {
  try {
    const { message, locale } = await request.json();
    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message required' }, { status: 400 });
    }

    const lang: Locale = locale === 'ar' ? 'ar' : 'en';
    const reply = getAssistantReply(message, lang);

    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json({ error: 'Failed to process message' }, { status: 500 });
  }
}
