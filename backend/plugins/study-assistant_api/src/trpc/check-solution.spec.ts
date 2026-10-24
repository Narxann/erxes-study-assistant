import { checkSolution } from './check-solution';

type TestCase = {
  name: string;
  problem: string;
  steps: string[];
  correct: boolean;
  errorType?: string;
  firstErrorStep?: number | null;
};

const cases: TestCase[] = [
  { name: 'basic correct', problem: '2x + 3 = 11', steps: ['2x + 3 = 11', '2x = 8', 'x = 4'], correct: true },
  { name: 'subtraction correct', problem: '3x - 2 = 10', steps: ['3x - 2 = 10', '3x = 12', 'x = 4'], correct: true },
  { name: 'negative coefficient', problem: '-2x + 3 = -5', steps: ['-2x + 3 = -5', '-2x = -8', 'x = 4'], correct: true },
  { name: 'decimal coefficient', problem: '0.5x + 1 = 3', steps: ['0.5x + 1 = 3', '0.5x = 2', 'x = 4'], correct: true },
  { name: 'fractional coefficient', problem: 'x / 2 + 1 = 3', steps: ['x / 2 + 1 = 3', 'x / 2 = 2', 'x = 4'], correct: true },
  { name: 'variables on both sides', problem: '3x + 2 = x + 10', steps: ['3x + 2 = x + 10', '2x = 8', 'x = 4'], correct: true },
  { name: 'equivalent scaling', problem: '4x + 6 = 22', steps: ['4x + 6 = 22', '2x + 3 = 11', 'x = 4'], correct: true },
  { name: 'equivalent reordered terms', problem: '3 + 2x = 11', steps: ['3 + 2x = 11', '2x = 8', 'x = 4'], correct: true },
  { name: 'distribution correct', problem: '2(x + 3) = 14', steps: ['2(x + 3) = 14', '2x + 6 = 14', '2x = 8', 'x = 4'], correct: true },
  { name: 'negative unary correct', problem: '-(x + 2) = -6', steps: ['-(x + 2) = -6', '-x - 2 = -6', '-x = -4', 'x = 4'], correct: true },
  { name: 'sign transfer', problem: '2x + 3 = 11', steps: ['2x + 3 = 11', '2x = 11 + 3'], correct: false, errorType: 'sign-change', firstErrorStep: 2 },
  { name: 'subtraction sign transfer', problem: '3x - 2 = 10', steps: ['3x - 2 = 10', '3x = 10 - 2'], correct: false, errorType: 'sign-change', firstErrorStep: 2 },
  { name: 'arithmetic mistake', problem: '2x + 3 = 11', steps: ['2x + 3 = 11', '2x = 9'], correct: false, errorType: 'arithmetic', firstErrorStep: 2 },
  { name: 'negative arithmetic mistake', problem: '-2x + 3 = -5', steps: ['-2x + 3 = -5', '-2x = -2'], correct: false, errorType: 'arithmetic', firstErrorStep: 2 },
  { name: 'division mistake', problem: '2x = 8', steps: ['2x = 8', 'x = 8 / 1'], correct: false, errorType: 'division', firstErrorStep: 2 },
  { name: 'distribution mistake', problem: '2(x + 3) = 14', steps: ['2(x + 3) = 14', '2x + 3 = 14'], correct: false, errorType: 'distribution', firstErrorStep: 2 },
  { name: 'invalid syntax', problem: '2x + 3 = 11', steps: ['2x + 3 = 11', '2x 8'], correct: false, errorType: 'invalid-step', firstErrorStep: 2 },
  { name: 'empty step', problem: '2x + 3 = 11', steps: ['2x + 3 = 11', ''], correct: false, errorType: 'invalid-step', firstErrorStep: 2 },
  { name: 'missing steps', problem: '2x + 3 = 11', steps: [], correct: false, errorType: 'missing-steps', firstErrorStep: null },
  { name: 'division by zero', problem: 'x / 0 = 2', steps: ['x / 0 = 2', 'x = 0'], correct: false, errorType: 'unsupported', firstErrorStep: null },
  { name: 'contradiction', problem: '2x + 1 = 2x + 3', steps: ['2x + 1 = 2x + 3'], correct: false, errorType: 'unsupported', firstErrorStep: null },
  { name: 'infinite solutions', problem: '2x + 1 = 2x + 1', steps: ['2x + 1 = 2x + 1'], correct: false, errorType: 'unsupported', firstErrorStep: null },
  { name: 'quadratic unsupported', problem: 'x^2 = 4', steps: ['x^2 = 4', 'x = 2'], correct: false, errorType: 'unsupported', firstErrorStep: null },
  { name: 'nonlinear product unsupported', problem: 'x(x + 1) = 6', steps: ['x(x + 1) = 6', 'x = 2'], correct: false, errorType: 'unsupported', firstErrorStep: null },
  { name: 'variable denominator unsupported', problem: '1 / x = 2', steps: ['1 / x = 2', 'x = 0.5'], correct: false, errorType: 'unsupported', firstErrorStep: null },
  { name: 'incorrect final answer', problem: '2x + 3 = 11', steps: ['2x + 3 = 11', '2x = 8', 'x = 5'], correct: false, errorType: 'arithmetic', firstErrorStep: 3 },
  { name: 'correct final after invalid intermediate', problem: '2x + 3 = 11', steps: ['2x + 3 = 11', '2x = 14', 'x = 4'], correct: false, firstErrorStep: 2 },
  { name: 'identity intermediate rejected', problem: '2x + 3 = 11', steps: ['2x + 3 = 11', '0x + 0 = 0'], correct: false, errorType: 'invalid-step', firstErrorStep: 2 },
  { name: 'contradiction intermediate rejected', problem: '2x + 3 = 11', steps: ['2x + 3 = 11', '0x + 1 = 0'], correct: false, errorType: 'invalid-step', firstErrorStep: 2 },
  { name: 'extra equals rejected', problem: '2x + 3 = 11', steps: ['2x + 3 = 11', '2x = 8 = 8'], correct: false, errorType: 'invalid-step', firstErrorStep: 2 },
  { name: 'infinity syntax rejected', problem: '2x + 3 = 11', steps: ['2x + 3 = 11', '2x = ∞'], correct: false, errorType: 'invalid-step', firstErrorStep: 2 },
];

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

for (const testCase of cases) {
  const result = checkSolution(testCase.problem, testCase.steps);
  assert(result.correct === testCase.correct, `${testCase.name}: unexpected correct=${result.correct}`);
  if (testCase.errorType) {
    assert(result.errorType === testCase.errorType, `${testCase.name}: expected ${testCase.errorType}, got ${result.errorType}`);
  }
  if (testCase.firstErrorStep !== undefined) {
    assert(result.firstErrorStep === testCase.firstErrorStep, `${testCase.name}: unexpected firstErrorStep=${result.firstErrorStep}`);
  }
  if (!testCase.correct && testCase.firstErrorStep !== null && testCase.firstErrorStep !== undefined) {
    assert(Boolean(result.correctedStep), `${testCase.name}: missing correctedStep`);
  }
}

console.log(`${cases.length} Error Detective stress tests passed`);
