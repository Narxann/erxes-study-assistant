
import { useState } from 'react';

type CheckResult = {
  correct: boolean;
  message: string;
  step?: number;
};

const parseEquation = (text: string): number | null => {
  const cleaned = text.replace(/\s/g, '').replace(/−/g, '-');

  const match = cleaned.match(/^(-?\d*)x([+-]\d+)?=(-?\d+)$/);

  if (!match) return null;

  const coefficient =
    match[1] === '' ? 1 :
    match[1] === '-' ? -1 :
    Number(match[1]);

  const constant = Number(match[2] || 0);
  const right = Number(match[3]);

  if (coefficient === 0) return null;

  return (right - constant) / coefficient;
};

const checkSolution = (
  problem: string,
  solution: string
): CheckResult => {
  const expected = parseEquation(problem);

  if (expected === null) {
    return {
      correct: false,
      message:
        'Одоогоор ax + b = c хэлбэрийн тэгшитгэлийг дэмжинэ.',
    };
  }

  const steps = solution
    .split('\n')
    .map((step) => step.trim())
    .filter(Boolean);

  if (steps.length === 0) {
    return {
      correct: false,
      message: 'Бодолтын алхмуудаа оруулна уу.',
    };
  }

  for (let i = 0; i < steps.length; i++) {
    const actual = parseEquation(steps[i]);

    if (actual === null) {
      return {
        correct: false,
        step: i + 1,
        message:
          `${i + 1}-р алхмын хэлбэрийг таньсангүй. ` +
          'Тэгшитгэлийг жишээ нь 2x = 10 эсвэл x = 5 гэж бичнэ үү.',
      };
    }

    if (Math.abs(actual - expected) > 0.000001) {
      return {
        correct: false,
        step: i + 1,
        message:
          `${i + 1}-р алхам дээр тэгшитгэлийн утга өөрчлөгдсөн байна. ` +
          `Анхны тэгшитгэлийн зөв хариу x = ${expected}. ` +
          'Хоёр талд ижил үйлдэл хийсэн эсэхээ шалгаарай.',
      };
    }
  }

  return {
    correct: true,
    message:
      `Оруулсан бүх алхам тэнцүү утгатай байна. ` +
      `Зөв хариу: x = ${expected}.`,
  };
};

export const IndexPage = () => {
  const [problem, setProblem] = useState('2x + 5 = 15');

  const [solution, setSolution] = useState(
    '2x = 15 + 5\n2x = 20\nx = 10'
  );

  const [result, setResult] = useState<CheckResult | null>(null);

  const handleCheck = () => {
    setResult(checkSolution(problem, solution));
  };

  return (
    <div style={{ padding: 24, maxWidth: 850 }}>
      <h1 style={{ fontSize: 26, fontWeight: 700 }}>
        AI Study Assistant
      </h1>

      <p style={{ marginTop: 8, marginBottom: 24 }}>
        Математикийн бодолтоо алхам алхмаар шалгуулаарай.
      </p>

      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', marginBottom: 8 }}>
          Математикийн бодлого
        </label>

        <input
          value={problem}
          onChange={(e) => {
            setProblem(e.target.value);
            setResult(null);
          }}
          style={{
            width: '100%',
            padding: 12,
            border: '1px solid #ccc',
            borderRadius: 8,
          }}
        />
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', marginBottom: 8 }}>
          Сурагчийн бодолт (алхам бүрийг шинэ мөрөнд)
        </label>

        <textarea
          value={solution}
          onChange={(e) => {
            setSolution(e.target.value);
            setResult(null);
          }}
          rows={7}
          style={{
            width: '100%',
            padding: 12,
            border: '1px solid #ccc',
            borderRadius: 8,
          }}
        />
      </div>

      <button
        onClick={handleCheck}
        style={{
          padding: '12px 24px',
          backgroundColor: '#2563eb',
          color: '#fff',
          borderRadius: 8,
          cursor: 'pointer',
        }}
      >
        Бодолт шалгах
      </button>

      {result && (
        <div
          style={{
            marginTop: 24,
            padding: 20,
            borderRadius: 8,
            border: `1px solid ${
              result.correct ? '#16a34a' : '#dc2626'
            }`,
          }}
        >
          <h3 style={{ fontWeight: 700, marginBottom: 8 }}>
            {result.correct
              ? 'Зөв бодолт'
              : result.step
                ? `Алхам ${result.step} дээр асуудал байна`
                : 'Бодолтыг шалгах боломжгүй'}
          </h3>

          <p>{result.message}</p>
        </div>
      )}
    </div>
  );
};
