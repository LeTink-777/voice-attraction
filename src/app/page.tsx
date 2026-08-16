'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AudioLines, ArrowLeft, Mic, Volume2 } from 'lucide-react';
import { QUESTIONS, STORAGE_KEY, SITE } from '@/lib/content';

const BARS = [16, 30, 44, 26, 38, 20, 46, 28, 34, 18, 42, 24];

export default function HomePage() {
  const router = useRouter();
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const choose = (index: number) => {
    const next = [...answers];
    next[step] = index;
    setAnswers(next);
    setStep(step + 1);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@') || !email.includes('.')) {
      setError('Укажите корректный e-mail — на него придёт результат.');
      return;
    }
    setError('');
    setBusy(true);
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        answers: JSON.stringify(answers),
        name: name.trim() || 'Клиент',
        email: email.trim(),
      })
    );
    router.push('/result');
  };

  const done = step >= QUESTIONS.length;

  return (
    <>
      <main className="shell">
        {!started ? (
          <>
            <section className="hero">
              <span className="hero-mark">
                <Mic size={14} strokeWidth={2} />
                10 вопросов · 2 минуты
              </span>
              <h1>
                Что в твоей речи притягивает — <em>а что отталкивает людей</em>
              </h1>

              <div className="wave-strip" aria-hidden="true">
                {BARS.map((h, i) => (
                  <i key={i} style={{ height: h, animationDelay: `${i * 0.09}s` }} />
                ))}
              </div>

              <p className="hero-sub">
                10 вопросов о стиле общения — и честный разбор вашей коммуникационной
                харизмы. Не о том, что вы говорите, а о том, как это слышат.
              </p>

              <div style={{ maxWidth: 340, margin: '28px auto 0' }}>
                <button className="btn-primary" onClick={() => setStarted(true)}>
                  <AudioLines size={18} strokeWidth={2} />
                  Пройти тест
                </button>
              </div>
              <p className="hero-note" style={{ marginTop: 14 }}>
                Без регистрации. Балл и первые выводы — бесплатно.
              </p>
            </section>

            <div className="rule">
              <Volume2 size={17} strokeWidth={1.7} />
            </div>

            <section className="narrow">
              <h2 className="section-title">Что вы узнаете</h2>
              <p className="section-lead">
                Тест измеряет десять привычек общения, по которым люди бессознательно
                решают, хотят ли они продолжать разговор.
              </p>

              <div style={{ marginTop: 26 }}>
                <div className="faq-item">
                  <h3>Как считается балл?</h3>
                  <p>
                    Каждый ответ оценивается от 0 до 10 баллов по своей привычке —
                    слушание, интерес, реакция на критику, юмор и другие. Итог
                    приводится к шкале от 0 до 100.
                  </p>
                </div>
                <div className="faq-item">
                  <h3>Что я получу бесплатно?</h3>
                  <p>
                    Балл, уровень притяжения, одну сильную сторону и одну зону роста.
                    Полный разбор, конкретные фразы и скрипты открываются в платных
                    тарифах.
                  </p>
                </div>
                <div className="faq-item">
                  <h3>Низкий балл — это про характер?</h3>
                  <p>
                    Нет. Балл измеряет привычки, а не личность. Привычки меняются за
                    недели, и именно поэтому в разборе даны конкретные действия, а не
                    советы «будьте собой».
                  </p>
                </div>
              </div>
            </section>
          </>
        ) : (
          <section className="narrow" style={{ paddingTop: 56 }}>
            <div className="quiz-progress">
              {QUESTIONS.map((_, i) => (
                <span key={i} data-done={i < step ? 'true' : 'false'} />
              ))}
            </div>

            {!done ? (
              <>
                <p className="quiz-step">
                  Вопрос {step + 1} из {QUESTIONS.length}
                </p>
                <h2 className="quiz-question">{QUESTIONS[step].q}</h2>
                <div className="quiz-options">
                  {QUESTIONS[step].options.map((o, i) => (
                    <button className="quiz-option" key={i} onClick={() => choose(i)}>
                      <span className="quiz-option-key" />
                      {o.text}
                    </button>
                  ))}
                </div>
                {step > 0 ? (
                  <button className="quiz-back" onClick={() => setStep(step - 1)}>
                    <ArrowLeft size={15} strokeWidth={2} />
                    Назад
                  </button>
                ) : null}
              </>
            ) : (
              <form className="form-card" onSubmit={submit}>
                <h2 className="quiz-question" style={{ marginBottom: 8 }}>
                  Тест пройден
                </h2>
                <p style={{ color: 'var(--text-secondary)', marginTop: 0, marginBottom: 22 }}>
                  Укажите почту — отправим на неё результат и PDF после открытия доступа.
                </p>

                <div className="field">
                  <label htmlFor="name">Имя</label>
                  <input
                    id="name"
                    type="text"
                    placeholder="Как к вам обращаться"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={40}
                  />
                </div>

                <div className="field">
                  <label htmlFor="email">E-mail</label>
                  <input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                {error ? <p className="field-error">{error}</p> : null}

                <button className="btn-primary" type="submit" disabled={busy}>
                  <AudioLines size={18} strokeWidth={2} />
                  {busy ? 'Считаем волну...' : 'Показать результат'}
                </button>

                <p className="consent">
                  Нажимая кнопку, вы соглашаетесь с{' '}
                  <Link href="/privacy">политикой конфиденциальности</Link> и{' '}
                  <Link href="/offer">условиями оферты</Link>.
                </p>
              </form>
            )}
          </section>
        )}
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
