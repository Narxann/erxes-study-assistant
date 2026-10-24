export type MathTopic =
  | 'fractions'
  | 'linear-equation'
  | 'linear-inequality'
  | 'quadratic-equation'
  | 'quadratic-function'
  | 'unsupported';

export type VerificationStatus = 'verified' | 'incorrect' | 'unverified' | 'unsupported';

export type GraphData = {
  vertex: { x: string; y: string };
  axisOfSymmetry: string;
  opening: 'up' | 'down';
  xIntercepts: string[];
  yIntercept: string;
  points: Array<{ x: number; y: number }>;
};

export type EngineResult = {
  topic: MathTopic;
  status: VerificationStatus;
  firstErrorStep?: number | null;
  exactAnswer?: string;
  approximateAnswer?: string;
  explanation?: string;
  errorType?: string;
  errorTitle?: string;
  correctedStep?: string;
  nextExercise?: string;
  graphData?: GraphData;
  reason?: string;
};

const gcd = (left: number, right: number): number => {
  let a = Math.abs(Math.trunc(left));
  let b = Math.abs(Math.trunc(right));
  while (b !== 0) {
    const next = a % b;
    a = b;
    b = next;
  }
  return a || 1;
};

export class Rational {
  readonly numerator: number;
  readonly denominator: number;

  constructor(numerator: number, denominator = 1) {
    if (!Number.isInteger(numerator) || !Number.isInteger(denominator) || denominator === 0) {
      throw new Error('Invalid rational number');
    }
    const sign = denominator < 0 ? -1 : 1;
    const divisor = gcd(numerator, denominator);
    this.numerator = sign * numerator / divisor;
    this.denominator = sign * denominator / divisor;
  }

  add(other: Rational): Rational {
    return new Rational(
      this.numerator * other.denominator + other.numerator * this.denominator,
      this.denominator * other.denominator,
    );
  }

  subtract(other: Rational): Rational {
    return this.add(other.negate());
  }

  multiply(other: Rational): Rational {
    return new Rational(this.numerator * other.numerator, this.denominator * other.denominator);
  }

  divide(other: Rational): Rational {
    if (other.numerator === 0) throw new Error('Division by zero');
    return new Rational(this.numerator * other.denominator, this.denominator * other.numerator);
  }

  negate(): Rational {
    return new Rational(-this.numerator, this.denominator);
  }

  equals(other: Rational): boolean {
    return this.numerator === other.numerator && this.denominator === other.denominator;
  }

  isZero(): boolean {
    return this.numerator === 0;
  }

  toNumber(): number {
    return this.numerator / this.denominator;
  }

  toString(): string {
    if (this.denominator === 1) return String(this.numerator);
    return `${this.numerator}/${this.denominator}`;
  }
}

const rationalNumber = (value: string): Rational => {
  const [whole, decimal] = value.split('.');
  if (!decimal) return new Rational(Number(whole));
  const denominator = 10 ** decimal.length;
  return new Rational(Number(`${whole}${decimal}`), denominator);
};

const normalizeInput = (value: string): string =>
  value
    .replace(/[−–—]/g, '-')
    .replace(/[×·]/g, '*')
    .replace(/÷/g, '/')
    .replace(/²/g, '^2')
    .replace(/³/g, '^3')
    .replace(/≤/g, '<=')
    .replace(/≥/g, '>=')
    .replace(/\s+/g, ' ')
    .trim();

type ExpressionToken = { type: 'number' | 'operator' | 'variable' | 'parenthesis'; value: string };

