import { checkSolution } from './check-solution';
import {
  solveFraction,
  solveLinearInequality,
  solveQuadratic,
  solveQuadraticFunction,
  type EngineResult,
  type VerificationStatus,
} from './math-engine';

type Case = {
  name: string;
  input: string;
  status: VerificationStatus;
  answer?: string;
};

const assert = (condition: boolean, message: string): void => {
  if (!condition) throw new Error(message);
};

const runCases = (
  label: string,
  cases: Case[],
  solve: (input: string) => EngineResult,
): { total: number; unsupported: number } => {
  let unsupported = 0;
  for (const testCase of cases) {
    const result = solve(testCase.input);
    assert(result.status === testCase.status, `${label}/${testCase.name}: expected ${testCase.status}, got ${result.status}`);
    if (result.status === 'unsupported') unsupported += 1;
    if (testCase.answer) {
      assert(result.exactAnswer === testCase.answer, `${label}/${testCase.name}: expected ${testCase.answer}, got ${result.exactAnswer}`);
    }
  }
  return { total: cases.length, unsupported };
};

const grade5Fractions: Case[] = [
  { name: 'add unlike denominators', input: '1/2 + 1/3', status: 'verified', answer: '5/6' },
  { name: 'subtract unlike denominators', input: '5/6 - 1/4', status: 'verified', answer: '7/12' },
  { name: 'multiply fractions', input: '2/3 * 3/4', status: 'verified', answer: '1/2' },
  { name: 'divide fractions', input: '3/4 / (1/2)', status: 'verified', answer: '3/2' },
  { name: 'parenthesized sum', input: '(1/2 + 1/4)', status: 'verified', answer: '3/4' },
  { name: 'mixed operations', input: '1/2 + 1/3 * 3/4', status: 'verified', answer: '3/4' },
  { name: 'whole minus fraction', input: '1 - 2/5', status: 'verified', answer: '3/5' },
  { name: 'negative fraction', input: '-2/3 + 1/3', status: 'verified', answer: '-1/3' },
  { name: 'decimal to fraction', input: '0.5 + 0.25', status: 'verified', answer: '3/4' },
  { name: 'nested parentheses', input: '(1/2 + 1/6) * 3/2', status: 'verified', answer: '1' },
  { name: 'equivalent equality', input: '3/4 = 6/8', status: 'verified', answer: '3/4 = 3/4' },
  { name: 'true comparison', input: '1/2 < 3/4', status: 'verified', answer: '1/2 < 3/4' },
  { name: 'true greater comparison', input: '5/6 > 2/3', status: 'verified', answer: '5/6 > 2/3' },
  { name: 'true inclusive comparison', input: '4/8 <= 1/2', status: 'verified', answer: '1/2 <= 1/2' },
  { name: 'zero result', input: '2/5 - 2/5', status: 'verified', answer: '0' },
  { name: 'one result', input: '7/9 / (7/9)', status: 'verified', answer: '1' },
  { name: 'integer fraction', input: '9/3', status: 'verified', answer: '3' },
  { name: 'operator glyphs', input: '1⁄2 + 1⁄2', status: 'unsupported' },
  { name: 'false equality', input: '2/3 = 3/4', status: 'incorrect' },
  { name: 'false less comparison', input: '3/4 < 1/2', status: 'incorrect' },
  { name: 'false greater comparison', input: '1/4 > 2/4', status: 'incorrect' },
  { name: 'division by zero', input: '3/4 / 0', status: 'unsupported' },
  { name: 'zero denominator', input: '3/0', status: 'unsupported' },
  { name: 'variable expression', input: 'x/2 + 1', status: 'unsupported' },
  { name: 'malformed denominator', input: '1/', status: 'unsupported' },
  { name: 'missing operand', input: '1/2 +', status: 'unsupported' },
  { name: 'unsupported mixed number', input: '2 1/3', status: 'unsupported' },
  { name: 'unsupported percent', input: '25%', status: 'unsupported' },
  { name: 'unsupported word problem', input: '3 apples and 2 apples', status: 'unsupported' },
  { name: 'ambiguous slash chain', input: '1/2/3', status: 'verified', answer: '1/6' },
];

