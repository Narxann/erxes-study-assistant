import { ILearningAttempt } from '@/learning/@types/learning';
import { solveLinearEquation } from './trpc/check-solution';

export type LearningSolution = Omit<ILearningAttempt, 'grade' | 'problem' | 'imageReference'> & {
  recognized: string;
  topic: string;
  answer: string;
  steps: string[];
  hint: string;
  practice: string;
  practiceAnswer: string;
  confidence: number;
};

const demoSolution = (problem: string, grade: number): LearningSolution => {
  const recognized = problem.trim();
  const answer = recognized ? solveLinearEquation(recognized) : null;
  if (answer === null) {
    return {
      source: 'demo',
      recognized: recognized || 'Бодлогыг таньж чадсангүй',
      topic: grade <= 8 ? 'Математик' : 'Алгебр',
      answer: 'Баталгаажаагүй',
      hint: 'Тэгшитгэлээ текстээр шалгаад дахин оруулна уу.',
      steps: ['Энэ бодлогыг одоогоор найдвартай таньж, бодож чадсангүй.'],
      practice: 'Зөвхөн нэг хувьсагчтай шугаман тэгшитгэл оруулж үзээрэй.',
      practiceAnswer: '',
      confidence: 0,
    };
  }

  return {
    source: 'demo',
    recognized,
    topic: grade <= 8 ? 'Шугаман тэгшитгэл' : 'Алгебр',
    answer: `x = ${answer}`,
    hint: 'Тогтмол гишүүнийг эхлээд нөгөө талд шилжүүлээд, дараа нь x-ийн коэффициентод хуваана.',
    steps: [
      'Зорилго: x-ийг ганцаардуулах.',
      `Тэнцэтгэлийн хоёр талд ижил үйлдэл хийж, x-тэй гишүүнийг тусгаарлана.`,
      `Шийд: x = ${answer}.`,
      `Шалгалт: x = ${answer} утгыг эх бодлогод орлуулж тэнцлийг шалгана.`,
    ],
    practice: 'Ижил аргаар бод: 3x + 2 = 14.',
    practiceAnswer: '4',
    confidence: 1,
  };
};

function cleanJson(value: string) {
  return value.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
}

type GeminiSolution = {
  recognized?: string;
  topic?: string;
  answer?: string;
  hint?: string;
  steps?: string[];
  practice?: string;
  practiceAnswer?: string;
  confidence?: number;
};

function normalizeGeminiSolution(value: GeminiSolution, problem: string, grade: number): LearningSolution {
  const fallback = demoSolution(problem, grade);
  if (
    typeof value.recognized !== 'string' ||
    typeof value.topic !== 'string' ||
    typeof value.answer !== 'string' ||
    typeof value.hint !== 'string' ||
    !Array.isArray(value.steps) ||
    value.steps.some((step) => typeof step !== 'string') ||
    typeof value.practice !== 'string' ||
    typeof value.confidence !== 'number'
  ) {
    return fallback;
  }
  return {
    source: 'gemini',
    recognized: value.recognized,
    topic: value.topic,
    answer: value.answer,
    hint: value.hint,
    steps: value.steps,
    practice: value.practice,
    practiceAnswer: typeof value.practiceAnswer === 'string' ? value.practiceAnswer : '',
    confidence: Math.max(0, Math.min(1, value.confidence)),
  };
}

export async function solveWithGemini(
  problem: string,
  grade: number,
  imageData?: string,
): Promise<LearningSolution> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return demoSolution(problem, grade);
  }

  const parts: Array<Record<string, unknown>> = [
    {
      text: [
        `Сурагч ${grade}-р ангийн түвшинд суралцаж байна.`,
        'Чи Монгол хэлээр тэвчээртэй математикийн багш.',
        'Өгсөн бодлогын сэдвийг өөрөө тодорхойлж, тухайн ангийн түвшинд энгийнээр тайлбарла.',
        'Хариуг дангаар нь биш, алхам бүрийн учир шалтгааныг тайлбарла.',
        'Зөвхөн дараах JSON бүтэцтэй хариу өг: {"recognized":"","topic":"","answer":"","hint":"","steps":[],"practice":"","practiceAnswer":"","confidence":0}',
        `Бодлого: ${problem || '(зурагнаас танина)'}`,
      ].join('\n'),
    },
  ];

  if (imageData) {
    const [metadata, encoded] = imageData.split(',');
    const mimeType = metadata.match(/data:(.*?);base64/)?.[1] || 'image/jpeg';
    parts.push({ inline_data: { mime_type: mimeType, data: encoded || imageData } });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL || 'gemini-2.0-flash'}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
        }),
      },
    );
    if (!response.ok) {
      throw new Error(`Gemini request failed with status ${response.status}`);
    }
    const payload = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('') || '';
    const parsed = JSON.parse(cleanJson(text)) as GeminiSolution;
    return normalizeGeminiSolution(parsed, problem, grade);
  } catch {
    return demoSolution(problem, grade);
  }
}
