import { checkExtendedMath, detectMathTopic } from './math-engine';

export type CheckResult = {
  correct: boolean;
  firstErrorStep: number | null;
  expectedAnswer: number | null;
  explanation: string;
  errorType: string | null;
  errorTitle: string | null;
  correction: string | null;
  correctedStep: string | null;
  nextExercise: string | null;
};

type Linear = { a: number; b: number };
type EquationStatus = 'unique' | 'identity' | 'contradiction';
type Equation = { left: Linear; right: Linear; solution: number | null; status: EquationStatus };

const EPS = 1e-8;

function parseExpression(input: string): Linear | null {
  const text = input.replace(/\s/g, '').replace(/−/g, '-');
  let pos = 0;
  const add = (u: Linear, v: Linear): Linear => ({ a: u.a + v.a, b: u.b + v.b });
  const scale = (u: Linear, k: number): Linear => ({ a: u.a * k, b: u.b * k });

  function expression(): Linear | null {
    let left = term();
    if (!left) return null;
    while (text[pos] === '+' || text[pos] === '-') {
      const operator = text[pos++];
      const right = term();
      if (!right) return null;
      left = add(left, scale(right, operator === '+' ? 1 : -1));
    }

    return left;
  }

  function term(): Linear | null {
    let left = factor();
    if (!left) return null;
    while (text[pos] === '*' || text[pos] === '/') {
      const operator = text[pos++];
      const right = factor();
      if (!right) return null;
      if (operator === '*') {
        if (Math.abs(left.a) > EPS && Math.abs(right.a) > EPS) return null;
        left = Math.abs(right.a) > EPS ? scale(right, left.b) : scale(left, right.b);
      } else {
        if (Math.abs(right.a) > EPS || Math.abs(right.b) < EPS) return null;
        left = scale(left, 1 / right.b);
      }
    }
    return left;
  }

  function factor(): Linear | null {
    if (text[pos] === '+' || text[pos] === '-') {
      const operator = text[pos++];
      const value = factor();
      return value ? scale(value, operator === '-' ? -1 : 1) : null;
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
    if (text[pos] === 'x' || text[pos] === '(') {
      const value = factor();
      return value ? scale(value, number) : null;
    }
    return { a: 0, b: number };
  }

  const result = expression();
  return result && pos === text.length ? result : null;
}

function parseEquation(text: string): Equation | null {
  const parts = text.split('=');
  if (parts.length !== 2) return null;
  const left = parseExpression(parts[0]);
  const right = parseExpression(parts[1]);
  if (!left || !right) return null;
  const coefficient = left.a - right.a;
  const constant = right.b - left.b;
  if (Math.abs(coefficient) < EPS) {
    return {
      left,
      right,
      solution: null,
      status: Math.abs(constant) < EPS ? 'identity' : 'contradiction',
    };
  }
  return { left, right, solution: constant / coefficient, status: 'unique' };
}

export function solveLinearEquation(text: string): number | null {
  return parseEquation(text)?.solution ?? null;
}

function sameSolution(left: number | null, right: number | null) {
  return left !== null && right !== null && Math.abs(left - right) <= EPS;
}

function formatNumber(value: number) {
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(4)));
}

function formatCoefficient(value: number) {
  if (Math.abs(value - 1) <= EPS) return 'x';
  if (Math.abs(value + 1) <= EPS) return '-x';
  return `${formatNumber(value)}x`;
}

function correctedNextStep(previous: Equation, answer: number): string {
  const coefficient = previous.left.a - previous.right.a;
  const constant = previous.right.b - previous.left.b;
  if (Math.abs(coefficient) <= EPS || Math.abs(constant) <= EPS) {
    return `x = ${formatNumber(answer)}`;
  }
  return `${formatCoefficient(coefficient)} = ${formatNumber(constant)}`;
}

function classifyError(
  previous: Equation,
  current: Equation,
  previousText: string,
  currentText: string,
): {
  type: string;
  title: string;
  explanation: string;
} {
  const previousTextWithoutSpaces = previousText.replace(/\s/g, '');
  const currentTextWithoutSpaces = currentText.replace(/\s/g, '');
  const previousHasConstantWithVariable =
    Math.abs(previous.left.a - previous.right.a) > EPS &&
    Math.abs(previous.left.b - previous.right.b) > EPS;
  const currentIsIsolated =
    Math.abs(current.left.a - current.right.a) > EPS &&
    Math.abs(current.left.b) < EPS &&
    Math.abs(current.right.a) < EPS;

  if (
    previousHasConstantWithVariable &&
    currentIsIsolated &&
    /[+-]\d+=/.test(previousTextWithoutSpaces) &&
    /=\d+[+-]\d+/.test(currentTextWithoutSpaces)
  ) {
    return {
      type: 'sign-change',
      title: 'Тэмдэг шилжүүлэх ойлголт дээр алдсан байна',
      explanation: 'Гишүүнийг нөгөө талд шилжүүлэхэд тэмдэг нь эсрэгээрээ өөрчлөгдөнө. Нэмэх гишүүн хасах, хасах гишүүн нэмэх болно.',
    };
  }
  if (
    /[()]/.test(previousTextWithoutSpaces) &&
    !/[()]/.test(currentTextWithoutSpaces) &&
    (Math.abs(previous.left.a - current.left.a) > EPS ||
      Math.abs(previous.left.b - current.left.b) > EPS)
  ) {
    return {
      type: 'distribution',
      title: 'Хаалт задлах алхам дээр алдсан байна',
      explanation: 'Хаалтын гаднах үржигдэхүүнийг хаалт доторх бүх гишүүнд үржүүлэх хэрэгтэй.',
    };
  }
  if (
    /x.*=|=.*x/.test(previousTextWithoutSpaces) &&
    /\/|÷/.test(currentTextWithoutSpaces) &&
    Math.abs(previous.left.a - previous.right.a) > EPS
  ) {
    return {
      type: 'division',
      title: 'Хуваах алхам дээр алдсан байна',
      explanation: 'Тэгшитгэлийн хоёр талыг ижил, тэгээс ялгаатай тоонд хуваасан эсэхээ шалгаарай.',
    };
  }
  return {
    type: 'arithmetic',
    title: 'Тооцооллын алхам дээр алдаа гарсан байна',
    explanation: 'Үйлдлийн тэмдэг зөв байсан ч тооцооллын үр дүн өмнөх алхамтай нийцэхгүй байна.',
  };
}

