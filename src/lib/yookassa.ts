import { randomUUID } from 'crypto';

const API = 'https://api.yookassa.ru/v3/payments';

export interface CreatePaymentArgs {
  amount: number;
  description: string;
  returnUrl: string;
  metadata: Record<string, string>;
}

export interface CreatePaymentResult {
  id: string;
  confirmationUrl: string;
}

/**
 * Создаёт платёж в ЮKassa.
 * payment_method_type намеренно не передаётся — тогда ЮKassa показывает
 * пользователю все доступные способы оплаты.
 */
export async function createPayment({
  amount,
  description,
  returnUrl,
  metadata,
}: CreatePaymentArgs): Promise<CreatePaymentResult> {
  const shopId = process.env.NEXT_PUBLIC_YUKASSA_SHOP_ID;
  const secretKey = process.env.YUKASSA_SECRET_KEY;

  if (!shopId || !secretKey) {
    throw new Error('YooKassa credentials are not configured');
  }

  const auth = Buffer.from(`${shopId}:${secretKey}`).toString('base64');

  const res = await fetch(API, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Idempotence-Key': randomUUID(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: { value: amount.toFixed(2), currency: 'RUB' },
      capture: true,
      confirmation: { type: 'redirect', return_url: returnUrl },
      description: description.slice(0, 128),
      metadata,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    console.error('YooKassa error:', data);
    throw new Error(data?.description || 'YooKassa request failed');
  }

  return {
    id: data.id as string,
    confirmationUrl: data.confirmation?.confirmation_url as string,
  };
}
