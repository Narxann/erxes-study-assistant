import { ILearningAttempt } from '@/learning/@types/learning';

export type LearningSolution = Omit<ILearningAttempt, 'grade' | 'problem' | 'imageReference'> & {
  recognized: string;
  topic: string;
  answer: string;
  steps: string[];
  hint: string;
  practice: string;
  confidence: number;
};

const demoSolution = (problem: string, grade: number): LearningSolution => ({
  source: 'demo',
  recognized: problem || '2x + 3 = 11',
  topic: grade <= 8 ? 'Шугаман тэгшитгэл' : 'Алгебр',
  answer: 'x = 4',
  hint: 'Эхлээд хоёр талаас 3-ыг хасвал x-тэй хэсэгт юу үлдэх вэ?',
  steps: [
    'Зорилго: x-ийг ганцаардуулах.',
    'Хоёр талаас 3-ыг хасна: 2x + 3 − 3 = 11 − 3.',
    'Ингээд 2x = 8 болно.',
    'Хоёр талыг 2-т хуваана: x = 8 ÷ 2 = 4.',
    'Шалгалт: 2 × 4 + 3 = 11. Тэнцэтгэл зөв.',
  ],
  practice: 'Ижил аргаар бод: 3x + 2 = 14.',
  confidence: 1,
});

function cleanJson(value: string) {
  return value.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
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
        'Зөвхөн дараах JSON бүтэцтэй хариу өг: {"recognized":"","topic":"","answer":"","hint":"","steps":[],"practice":"","confidence":0}',
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
    const parsed = JSON.parse(cleanJson(text)) as Omit<LearningSolution, 'source'>;
    return { ...parsed, source: 'gemini' };
  } catch {
    return demoSolution(problem, grade);
  }
}
