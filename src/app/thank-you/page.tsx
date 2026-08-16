'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Download, CheckCircle2, Mail, ArrowLeft } from 'lucide-react';
import { SITE, buildSections, pdfTitle, STORAGE_KEY } from '@/lib/content';
import { normalizePlan, PLAN_LABELS, type PlanId, type UserData } from '@/lib/types';

export default function ThankYouPage() {
  const [userData, setUserData] = useState<UserData>({});
  const [plan, setPlan] = useState<PlanId>('full');
  const [ready, setReady] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [emailState, setEmailState] = useState<'idle' | 'sent' | 'failed'>('idle');
  const emailFired = useRef(false);

  useEffect(() => {
    let data: UserData = {};
    try {
      data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') as UserData;
    } catch {
      data = {};
    }
    if (!data || typeof data !== 'object') data = {};

    const storedPlan = normalizePlan(localStorage.getItem('selected_plan'));
    setUserData(data);
    setPlan(storedPlan);
    setReady(true);

    if (!emailFired.current && data.email) {
      emailFired.current = true;
      fetch('/api/send-result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userData: data, plan: storedPlan }),
      })
        .then((r) => r.json())
        .then((r) => setEmailState(r?.ok ? 'sent' : 'failed'))
        .catch(() => setEmailState('failed'));
    }
  }, []);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userData, plan }),
      });
      if (!res.ok) throw new Error('PDF generation failed');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'result.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setDownloaded(true);
    } catch (e) {
      console.error(e);
    }
    setDownloading(false);
  };

  const sections = ready ? buildSections(userData, plan) : [];

  return (
    <main className="ty-wrap">
      <div className="ty-head">
        <CheckCircle2 size={64} strokeWidth={1.4} className="ty-check" />
        <h1 className="ty-title">Оплата прошла успешно</h1>
        <p className="ty-sub">
          Тариф: <strong>{PLAN_LABELS[plan]}</strong>
        </p>
        {userData.name ? <p className="ty-name">{userData.name}</p> : null}

        <p className="ty-mail">
          <Mail size={16} strokeWidth={1.6} />
          {emailState === 'sent'
            ? `Результат отправлен на ${userData.email}`
            : emailState === 'failed'
              ? 'Письмо не удалось отправить — скачайте PDF ниже'
              : 'Отправляем результат на вашу почту...'}
        </p>

        <button onClick={handleDownload} disabled={downloading} className="ty-btn">
          <Download size={22} strokeWidth={1.8} />
          {downloading
            ? 'Генерируем PDF...'
            : downloaded
              ? 'PDF скачан — скачать снова'
              : 'Скачать PDF результат'}
        </button>
      </div>

      <section className="ty-result">
        <h2 className="ty-result-title">{ready ? pdfTitle(userData) : SITE.name}</h2>
        <p className="ty-result-note">Полный результат — доступ открыт</p>

        {sections.map((s, i) => (
          <article key={i} className="ty-card">
            <h3 className="ty-card-title">{s.title}</h3>
            {s.content.split('\n').map((line, j) => (
              <p key={j} className="ty-card-text">
                {line}
              </p>
            ))}
          </article>
        ))}
      </section>

      <footer className="ty-foot">
        <Link href="/" className="ty-back">
          <ArrowLeft size={15} strokeWidth={1.8} />
          На главную
        </Link>
        <p>Если письмо не пришло — проверьте папку «Спам».</p>
        <p>По вопросам: danyavdkmvv3@gmail.com · @dvdkmv</p>
      </footer>
    </main>
  );
}
