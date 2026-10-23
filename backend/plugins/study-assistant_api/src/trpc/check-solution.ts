export type CheckResult = {
  correct: boolean;
  firstErrorStep: number | null;
  expectedAnswer: number | null;
  explanation: string;
};

type Linear = {
  a: number;
  b: number;
};

const EPS = 1e-8;

function parseExpression(input: string): Linear | null {
  const text = input.replace(/\s/g, '').replace(/−/g, '-');
  let pos = 0;

  const add = (u: Linear, v: Linear): Linear => ({
    a: u.a + v.a,
    b: u.b + v.b,
  });

  const scale = (u: Linear, k: number): Linear => ({
    a: u.a * k,
    b: u.b * k,
  });

  function expression(): Linear | null {
    let left = term();
    if (!left) return null;

    while (text[pos] === '+' || text[pos] === '-') {
      const op = text[pos++];
      const right = term();
      if (!right) return null;
      left = add(left, scale(right, op === '+' ? 1 : -1));
    }
    return left;
  }

  function term(): Linear | null {
    let left = factor();
    if (!left) return null;

    while (text[pos] === '*' || text[pos] === '/') {
      const op = text[pos++];
      const right = factor();
      if (!right) return null;

      if (op === '*') {
        if (Math.abs(left.a) > EPS && Math.abs(right.a) > EPS) {
          return null;
        }
        left =
          Math.abs(right.a) > EPS ? scale(right, left.b) : scale(left, right.b);
      } else {
        if (Math.abs(right.a) > EPS || Math.abs(right.b) < EPS) {
          return null;
        }
        left = scale(left, 1 / right.b);
      }
    }
    return left;
  }

  function factor(): Linear | null {
    if (text[pos] === '+' || text[pos] === '-') {
      const sign = text[pos++] === '-' ? -1 : 1;
      const value = factor();
      return value ? scale(value, sign) : null;
    }

    if (text[pos] === '(') {
      pos++;
      const value = expression();
      if (text[pos] !== ')') return null;
      pos++;
      return value;
    }

    if (text[pos] === 'x') {
      pos++;
      return { a: 1, b: 0 };
    }

    const match = text.slice(pos).match(/^(?:\d+\.?\d*|\.\d+)/);
    if (!match) return null;

    pos += match[0].length;
    const number = Number(match[0]);

    // 2x, 3(x+1) хэлбэрийн үржвэр
    if (text[pos] === 'x' || text[pos] === '(') {
      const value = factor();
      return value ? scale(value, number) : null;
    }

    return { a: 0, b: number };
  }

  const result = expression();
  return result && pos === text.length ? result : null;
}

function parseEquation(text: string): number | null {
  const parts = text.split('=');
  if (parts.length !== 2) return null;

  const left = parseExpression(parts[0]);
  const right = parseExpression(parts[1]);

  if (!left || !right) return null;

  const a = left.a - right.a;
  const b = right.b - left.b;

  if (Math.abs(a) < EPS) return null;
  return b / a;
}

export function checkSolution(problem: string, steps: string[]): CheckResult {
  const expected = parseEquation(problem);

  if (expected === null) {
    return {
      correct: false,
      firstErrorStep: null,
      expectedAnswer: null,
      explanation:
        'Тэгшитгэлийг таньж чадсангүй. Нэг хувьсагчтай шугаман тэгшитгэл оруулна уу.',
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
        explanation: `${i + 1}-р алхмын хэлбэрийг таньж чадсангүй.`,
      };
    }

    if (Math.abs(actual - expected) > EPS) {
      return {
        correct: false,
        firstErrorStep: i + 1,
        expectedAnswer: expected,
        explanation:
          `${i + 1}-р алхам дээр тэгшитгэлийн шийд өөрчлөгдсөн байна. ` +
          `Зөв хариу x = ${expected}. ` +
          'Хаалт задлах, тэмдэг шилжүүлэх эсвэл хуваах үйлдлээ шалгаарай.',
      };
    }
  }

  return {
    correct: true,
    firstErrorStep: null,
    expectedAnswer: expected,
    explanation: `Оруулсан бүх алхам анхны тэгшитгэлтэй ижил шийдтэй байна. x = ${expected}.`,
  };
}
