
export type CheckResult = {
  correct: boolean;
  firstErrorStep: number | null;
  expectedAnswer: number | null;
  explanation: string;
};

function parseEquation(text: string): number | null {
  const cleaned = text.replace(/\s/g, '').replace(/−/g, '-');

  const match = cleaned.match(/^(-?\d*)x([+-]\d+)?=(-?\d+)$/);

  if (!match) return null;

  const a =
    match[1] === '' ? 1 :
    match[1] === '-' ? -1 :
    Number(match[1]);

  const b = Number(match[2] || 0);
  const c = Number(match[3]);

  if (a === 0) return null;

  return (c - b) / a;
}

export function checkSolution(
  problem: string,
  steps: string[]
): CheckResult {
  const expected = parseEquation(problem);

  if (expected === null) {
    return {
      correct: false,
      firstErrorStep: null,
      expectedAnswer: null,
      explanation:
        'Одоогоор ax + b = c хэлбэрийн тэгшитгэлийг дэмжинэ.',
    };
  }

  if (steps.length === 0) {
    return {
      correct: false,
      firstErrorStep: null,
      expectedAnswer: expected,
      explanation: 'Бодолтын алхмуудаа оруулна уу.',
    };
  }

  for (let i = 0; i < steps.length; i++) {
    const actual = parseEquation(steps[i]);

    if (actual === null) {
      return {
        correct: false,
        firstErrorStep: i + 1,
        expectedAnswer: expected,
        explanation:
          `${i + 1}-р алхмын хэлбэрийг таньсангүй.`,
      };
    }

    if (Math.abs(actual - expected) > 0.000001) {
      return {
        correct: false,
        firstErrorStep: i + 1,
        expectedAnswer: expected,
        explanation:
          `${i + 1}-р алхам дээр тэгшитгэлийн шийд өөрчлөгдсөн байна. ` +
          `Зөв хариу x = ${expected}. ` +
          'Тэнцэтгэлийн хоёр талд ижил үйлдэл хийсэн эсэхээ шалгаарай.',
      };
    }
  }

  return {
    correct: true,
    firstErrorStep: null,
    expectedAnswer: expected,
    explanation:
      `Оруулсан алхмууд анхны тэгшитгэлтэй ижил шийдтэй байна. ` +
      `Зөв хариу x = ${expected}.`,
  };
}