const grade8Inequalities: Case[] = [
  { name: 'positive coefficient less', input: '2x < 6', status: 'verified', answer: 'x < 3' },
  { name: 'positive coefficient greater', input: '3x > 12', status: 'verified', answer: 'x > 4' },
  { name: 'positive coefficient inclusive less', input: '4x <= 20', status: 'verified', answer: 'x <= 5' },
  { name: 'positive coefficient inclusive greater', input: '5x >= 15', status: 'verified', answer: 'x >= 3' },
  { name: 'negative coefficient reverses less', input: '-2x < 6', status: 'verified', answer: 'x > -3' },
  { name: 'negative coefficient reverses greater', input: '-3x > 9', status: 'verified', answer: 'x < -3' },
  { name: 'negative inclusive less', input: '-4x <= 8', status: 'verified', answer: 'x >= -2' },
  { name: 'negative inclusive greater', input: '-5x >= -10', status: 'verified', answer: 'x <= 2' },
  { name: 'constant transfer', input: '2x + 4 < 10', status: 'verified', answer: 'x < 3' },
  { name: 'negative constant transfer', input: '3x - 6 >= 9', status: 'verified', answer: 'x >= 5' },
  { name: 'variable both sides', input: '3x + 2 < x + 10', status: 'verified', answer: 'x < 4' },
  { name: 'variable both sides reverse', input: '2x + 5 > 4x - 1', status: 'verified', answer: 'x < 3' },
  { name: 'parentheses', input: '2(x + 1) <= 8', status: 'verified', answer: 'x <= 3' },
  { name: 'negative parentheses', input: '-2(x - 1) > 6', status: 'verified', answer: 'x < -2' },
  { name: 'decimal coefficient', input: '0.5x <= 2', status: 'verified', answer: 'x <= 4' },
  { name: 'fraction coefficient', input: 'x/2 > 3', status: 'verified', answer: 'x > 6' },
  { name: 'zero coefficient true', input: '0x + 1 < 2', status: 'verified', answer: 'Бүх бодит тоо' },
  { name: 'zero coefficient false', input: '0x + 2 < 1', status: 'verified', answer: 'Шийдгүй' },
  { name: 'equal constants true', input: '2x + 1 <= 2x + 1', status: 'verified', answer: 'Бүх бодит тоо' },
  { name: 'equal constants false', input: '2x + 1 > 2x + 2', status: 'verified', answer: 'Шийдгүй' },
  { name: 'unicode less equal', input: '2x ≤ 8', status: 'verified', answer: 'x <= 4' },
  { name: 'unicode greater equal', input: '-2x ≥ -6', status: 'verified', answer: 'x <= 3' },
  { name: 'wrong relation answer', input: '2x < 5', status: 'verified', answer: 'x < 5/2' },
  { name: 'missing relation', input: '2x + 3', status: 'unsupported' },
  { name: 'quadratic inequality unsupported', input: 'x^2 < 4', status: 'unsupported' },
  { name: 'variable denominator unsupported', input: '1/x < 2', status: 'unsupported' },
  { name: 'division by zero', input: 'x/0 < 2', status: 'unsupported' },
  { name: 'malformed operator', input: '2x << 4', status: 'unsupported' },
  { name: 'missing right side', input: '2x <', status: 'unsupported' },
  { name: 'word relation unsupported', input: 'x is greater than 2', status: 'unsupported' },
  { name: 'cube unsupported', input: 'x^3 < 8', status: 'unsupported' },
  { name: 'multiple variables unsupported', input: '2x + y < 4', status: 'unsupported' },
  { name: 'ambiguous chained relation', input: '1 < x < 3', status: 'unsupported' },
  { name: 'empty input', input: '', status: 'unsupported' },
  { name: 'invalid symbol', input: '2x @ 3', status: 'unsupported' },
];