function invalidResult(
  step: number | null,
  expected: number | null,
  errorType: string,
  errorTitle: string,
  explanation: string,
  correction: string | null,
  correctedStep: string | null,
  nextExercise: string | null,
): CheckResult {
  return {
    correct: false,
    firstErrorStep: step,
    expectedAnswer: expected,
    explanation,
    errorType,
    errorTitle,
    correction,
    correctedStep,
    nextExercise,
  };
}

export function checkSolution(problem: string, steps: string[]): CheckResult {
  const extendedTopic = detectMathTopic(problem);
  if (extendedTopic === 'fractions' || extendedTopic === 'linear-inequality' || extendedTopic === 'quadratic-equation' || extendedTopic === 'quadratic-function') {
    const extended = checkExtendedMath(problem, steps);
    if (extended) {
      const incorrect = extended.status === 'incorrect';
      return {
        correct: extended.status === 'verified',
        firstErrorStep: extended.firstErrorStep ?? (incorrect ? 1 : null),
        expectedAnswer: null,
        explanation: extended.explanation || extended.reason || 'Энэ бодолтыг одоогоор баталгаажуулж чадсангүй.',
        errorType: extended.errorType || (extended.status === 'unsupported' ? 'unsupported' : null),
        errorTitle: extended.errorTitle || (extended.status === 'unsupported' ? 'Энэ бодлогыг баталгаажуулж чадсангүй' : null),
        correction: extended.exactAnswer || null,
        correctedStep: extended.correctedStep || null,
        nextExercise: extended.nextExercise || null,
      };
    }
  }
  const original = parseEquation(problem);
  if (!original || original.status !== 'unique' || original.solution === null) {
    return invalidResult(
      null,
      null,
      'unsupported',
      'Энэ бодлогыг баталгаажуулж чадсангүй',
      'Одоогоор зөвхөн нэг хувьсагчтай шугаман тэгшитгэлийг найдвартай шалгана.',
      null,
      null,
      null,
    );
  }
  if (steps.length === 0) {
    return invalidResult(null, original.solution, 'missing-steps', 'Өөрийн бодолтоо оруулна уу', 'Алхам бүрийг шинэ мөрөнд бичээд шалгуулна уу.', null, null, null);
  }

  let previous = original;
  for (let index = 0; index < steps.length; index++) {
    const current = parseEquation(steps[index]);
    const stepNumber = index + 1;
    if (!current) {
      return invalidResult(
        stepNumber,
        original.solution,
        'invalid-step',
        'Алхам танигдсангүй',
        `${stepNumber}-р алхам тэнцэтгэл хэлбэрээр бичигдээгүй байна. Жишээ нь 2x = 8 гэж бичээрэй.`,
        'Тэнцэтгэлээ зүүн ба баруун талтайгаар, нэг алхмыг нэг мөрөнд бичээрэй.',
        correctedNextStep(previous, original.solution),
        'x + 4 = 9',
      );
    }
    if (
      current.status !== 'unique' ||
      !sameSolution(current.solution, original.solution) ||
      !sameSolution(current.solution, previous.solution)
    ) {
      const classification =
        current.status !== 'unique'
          ? {
              type: 'invalid-step',
              title: 'Энэ алхам баталгаажаагүй байна',
              explanation: 'Энэ алхам нь нэг шийдтэй тэнцэтгэл биш болсон тул өмнөх алхмаас зөв гарсан гэж батлах боломжгүй.',
            }
          : classifyError(previous, current, steps[index - 1] || problem, steps[index]);
      const correctedStep = correctedNextStep(previous, original.solution);
      return invalidResult(
        stepNumber,
        original.solution,
        classification.type,
        classification.title,
        `${stepNumber}-р алхам өмнөх зөв алхмаас математик хувьд гарахгүй байна. ${classification.explanation}`,
        `Зөв хариу x = ${formatNumber(original.solution)}. Дараагийн алхамд хоёр талд ижил үйлдэл хийж шалгаарай.`,
        correctedStep,
        classification.type === 'sign-change' ? '3x + 2 = 14' : 'x + 4 = 9',
      );
    }
    previous = current;
  }

  return {
    correct: true,
    firstErrorStep: null,
    expectedAnswer: original.solution,
    explanation: `Бүх алхам өмнөх алхмаасаа зөв шилжсэн байна. Шийд: x = ${formatNumber(original.solution)}.`,
    errorType: null,
    errorTitle: null,
    correction: null,
    correctedStep: null,
    nextExercise: '3x + 2 = 14',
  };
}
