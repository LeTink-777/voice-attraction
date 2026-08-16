import { NextRequest, NextResponse } from 'next/server';
import { generatePDF } from '@/lib/pdf-generator';
import { sendResultEmail, sectionsToHtml } from '@/lib/email';
import { SITE, buildSections, pdfTitle } from '@/lib/content';
import { normalizePlan, PLAN_LABELS } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * Резервная доставка письма со страницы /thank-you.
 * Работает даже если вебхук ЮKassa ещё не настроен в личном кабинете.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const userData = (body?.userData ?? {}) as Record<string, string>;
    const plan = normalizePlan(body?.plan);
    const to = (userData.email || '').trim();

    if (!to || !to.includes('@')) {
      return NextResponse.json({ ok: false, reason: 'no-email' });
    }

    const sections = buildSections(userData, plan);
    const userName = userData.name?.trim() || 'Клиент';

    const pdfBuffer = await generatePDF({
      title: pdfTitle(userData),
      subtitle: `${SITE.name} · Тариф: ${PLAN_LABELS[plan]}`,
      userName,
      sections,
      siteName: SITE.name,
      accentColor: SITE.accent,
      theme: SITE.theme,
      fontFamily: SITE.pdfFont,
    });

    await sendResultEmail({
      to,
      subject: `${SITE.name} — ваш результат готов`,
      userName,
      resultHtml: sectionsToHtml(sections.slice(0, 3), SITE.accent),
      pdfBuffer,
      fileName: 'result.pdf',
      siteName: SITE.name,
      accentColor: SITE.accent,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('send-result error:', e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