const grade11Quadratics: Case[] = [
  { name: 'two integer roots', input: 'x^2 - 5x + 6 = 0', status: 'verified', answer: '2, 3' },
  { name: 'two symmetric roots', input: 'x^2 - 4 = 0', status: 'verified', answer: '-2, 2' },
  { name: 'repeated root', input: 'x^2 - 4x + 4 = 0', status: 'verified', answer: '2' },
  { name: 'no real roots', input: 'x^2 + 1 = 0', status: 'verified', answer: 'Бодит шийдгүй' },
  { name: 'negative leading coefficient', input: '-x^2 + 5x - 6 = 0', status: 'verified', answer: '2, 3' },
  { name: 'scaled equation', input: '2x^2 - 10x + 12 = 0', status: 'verified', answer: '2, 3' },
  { name: 'missing linear term', input: 'x^2 - 9 = 0', status: 'verified', answer: '-3, 3' },
  { name: 'missing constant term', input: 'x^2 - 3x = 0', status: 'verified', answer: '0, 3' },
  { name: 'decimal coefficients', input: '0.5x^2 - 2x + 1.5 = 0', status: 'verified', answer: '1, 3' },
  { name: 'fraction coefficients', input: 'x^2/2 - 2x + 2 = 0', status: 'verified', answer: '2' },
  { name: 'factored expression', input: '(x - 2)(x - 3) = 0', status: 'verified', answer: '2, 3' },
  { name: 'expanded expression', input: 'x^2 - 7x + 12 = 0', status: 'verified', answer: '3, 4' },
  { name: 'unicode square', input: 'x² - 6x + 9 = 0', status: 'verified', answer: '3' },
  { name: 'negative roots', input: 'x^2 + 5x + 6 = 0', status: 'verified', answer: '-3, -2' },
  { name: 'irrational roots approximate', input: 'x^2 - 2 = 0', status: 'verified', answer: '-1.414214, 1.414214' },
  { name: 'fraction root', input: '4x^2 - 4x + 1 = 0', status: 'verified', answer: '0.5' },
  { name: 'nonmonic quadratic', input: '3x^2 + 3x - 6 = 0', status: 'verified', answer: '-2, 1' },
  { name: 'translated quadratic', input: '(x + 1)^2 - 4 = 0', status: 'verified', answer: '-3, 1' },
  { name: 'double negative', input: '-2x^2 - 8x - 8 = 0', status: 'verified', answer: '-2' },
  { name: 'false quadratic relation', input: 'x^2 + 1 = 2', status: 'verified', answer: '-1, 1' },
  { name: 'function basic', input: 'y = x^2 - 4x + 3', status: 'verified' },
  { name: 'function opening down', input: 'y = -x^2 + 2x + 3', status: 'verified' },
  { name: 'function translated', input: 'y = (x - 2)^2 + 1', status: 'verified' },
  { name: 'function no intercepts', input: 'y = x^2 + 4', status: 'verified' },
  { name: 'function repeated intercept', input: 'y = x^2 - 2x + 1', status: 'verified' },
  { name: 'function decimal', input: 'y = 0.5x^2 - x + 2', status: 'verified' },
  { name: 'function graph vertex', input: 'y = x^2 - 6x + 5', status: 'verified' },
  { name: 'function graph points', input: 'y = 2x^2 + 4x + 1', status: 'verified' },
  { name: 'function unicode input', input: 'y = x² + 2x + 1', status: 'verified' },
  { name: 'unsupported linear equation', input: '2x + 1 = 5', status: 'unsupported' },
  { name: 'unsupported cubic', input: 'x^3 - 1 = 0', status: 'unsupported' },
  { name: 'unsupported variable denominator', input: 'x^2/x = 2', status: 'unsupported' },
  { name: 'unsupported inequality', input: 'x^2 > 4', status: 'unsupported' },
  { name: 'malformed quadratic', input: 'x^2 + = 0', status: 'unsupported' },
  { name: 'division by zero', input: 'x^2/0 = 1', status: 'unsupported' },
  { name: 'multiple variables', input: 'x^2 + y = 1', status: 'unsupported' },
  { name: 'ambiguous text', input: 'solve x squared', status: 'unsupported' },
  { name: 'empty equation', input: '= 0', status: 'unsupported' },
  { name: 'function nonquadratic', input: 'y = 2x + 1', status: 'unsupported' },
  { name: 'function malformed', input: 'y = x^2 +', status: 'unsupported' },
];