const tokenize = (input: string): ExpressionToken[] | null => {
  const tokens: ExpressionToken[] = [];
  let index = 0;
  while (index < input.length) {
    const character = input[index];
    if (character === ' ') {
      index += 1;
      continue;
    }
    if (/\d|\./.test(character)) {
      const match = input.slice(index).match(/^(?:\d+(?:\.\d*)?|\.\d+)/);
      if (!match) return null;
      tokens.push({ type: 'number', value: match[0] });
      index += match[0].length;
      continue;
    }
    if (character === 'x' || character === 'X') {
      tokens.push({ type: 'variable', value: 'x' });
      index += 1;
      continue;
    }
    if ('+-*/^'.includes(character)) {
      tokens.push({ type: 'operator', value: character });
      index += 1;
      continue;
    }
    if (character === '(' || character === ')') {
      tokens.push({ type: 'parenthesis', value: character });
      index += 1;
      continue;
    }
    return null;
  }
  return tokens;
};

type Polynomial = [Rational, Rational, Rational];

const polynomialAdd = (left: Polynomial, right: Polynomial): Polynomial =>
  [left[0].add(right[0]), left[1].add(right[1]), left[2].add(right[2])];

const polynomialScale = (value: Polynomial, factor: Rational): Polynomial =>
  [value[0].multiply(factor), value[1].multiply(factor), value[2].multiply(factor)];

const polynomialMultiply = (left: Polynomial, right: Polynomial): Polynomial | null => {
  const result: Polynomial = [new Rational(0), new Rational(0), new Rational(0)];
  for (let leftDegree = 0; leftDegree <= 2; leftDegree += 1) {
    for (let rightDegree = 0; rightDegree <= 2; rightDegree += 1) {
      if (leftDegree + rightDegree > 2) {
        if (!left[leftDegree].isZero() && !right[rightDegree].isZero()) return null;
        continue;
      }
      result[leftDegree + rightDegree] = result[leftDegree + rightDegree].add(
        left[leftDegree].multiply(right[rightDegree]),
      );
    }
  }
  return result;
};

class PolynomialParser {
  private position = 0;

  constructor(private readonly tokens: ExpressionToken[]) {}

  parse(): Polynomial | null {
    const result = this.expression();
    return result && this.position === this.tokens.length ? result : null;
  }

  private expression(): Polynomial | null {
    let result = this.term();
    while (result) {
      const token = this.tokens[this.position];
      if (!token || (token.type !== 'operator' || !['+', '-'].includes(token.value))) return result;
      this.position += 1;
      const right = this.term();
      if (!right) return null;
      result = polynomialAdd(result, token.value === '-' ? polynomialScale(right, new Rational(-1)) : right);
    }
    return null;
  }

  private term(): Polynomial | null {
    let result = this.factor();
    while (result) {
      const token = this.tokens[this.position];
      const implicit = token?.type === 'number' || token?.type === 'variable' || token?.value === '(';
      if (!token || (token.type !== 'operator' || !['*', '/'].includes(token.value)) && !implicit) return result;
      if (token.type === 'number') return null;
      if (token.type === 'operator') this.position += 1;
      const right = this.factor();
      if (!right) return null;
      if (token.value === '/') {
        if (!right[0] || right[0].isZero() || !right[1].isZero() || !right[2].isZero()) return null;
        result = polynomialScale(result, new Rational(right[0].denominator, right[0].numerator));
      } else {
        result = polynomialMultiply(result, right);
      }
    }
    return null;
  }

  private factor(): Polynomial | null {
    const token = this.tokens[this.position];
    if (!token) return null;
    if (token.type === 'operator' && ['+', '-'].includes(token.value)) {
      this.position += 1;
      const value = this.factor();
      return value ? (token.value === '-' ? polynomialScale(value, new Rational(-1)) : value) : null;
    }
    if (token.value === '(') {
      this.position += 1;
      const value = this.expression();
      if (!value || this.tokens[this.position]?.value !== ')') return null;
      this.position += 1;
      return this.power(value);
    }
    if (token.type === 'variable') {
      this.position += 1;
      return this.power([new Rational(0), new Rational(1), new Rational(0)]);
    }
    if (token.type === 'number') {
      this.position += 1;
      return this.power([rationalNumber(token.value), new Rational(0), new Rational(0)]);
    }
    return null;
  }

