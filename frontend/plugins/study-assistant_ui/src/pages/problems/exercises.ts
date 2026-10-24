export type LessonGrade = 5 | 8 | 11;

export type LessonStage =
  | {
      kind: 'choice';
      prompt: string;
      choices: Array<{ id: string; label: string }>;
      correctChoice: string;
      hint: string;
      explanation: string;
    }
  | {
      kind: 'fill';
      prompt: string;
      placeholder: string;
      validate: (answer: string) => boolean;
      expected: string;
      hint: string;
      explanation: string;
    }
  | {
      kind: 'independent';
      prompt: string;
      placeholder: string;
      validate: (answer: string) => boolean;
      expected: string;
      hint: string;
      explanation: string;
    };

export type LessonDefinition = {
  id: string;
  grade: LessonGrade;
  topic: string;
  problem: string;
  stages: [LessonStage, LessonStage, LessonStage];
  answer: string;
};

export type LessonProgress = {
  stage: 0 | 1 | 2;
  completed: boolean;
};

const compact = (value: string) => value.toLowerCase().replace(/\s+/g, '').replace(/[−–]/g, '-');

const rational = (value: string): { numerator: number; denominator: number } | null => {
  const match = compact(value).match(/^(-?\d+)(?:\/(-?\d+))?$/);
  if (!match) return null;
  const numerator = Number(match[1]);
  const denominator = Number(match[2] || 1);
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) return null;
  const divisor = Math.abs(gcd(numerator, denominator));
  return {
    numerator: (numerator / divisor) * Math.sign(denominator),
    denominator: Math.abs(denominator / divisor),
  };
};

const gcd = (left: number, right: number): number => {
  let a = Math.abs(left);
  let b = Math.abs(right);
  while (b) {
    const remainder = a % b;
    a = b;
    b = remainder;
  }
  return a || 1;
};

export const equivalentFraction = (answer: string, expected: string) => {
  const actual = rational(answer);
  const target = rational(expected);
  return Boolean(actual && target && actual.numerator === target.numerator && actual.denominator === target.denominator);
};

export const equivalentInequality = (answer: string, expected = 'x < -3') => {
  const normalize = (value: string) => compact(value).replace(/<=/g, '≤').replace(/>=/g, '≥');
  return normalize(answer) === normalize(expected);
};

export const equivalentQuadraticRoots = (answer: string) => {
  const roots = [...answer.matchAll(/(?:x\s*=\s*)?(-?\d+(?:\.\d+)?)/gi)].map((match) => Number(match[1]));
  return roots.length === 2 && roots.sort((a, b) => a - b).join(',') === '2,3';
};