const fractionSummary = runCases('Grade 5', grade5Fractions, solveFraction);
const inequalitySummary = runCases('Grade 8', grade8Inequalities, solveLinearInequality);

let graphChecks = 0;
for (const testCase of grade11Quadratics) {
  const result = testCase.input.startsWith('y =')
    ? solveQuadraticFunction(testCase.input)
    : solveQuadratic(testCase.input);
  assert(result.status === testCase.status, `Grade 11/${testCase.name}: expected ${testCase.status}, got ${result.status}`);
  if (result.status === 'unsupported') graphChecks += 1;
  if (testCase.answer) assert(result.exactAnswer === testCase.answer, `Grade 11/${testCase.name}: expected ${testCase.answer}, got ${result.exactAnswer}`);
  if (testCase.input.startsWith('y =') && result.status === 'verified') {
    assert(Boolean(result.graphData), `Grade 11/${testCase.name}: graph data missing`);
  }
}

const stepCases = [
  {
    name: 'fraction equivalent step',
    result: checkSolution('1/2 + 1/4', ['1/2 + 1/4', '2/4 + 1/4', '3/4']),
    correct: true,
  },
  {
    name: 'fraction invalid step',
    result: checkSolution('1/2 + 1/4', ['1/2 + 1/4', '2/4 + 2/4']),
    correct: false,
  },
  {
    name: 'inequality sign reversal',
    result: checkSolution('2x < 6', ['2x < 6', 'x > 3']),
    correct: false,
  },
  {
    name: 'inequality correct step',
    result: checkSolution('2x < 6', ['2x < 6', 'x < 3']),
    correct: true,
  },
  {
    name: 'negative division wrong direction',
    result: checkSolution('-2x > 6', ['-2x > 6', 'x > -3']),
    correct: false,
  },
  {
    name: 'negative division reversed direction',
    result: checkSolution('-2x > 6', ['-2x > 6', 'x < -3']),
    correct: true,
  },
  {
    name: 'quadratic missing root',
    result: checkSolution('x^2 - 5x + 6 = 0', ['x^2 - 5x + 6 = 0', 'x = 2']),
    correct: false,
  },
  {
    name: 'quadratic equivalent repeated step',
    result: checkSolution('x^2 - 5x + 6 = 0', ['x^2 - 5x + 6 = 0', 'x^2 - 5x + 6 = 0']),
    correct: true,
  },
];

for (const testCase of stepCases) {
  assert(testCase.result.correct === testCase.correct, `Step/${testCase.name}: unexpected correct=${testCase.result.correct}`);
}
assert(stepCases[2].result.firstErrorStep === 2, 'Step/inequality sign reversal: expected first error step 2');
assert(stepCases[4].result.firstErrorStep === 2, 'Step/negative inequality reversal: expected first error step 2');
assert(stepCases[6].result.firstErrorStep === 2, 'Step/quadratic missing root: expected first error step 2');

const total = fractionSummary.total + inequalitySummary.total + grade11Quadratics.length + stepCases.length;
const unsupported = fractionSummary.unsupported + inequalitySummary.unsupported + graphChecks;
console.log(`Math Engine v2 regression tests: ${total} passed; ${unsupported} explicitly unsupported cases`);
