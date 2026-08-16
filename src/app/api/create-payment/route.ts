import { NextRequest, NextResponse } from 'next/server';
import { createPayment } from '@/lib/yookassa';
import { SITE, PLANS } from '@/lib/content';
import { normalizePlan, PLAN_LABELS } from '@/lib/types';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const plan = normalizePlan(body?.plan);
    const userData = (body?.userData ?? {}) as Record<string, string>;

    const selected = PLANS.find((p) => p.id === plan);
    if (!selected) {
      return NextResponse.json({ error: 'Unknown plan' }, { status: 400 });
    }

    const origin =
      req.headers.get('origin') ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      SITE.url;

    // metadata ЮKassa: максимум 16 ключей, значения — строки.
    const compact = JSON.stringify(userData).slice(0, 500);

    const payment = await createPayment({
      amount: selected.price,
      description: `${SITE.name} — ${PLAN_LABELS[plan]}`,
      returnUrl: `${origin}/thank-you`,
      metadata: {
        plan,
        userName: (userData.name || 'Клиент').slice(0, 100),
        userEmail: (userData.email || '').slice(0, 100),
        data: compact,
      },
    });

    return NextResponse.json({
      id: payment.id,
      confirmationUrl: payment.confirmationUrl,
    });
  } catch (e) {
    console.error('create-payment error:', e);
    return NextResponse.json(
      { error: 'Не удалось создать платёж. Попробуйте ещё раз.' },
      { status: 500 }
    );
  }
}
