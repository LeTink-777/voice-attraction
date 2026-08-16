import { NextRequest, NextResponse } from 'next/server';
import { generatePDF } from '@/lib/pdf-generator';
import { SITE, buildSections, pdfTitle } from '@/lib/content';
import { normalizePlan, PLAN_LABELS } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const userData = (body?.userData ?? {}) as Record<string, string>;
    const plan = normalizePlan(body?.plan);

    const sections = buildSections(userData, plan);

    const pdfBuffer = await generatePDF({
      title: pdfTitle(userData),
      subtitle: `${SITE.name} · Тариф: ${PLAN_LABELS[plan]}`,
      userName: userData.name?.trim() || 'Дорогой клиент',
      sections,
      siteName: SITE.name,
      accentColor: SITE.accent,
      theme: SITE.theme,
      fontFamily: SITE.pdfFont,
    });

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="result.pdf"',
        'Cache-Control': 'no-store',
      },
    });
  } catch (e) {
    console.error('PDF error:', e);
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 });
  }
}
