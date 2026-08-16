import { NextRequest, NextResponse } from 'next/server';
import { generatePDF } from '@/lib/pdf-generator';
import { sendResultEmail, sectionsToHtml } from '@/lib/email';
import { SITE, buildSections, pdfTitle } from '@/lib/content';
import { normalizePlan, PLAN_LABELS, type UserData } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body?.event !== 'payment.succeeded') {
      return NextResponse.json({ ok: true, skipped: body?.event ?? 'unknown' });
    }

    const metadata = (body.object?.metadata ?? {}) as Record<string, string>;
    const plan = normalizePlan(metadata.plan);
    const userEmail = metadata.userEmail;
    const userName = metadata.userName?.trim() || 'Клиент';

    let userData: UserData = {};
    if (metadata.data) {
      try {
        const parsed = JSON.parse(metadata.data);
        if (parsed && typeof parsed === 'object') userData = parsed as UserData;
      } catch {
        // metadata.data повреждена — работаем с тем, что есть
      }
    }
    if (!userData.name) userData.name = userName;
    if (userEmail && !userData.email) userData.email = userEmail;

    const sections = buildSections(userData, plan);

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

    if (userEmail) {
      const preview = sections.slice(0, 3);
      await sendResultEmail({
        to: userEmail,
        subject: `${SITE.name} — ваш результат готов`,
        userName,
        resultHtml: sectionsToHtml(preview, SITE.accent),
        pdfBuffer,
        fileName: 'result.pdf',
        siteName: SITE.name,
        accentColor: SITE.accent,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Webhook error:', e);
    // Возвращаем 200, чтобы ЮKassa не повторяла доставку бесконечно.
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
