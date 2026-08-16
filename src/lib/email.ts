import { Resend } from 'resend';

function client() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

export interface SendResultArgs {
  to: string;
  subject: string;
  userName: string;
  resultHtml: string;
  pdfBuffer: Buffer;
  fileName: string;
  siteName: string;
  accentColor?: string;
}

export async function sendResultEmail({
  to,
  subject,
  userName,
  resultHtml,
  pdfBuffer,
  fileName,
  siteName,
  accentColor = '#C8A96E',
}: SendResultArgs) {
  const resend = client();
  if (!resend) {
    console.error('RESEND_API_KEY is not set — email skipped');
    return { data: null, error: { message: 'RESEND_API_KEY missing' } };
  }

  return resend.emails.send({
    from: process.env.RESEND_FROM || 'onboarding@resend.dev',
    to,
    subject,
    html: `
      <div style="font-family:Georgia,'Times New Roman',serif;max-width:640px;margin:0 auto;padding:40px 24px;background:#0a0a0a;color:#f0ede8;">
        <h1 style="color:${accentColor};font-size:22px;margin:0 0 20px;">${siteName}</h1>
        <p style="font-size:16px;margin:0 0 8px;">Здравствуйте, ${userName}!</p>
        <p style="font-size:15px;margin:0 0 24px;color:#c9c3b8;">
          Ваш персональный результат готов. PDF прикреплён к письму.
        </p>
        <div style="background:#161616;padding:24px;border-radius:8px;margin-bottom:24px;border-left:3px solid ${accentColor};">
          ${resultHtml}
        </div>
        <hr style="border:none;border-top:1px solid #333;margin:24px 0;"/>
        <p style="font-size:11px;color:#777;line-height:1.7;margin:0;">
          ${siteName} · Евдокимов Даниил Владимирович<br/>
          ИНН 381928138362 · Самозанятый<br/>
          danyavdkmvv3@gmail.com · @dvdkmv
        </p>
      </div>
    `,
    attachments: [{ filename: fileName, content: pdfBuffer }],
  });
}

export function sectionsToHtml(
  sections: { title: string; content: string }[],
  accentColor = '#C8A96E'
): string {
  return sections
    .map(
      (s) =>
        `<p style="margin:0 0 16px;"><strong style="color:${accentColor};font-size:15px;">${s.title}</strong><br/>
         <span style="font-size:14px;line-height:1.7;color:#e6e1d8;">${s.content.replace(/\n/g, '<br/>')}</span></p>`
    )
    .join('');
}
