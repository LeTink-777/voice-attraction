'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Lock, Check, AudioLines, Volume2, ArrowRight, TrendingUp } from 'lucide-react';
import {
  PLANS,
  STORAGE_KEY,
  TRAIT_NAMES,
  computeResult,
  parseAnswers,
  SITE,
  type VoiceResult,
} from '@/lib/content';
import type { PlanId, UserData } from '@/lib/types';

// Высота столбиков волны для каждого тарифа — амплитуда растёт с уровнем.
const WAVES: number[][] = [
  [8, 12, 9, 14, 10, 13, 8, 11, 9, 12, 8, 10],
  [10, 20, 14, 26, 18, 30, 16, 24, 12, 22, 15, 19],
  [14, 30, 22, 42, 28, 46, 24, 40, 20, 36, 26, 32],
];

export default function ResultPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [result, setResult] = useState<VoiceResult | null>(null);
  const [paying, setPaying] = useState<PlanId | null>(null);
  const [payError, setPayError] = useState('');

  useEffect(() => {
    let data: UserData = {};
    try {
      data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') as UserData;
    } catch {
      data = {};
    }
    const answers = parseAnswers(data.answers);
    if (!answers) {
      router.replace('/');
      return;
    }
    setUser(data);
    setResult(computeResult(answers));
  }, [router]);

  const pay = async (plan: PlanId) => {
    if (!user) return;
    setPaying(plan);
    setPayError('');
    localStorage.setItem('selected_plan', plan);
    try {
      const res = await fetch('/api/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, userData: user }),
      });
      const data = await res.json();
      if (data?.confirmationUrl) {
        window.location.href = data.confirmationUrl;
        return;
      }
      setPayError(data?.error || 'Не удалось создать платёж. Попробуйте ещё раз.');
    } catch {
      setPayError('Сервис оплаты временно недоступен. Попробуйте через минуту.');
    }
    setPaying(null);
  };

  if (!user || !result) {
    return (
      <main className="shell" style={{ padding: '120px 20px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Считаем волну...</p>
      </main>
    );
  }

  return (
    <>
      <main className="shell" style={{ paddingTop: 48 }}>
        <motion.section
          className="score-panel"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="score-big">{result.score}</div>
          <div className="score-of">из 100 баллов</div>
          <h1 className="score-band">{result.bandLabel}</h1>

          <div className="score-track">
            <motion.span
              initial={{ width: 0 }}
              animate={{ width: `${result.score}%` }}
              transition={{ duration: 1, delay: 0.2 }}
            />
          </div>
          <div className="score-legend">
            <span>Заблокировано</span>
            <span>Среднее</span>
            <span>Высокое</span>
          </div>
        </motion.section>

        <div className="rule">
          <Volume2 size={17} strokeWidth={1.7} />
        </div>

        <section className="narrow">
          <div className="info-card">
            <h3>
              <TrendingUp size={17} strokeWidth={1.8} />
              Ваша главная сила
            </h3>
            <p>{TRAIT_NAMES[result.strengths[0]]} — это работает на вас лучше всего.</p>
          </div>

          <div className="lock-stack">
            <div className="lock-veil">
              <Lock size={26} strokeWidth={1.6} color="var(--accent)" />
              <h3>Волна на минимуме</h3>
              <p>
                Все сильные стороны, зоны роста, конкретные фразы и скрипты —
                открываются амплитудой ниже.
              </p>
            </div>

            <div className="locked-blur" aria-hidden="true">
              <div className="info-card">
                <h3>
                  <AudioLines size={17} strokeWidth={1.8} />
                  Сильные стороны
                </h3>
                {result.strengths.map((t) => (
                  <div className="trait-row" key={t}>
                    <strong>{TRAIT_NAMES[t]}</strong>
                    <span>Работает на вас</span>
                  </div>
                ))}
              </div>
              <div className="info-card">
                <h3>
                  <AudioLines size={17} strokeWidth={1.8} />
                  Зоны роста
                </h3>
                {result.weaknesses.map((t) => (
                  <div className="trait-row" key={t}>
                    <strong>{TRAIT_NAMES[t]}</strong>
                    <span>Здесь теряется притяжение</span>
                  </div>
                ))}
              </div>
              <div className="info-card">
                <h3>
                  <AudioLines size={17} strokeWidth={1.8} />
                  Полный анализ стиля
                </h3>
                <p>{result.analysis}</p>
              </div>
            </div>
          </div>
        </section>

        <div className="rule">
          <AudioLines size={17} strokeWidth={1.7} />
        </div>

        <section>
          <h2 className="section-title">Выберите амплитуду</h2>
          <p className="section-lead">
            Чем выше волна, тем глубже разбор: от полного балла до персональных фраз и
            30-дневной практики.
          </p>

          <div className="amps">
            {PLANS.map((plan, index) => {
              const discount = Math.round((1 - plan.price / plan.oldPrice) * 100);
              return (
                <div
                  key={plan.id}
                  className="amp"
                  data-featured={plan.featured ? 'true' : 'false'}
                >
                  {plan.featured ? <span className="amp-badge">Выбор большинства</span> : null}

                  <div className="amp-wave" aria-hidden="true">
                    {WAVES[index].map((h, i) => (
                      <i key={i} style={{ height: h }} />
                    ))}
                  </div>

                  <h3>{plan.name}</h3>
                  <p className="amp-tagline">{plan.tagline}</p>

                  <div className="amp-price">
                    <span className="now">{plan.price} ₽</span>
                    <span className="was">{plan.oldPrice} ₽</span>
                    <span className="off">−{discount}%</span>
                  </div>

                  <ul className="amp-features">
                    {plan.features.map((f) => (
                      <li key={f}>
                        <Check size={15} strokeWidth={2.4} />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <button
                    className="amp-cta"
                    disabled={paying !== null}
                    onClick={() => pay(plan.id)}
                  >
                    {paying === plan.id ? (
                      'Открываем оплату...'
                    ) : (
                      <>
                        Усилить волну
                        <ArrowRight size={16} strokeWidth={2} />
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {payError ? (
            <p className="field-error" style={{ textAlign: 'center', marginTop: 20 }}>
              {payError}
            </p>
          ) : null}

          <p
            style={{
              textAlign: 'center',
              marginTop: 26,
              fontSize: 13.5,
              color: 'var(--text-secondary)',
            }}
          >
            Оплата через ЮKassa. Доступны карты, СБП, кошельки и рассрочка.
            <br />
            Результат открывается сразу после оплаты и дублируется на почту.
          </p>
        </section>
      </main>

      <footer className="site-foot shell">
        <p>
          <Link href="/privacy">Политика конфиденциальности</Link>
          <Link href="/offer">Публичная оферта</Link>
        </p>
        <p>
          Евдокимов Даниил Владимирович · ИНН 381928138362 · Самозанятый
          <br />
          danyavdkmvv3@gmail.com · @dvdkmv
        </p>
        <p className="disclaimer">
          {SITE.name} — развлекательный сервис. Тест не является психологической
          диагностикой.
        </p>
      </footer>
    </>
  );
}