  private power(value: Polynomial): Polynomial | null {
    const token = this.tokens[this.position];
    if (!token || token.value !== '^') return value;
    this.position += 1;
    const exponent = this.tokens[this.position];
    if (!exponent || exponent.type !== 'number' || !['2', '1'].includes(exponent.value)) return null;
    this.position += 1;
    if (exponent.value === '1') return value;
    return polynomialMultiply(value, value);
  }
}

export const parsePolynomial = (input: string): Polynomial | null => {
  const tokens = tokenize(normalizeInput(input));
  return tokens ? new PolynomialParser(tokens).parse() : null;
};

const polynomialSubtract = (left: Polynomial, right: Polynomial): Polynomial =>
  polynomialAdd(left, polynomialScale(right, new Rational(-1)));

const splitRelation = (input: string): { left: string; right: string; relation: string } | null => {
  const match = normalizeInput(input).match(/^(.*?)(<=|>=|=|<|>)(.*)$/);
  if (!match) return null;
  return { left: match[1], relation: match[2], right: match[3] };
};

export const detectMathTopic = (input: string): MathTopic => {
  const normalized = normalizeInput(input);
  if (/[/?]/.test(normalized) && !/[a-z]/i.test(normalized)) return 'fractions';
  if (/x\s*\(/i.test(normalized)) return 'unsupported';
  if (/[<>]=?/.test(normalized)) return 'linear-inequality';
  const relation = splitRelation(normalized);
  if (relation) {
    const left = parsePolynomial(relation.left);
    const right = parsePolynomial(relation.right);
    if (left && right && (!left[2].isZero() || !right[2].isZero())) {
      if (left[1].isZero() && right[1].isZero()) return 'unsupported';
      return 'quadratic-equation';
    }
    if (left && right) return 'linear-equation';
  }
  if (/y\s*=/.test(normalized) && /x/.test(normalized)) return 'quadratic-function';
  return 'unsupported';
};

const parseConstantExpression = (input: string): Rational | null => {
  const polynomial = parsePolynomial(input);
  if (!polynomial || !polynomial[1].isZero() || !polynomial[2].isZero()) return null;
  return polynomial[0];
};

export const solveFraction = (input: string): EngineResult => {
  const relation = splitRelation(input);
  if (relation) {
    const left = parseConstantExpression(relation.left);
    const right = parseConstantExpression(relation.right);
    if (!left || !right) return { topic: 'fractions', status: 'unsupported', reason: 'Бутархайн илэрхийлэл танигдсангүй.' };
    const difference = left.subtract(right).toNumber();
    const holds =
      relation.relation === '=' ? difference === 0 :
        relation.relation === '<' ? difference < 0 :
          relation.relation === '<=' ? difference <= 0 :
            relation.relation === '>' ? difference > 0 :
              difference >= 0;
    return {
      topic: 'fractions',
      status: holds ? 'verified' : 'incorrect',
      exactAnswer: `${left.toString()} ${relation.relation} ${right.toString()}`,
      explanation: holds ? 'Бутархайн хоёр талын харьцаа зөв байна.' : 'Бутархайн харьцаа энэ тэмдэгтэй нийцэхгүй байна.',
    };
  }
  const value = parseConstantExpression(input);
  if (!value) return { topic: 'fractions', status: 'unsupported', reason: 'Бутархайн илэрхийлэл танигдсангүй.' };
  return {
    topic: 'fractions',
    status: 'verified',
    exactAnswer: value.toString(),
    explanation: 'Ижил хуваарьт шилжүүлж, бутархайг хураалаа.',
  };
};

export const solveLinearInequality = (input: string): EngineResult => {
  const relation = splitRelation(input);
  if (!relation || !['<', '<=', '>', '>='].includes(relation.relation)) {
    return { topic: 'linear-inequality', status: 'unsupported', reason: 'Тэнцэтгэл бишийн тэмдэг танигдсангүй.' };
  }
  const left = parsePolynomial(relation.left);
  const right = parsePolynomial(relation.right);
  if (!left || !right || !left[2].isZero() || !right[2].isZero()) {
    return { topic: 'linear-inequality', status: 'unsupported', reason: 'Зөвхөн шугаман тэнцэтгэл бишийг дэмжинэ.' };
  }
  const difference = polynomialSubtract(left, right);
  const coefficient = difference[1];
  const constant = difference[0];
  if (coefficient.isZero()) {
    const value = constant.toNumber();
    const holds =
      relation.relation === '<' ? value < 0 :
        relation.relation === '<=' ? value <= 0 :
          relation.relation === '>' ? value > 0 :
            value >= 0;
    return {
      topic: 'linear-inequality',
      status: 'verified',
      exactAnswer: holds ? 'Бүх бодит тоо' : 'Шийдгүй',
      explanation: holds ? 'Тэнцэтгэл биш бүх бодит тоонд биелнэ.' : 'Тэнцэтгэл биш биелэх бодит тоо байхгүй.',
    };
  }
  const boundary = constant.negate().divide(coefficient);
  const direction = coefficient.numerator > 0 ? relation.relation : relation.relation.replace('<', '§').replace('>', '<').replace('§', '>');
  return {
    topic: 'linear-inequality',
    status: 'verified',
    exactAnswer: `x ${direction} ${boundary.toString()}`,
    explanation: coefficient.numerator < 0 ? 'Сөрөг тоонд хуваахад тэнцэтгэл бишийн тэмдэг урвуугаар өөрчлөгдөнө.' : 'Хоёр талд ижил үйлдэл хийж, x-ийг тусгаарлалаа.',
  };
};

export const solveQuadratic = (input: string): EngineResult => {
  const relation = splitRelation(input);
  if (!relation || relation.relation !== '=') return { topic: 'quadratic-equation', status: 'unsupported', reason: 'Тэгшитгэлээ = тэмдэгтэй оруулна уу.' };
  const left = parsePolynomial(relation.left);
  const right = parsePolynomial(relation.right);
  if (!left || !right) return { topic: 'quadratic-equation', status: 'unsupported', reason: 'Квадрат илэрхийлэл танигдсангүй.' };
  const [c, b, a] = polynomialSubtract(left, right);
  if (a.isZero()) return { topic: 'quadratic-equation', status: 'unsupported', reason: 'x²-ийн коэффициент тэг байна.' };
  const discriminant = b.multiply(b).subtract(new Rational(4).multiply(a).multiply(c));
  if (discriminant.numerator < 0) {
    return { topic: 'quadratic-equation', status: 'verified', exactAnswer: 'Бодит шийдгүй', explanation: 'Дискриминант сөрөг тул бодит тоон шийд байхгүй.' };
  }
  const approximate = (-b.toNumber() + Math.sqrt(discriminant.toNumber())) / (2 * a.toNumber());
  const second = (-b.toNumber() - Math.sqrt(discriminant.toNumber())) / (2 * a.toNumber());
  const roots = Math.abs(approximate - second) < 1e-10 ? [approximate] : [approximate, second].sort((x, y) => x - y);
  const exactAnswer = roots.map((root) => Number.isInteger(root) ? String(root) : String(Number(root.toFixed(6)))).join(', ');
  return {
    topic: 'quadratic-equation',
    status: 'verified',
    exactAnswer,
    approximateAnswer: exactAnswer,
    explanation: `Дискриминантын утга ${discriminant.toString()} байна. Иймээс бодит язгууруудыг шалгав.`,
  };
};

export const solveQuadraticFunction = (input: string): EngineResult => {
  const match = normalizeInput(input).match(/^y\s*=\s*(.*)$/i);
  const polynomial = match ? parsePolynomial(match[1]) : null;
  if (!polynomial || polynomial[2].isZero()) return { topic: 'quadratic-function', status: 'unsupported', reason: 'Квадрат функцийн хэлбэр танигдсангүй.' };
  const [c, b, a] = polynomial;
  const vertexX = b.negate().divide(a.multiply(new Rational(2)));
  const vertexY = a.multiply(vertexX).multiply(vertexX).add(b.multiply(vertexX)).add(c);
  const discriminant = b.multiply(b).subtract(new Rational(4).multiply(a).multiply(c));
  const xIntercepts: string[] = [];
  if (discriminant.numerator >= 0) {
    const root1 = (-b.toNumber() + Math.sqrt(discriminant.toNumber())) / (2 * a.toNumber());
    const root2 = (-b.toNumber() - Math.sqrt(discriminant.toNumber())) / (2 * a.toNumber());
    xIntercepts.push(String(Number(root1.toFixed(4))));
    if (Math.abs(root1 - root2) > 1e-10) xIntercepts.push(String(Number(root2.toFixed(4))));
  }
  const center = vertexX.toNumber();
  const points = [-2, -1, 0, 1, 2].map((offset) => {
    const x = center + offset;
    return { x: Number(x.toFixed(4)), y: Number((a.toNumber() * x * x + b.toNumber() * x + c.toNumber()).toFixed(4)) };
  });
  return {
    topic: 'quadratic-function',
    status: 'verified',
    explanation: `Оройн цэг (${vertexX.toString()}, ${vertexY.toString()}), симметрийн тэнхлэг x = ${vertexX.toString()}.`,
    graphData: {
      vertex: { x: vertexX.toString(), y: vertexY.toString() },
      axisOfSymmetry: `x = ${vertexX.toString()}`,
      opening: a.numerator > 0 ? 'up' : 'down',
      xIntercepts,
      yIntercept: c.toString(),
      points,
    },
  };
};

export const checkExtendedMath = (problem: string, steps: string[]): EngineResult | null => {
  const topic = detectMathTopic(problem);
  if (topic === 'fractions') {
    const expected = solveFraction(problem);
    if (expected.status !== 'verified') return expected;
    for (let index = 0; index < steps.length; index += 1) {
      const current = solveFraction(steps[index]);
      if (current.status !== 'verified' || current.exactAnswer !== expected.exactAnswer) {
        return {
          topic,
          status: 'incorrect',
          firstErrorStep: index + 1,
          errorType: 'fraction-simplification',
          errorTitle: 'Бутархайн алхам зөрүүтэй байна',
          reason: `${index + 1}-р алхам өмнөх утгатай тэнцүү биш байна.`,
        };
      }
    }
    return expected;
  }
  if (topic === 'linear-inequality') {
    const expected = solveLinearInequality(problem);
    const finalStep = steps[steps.length - 1];
    if (expected.status === 'verified' && finalStep) {
      const actual = solveLinearInequality(finalStep);
      if (actual.status !== 'verified' || actual.exactAnswer !== expected.exactAnswer) {
        return {
          ...expected,
          status: 'incorrect',
          firstErrorStep: steps.length,
          errorType: 'inequality-direction',
          errorTitle: 'Тэнцэтгэл бишийн хариу зөрүүтэй байна',
          reason: 'Шийдлийн завсар болон тэмдгийг дахин шалгаарай.',
        };
      }
    }
    return expected;
  }
  if (topic === 'quadratic-equation') {
    const result = solveQuadratic(problem);
    if (result.status !== 'verified') return result;
    if (steps.length === 0) {
      return { ...result, status: 'unverified', errorType: 'missing-steps', reason: 'Өөрийн бодолтын алхмуудыг оруулна уу.' };
    }
    if (steps.length < 2) return result;
    const final = steps[steps.length - 1];
    const finalResult = solveQuadratic(final.includes('=') ? final : `${final}=0`);
    if (finalResult.exactAnswer === result.exactAnswer) return result;
    return { ...result, status: 'incorrect', firstErrorStep: steps.length, errorType: 'invalid-step', errorTitle: 'Квадрат тэгшитгэлийн алхам зөрүүтэй байна', reason: 'Шалгасан алхам эцсийн язгууртай нийцсэнгүй.' };
  }
  if (topic === 'quadratic-function') return solveQuadraticFunction(problem);
  return null;
};