export const LESSONS: LessonDefinition[] = [
  {
    id: 'grade-5-fraction-addition',
    grade: 5,
    topic: 'Бутархай нэмэх',
    problem: '1/4 + 2/4',
    answer: '3/4',
    stages: [
      {
        kind: 'choice',
        prompt: 'Ижил нэртэй бутархайг нэмэхдээ эхлээд юу хийх вэ?',
        choices: [
          { id: 'add-numerators', label: 'Хүртвэрүүдийг нэмнэ' },
          { id: 'add-denominators', label: 'Нэрүүдийг нэмнэ' },
          { id: 'multiply-all', label: 'Бүх тоог үржүүлнэ' },
        ],
        correctChoice: 'add-numerators',
        hint: 'Нэр 4 хэвээр үлдэнэ.',
        explanation: 'Ижил нэртэй тул хүртвэрүүдийг нэмээд нэрийг хэвээр үлдээнэ.',
      },
      {
        kind: 'fill',
        prompt: '1/4 + 2/4 = ?/4. Дутуу хүртвэрийг бичээрэй.',
        placeholder: 'Жишээ: 3',
        validate: (answer) => compact(answer) === '3',
        expected: '3',
        hint: '1 + 2-ыг бодоорой.',
        explanation: '1 + 2 = 3 тул түр зуурын үр дүн 3/4 байна.',
      },
      {
        kind: 'independent',
        prompt: 'Эцсийн хариуг бутархайгаар бичээрэй.',
        placeholder: 'Жишээ: 3/4',
        validate: (answer) => equivalentFraction(answer, '3/4'),
        expected: '3/4',
        hint: 'Нэр 4, хүртвэр 3.',
        explanation: 'Тийм ээ, 1/4 + 2/4 = 3/4.',
      },
    ],
  },
  {
    id: 'grade-8-negative-inequality',
    grade: 8,
    topic: 'Сөрөг тоогоор тэнцэтгэл биш хуваах',
    problem: '-2x > 6',
    answer: 'x < -3',
    stages: [
      {
        kind: 'choice',
        prompt: '-2x > 6-ыг x-ийн ганцаарчилсан хэлбэрт оруулахын тулд юу хийх вэ?',
        choices: [
          { id: 'divide-negative', label: 'Хоёр талыг -2-т хуваана, тэмдгийг эргүүлнэ' },
          { id: 'divide-positive', label: 'Хоёр талыг 2-т хуваана' },
          { id: 'subtract-seven', label: 'Хоёр талаас 7 хасна' },
        ],
        correctChoice: 'divide-negative',
        hint: 'x-ийн коэффициент -2 байна.',
        explanation: 'Сөрөг тоогоор хуваахад тэнцэтгэл бишийн тэмдэг эсрэг чиглэлтэй болдог.',
      },
      {
        kind: 'fill',
        prompt: '-2x > 6-ыг -2-т хуваахад баруун талд ямар тоо үлдэх вэ?',
        placeholder: 'Жишээ: -3',
        validate: (answer) => equivalentFraction(answer, '-3'),
        expected: '-3',
        hint: '6 ÷ (-2)-ыг бодоорой.',
        explanation: '6 ÷ (-2) = -3.',
      },
      {
        kind: 'independent',
        prompt: 'Зөв тэмдэгтэй эцсийн хариуг бичээрэй.',
        placeholder: 'Жишээ: x < -3',
        validate: (answer) => equivalentInequality(answer),
        expected: 'x < -3',
        hint: 'Сөрөг тоогоор хуваасан тул > тэмдэг < болно.',
        explanation: 'Зөв хариу нь x < -3. x > -3 гэж бичвэл тэмдэг эргээгүй байна.',
      },
    ],
  },
  {
    id: 'grade-11-quadratic-factoring',
    grade: 11,
    topic: 'Квадрат тэгшитгэл задлах',
    problem: 'x² - 5x + 6 = 0',
    answer: 'x = 2, x = 3',
    stages: [
      {
        kind: 'choice',
        prompt: 'x² - 5x + 6-ыг зөв үржигдэхүүнд задлаарай.',
        choices: [
          { id: 'factor-correct', label: '(x - 2)(x - 3) = 0' },
          { id: 'factor-plus', label: '(x + 2)(x + 3) = 0' },
          { id: 'factor-mixed', label: '(x - 1)(x - 6) = 0' },
        ],
        correctChoice: 'factor-correct',
        hint: 'Үржвэр нь 6, нийлбэр нь -5 байх хоёр тоог ол.',
        explanation: '-2 ба -3-ын үржвэр 6, нийлбэр -5 тул (x - 2)(x - 3) болно.',
      },
      {
        kind: 'fill',
        prompt: '(x - 2)(x - 3) = 0 үед эхний язгуур хэд вэ?',
        placeholder: 'Жишээ: 2',
        validate: (answer) => compact(answer) === '2',
        expected: '2',
        hint: 'x - 2 = 0 тэгшитгэлийг бод.',
        explanation: 'x - 2 = 0 тул x = 2.',
      },
      {
        kind: 'independent',
        prompt: 'Хоёр язгуурыг хоёуланг нь бичээрэй.',
        placeholder: 'Жишээ: x = 2, x = 3',
        validate: equivalentQuadraticRoots,
        expected: 'x = 2, x = 3',
        hint: 'Нөгөө үржигдэхүүн x - 3 = 0.',
        explanation: 'Хоёр язгуур нь x = 2 болон x = 3.',
      },
    ],
  },
];

export const getLessonForGrade = (grade: number) => LESSONS.find((lesson) => lesson.grade === grade);

export const isSupportedLessonProblem = (value: string) =>
  LESSONS.some((lesson) => compact(lesson.problem) === compact(value));

export const submitLessonStage = (
  lesson: LessonDefinition,
  progress: LessonProgress,
  answer: string,
): { correct: boolean; progress: LessonProgress } => {
  if (progress.completed) return { correct: false, progress };
  const stage = lesson.stages[progress.stage];
  const correct = stage.kind === 'choice' ? answer === stage.correctChoice : stage.validate(answer);
  if (!correct) return { correct: false, progress };
  if (progress.stage === 2) return { correct: true, progress: { stage: 2, completed: true } };
  return { correct: true, progress: { stage: (progress.stage + 1) as 0 | 1 | 2, completed: false } };
};
