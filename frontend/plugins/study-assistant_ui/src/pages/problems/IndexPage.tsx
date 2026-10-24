import { useMemo, useRef, useState } from 'react';
import { gql, useMutation, useQuery } from '@apollo/client';
import {
  Badge,
  Button,
  Card,
  Input,
  Select,
  Textarea,
  toast,
} from 'erxes-ui';
import {
  IconActivity,
  IconAlertTriangle,
  IconArrowRight,
  IconBulb,
  IconCalendar,
  IconCamera,
  IconChevronRight,
  IconCircleCheck,
  IconFileUpload,
  IconHistory,
  IconRefresh,
  IconSparkles,
  IconTarget,
} from '@tabler/icons-react';

type Solution = {
  source: string;
  recognized: string;
  topic: string;
  answer: string;
  concept: string;
  hint: string;
  steps: string[];
  practice: string;
  confidence: number;
};

type Attempt = {
  _id: string;
  grade: number;
  problem: string;
  topic?: string;
  answer?: string;
  source: string;
  createdAt?: string;
};

type CheckResult = {
  correct: boolean;
  firstErrorStep: number | null;
  expectedAnswer: number | null;
  explanation: string;
  errorType: string | null;
  errorTitle: string | null;
  correction: string | null;
  nextExercise: string | null;
};

type SolveData = { studyAssistantSolve: Solution };
type CheckData = { studyAssistantCheckSolution: CheckResult };
type SolveVariables = {
  grade: number;
  problem?: string;
  imageData?: string;
  imageReference?: string;
};
type AttemptsData = { studyAssistantLearningAttempts: Attempt[] };

const SOLVE = gql`
  mutation StudyAssistantSolve(
    $grade: Int!
    $problem: String
    $imageData: String
    $imageReference: String
  ) {
    studyAssistantSolve(
      grade: $grade
      problem: $problem
      imageData: $imageData
      imageReference: $imageReference
    ) {
      source
      recognized
      topic
      answer
      concept
      hint
      steps
      practice
      confidence
    }
  }
`;

const ATTEMPTS = gql`
  query StudyAssistantLearningAttempts($grade: Int) {
    studyAssistantLearningAttempts(grade: $grade) {
      _id
      grade
      problem
      topic
      answer
      source
      createdAt
    }
  }
`;

const CHECK_SOLUTION = gql`
  mutation StudyAssistantCheckSolution(
    $problem: String!
    $steps: [String!]!
  ) {
    studyAssistantCheckSolution(problem: $problem, steps: $steps) {
      correct
      firstErrorStep
      expectedAnswer
      explanation
      errorType
      errorTitle
      correction
      nextExercise
    }
  }
`;

const grades = Array.from({ length: 12 }, (_, index) => index + 1);
const symbols = ['√', '²', '³', 'π', '÷', '×', '±', '≤', '≥', '≠', '∞', '(', ')'];
const initialProblem = '2x + 3 = 11';

const skillMap = [
  { name: 'Арифметик', score: 72, color: 'bg-orange-500' },
  { name: 'Алгебр', score: 55, color: 'bg-violet-500' },
  { name: 'Геометр', score: 43, color: 'bg-emerald-500' },
  { name: 'Функц', score: 28, color: 'bg-rose-500' },
];

const recoveryPlan = [
  ['Өнөөдөр', 'Бодлогын өгөгдлийг зөв унших', 'Ангидаа тохирсон жишээ'],
  ['2 дахь өдөр', 'Үндсэн үйлдлийн дараалал', 'Алхам бүрээ тайлбарлах'],
  ['3 дахь өдөр', 'Тэнцэтгэл ба хувиргалт', 'Ижил үйлдлийг хоёр талд хийх'],
  ['4 дахь өдөр', 'Хаалт, зэрэг, язгуур', 'Богино дасгалын багц'],
  ['5 дахь өдөр', 'Геометрийн бодлого', 'Томьёо сонгох'],
  ['6 дахь өдөр', 'Алдаагаа засах', 'Алдааны мөрдөгч'],
  ['7 дахь өдөр', 'Ахицын шалгалт', '10 минутын сорил'],
];

export const IndexPage = () => {
  const [grade, setGrade] = useState('8');
  const [problem, setProblem] = useState(initialProblem);
  const [imageData, setImageData] = useState('');
  const [imageName, setImageName] = useState('');
  const [mode, setMode] = useState<'hint' | 'steps' | 'full'>('hint');
  const [view, setView] = useState<'solve' | 'practice' | 'progress' | 'history'>('solve');
  const [solution, setSolution] = useState<Solution | null>(null);
  const [practiceAnswer, setPracticeAnswer] = useState('');
  const [practiceChecked, setPracticeChecked] = useState(false);
  const [studentWork, setStudentWork] = useState('');
  const [checkResult, setCheckResult] = useState<CheckResult | null>(null);
  const [solvedCount, setSolvedCount] = useState(0);
  const [equationScore, setEquationScore] = useState(55);
  const fileInput = useRef<HTMLInputElement>(null);
  const [solve, { loading }] = useMutation<SolveData, SolveVariables>(SOLVE);
  const [checkSolution, { loading: checking }] = useMutation<CheckData>(CHECK_SOLUTION);
  const { data: attemptsData } = useQuery<AttemptsData>(ATTEMPTS, {
    variables: { grade: Number(grade) },
    fetchPolicy: 'cache-and-network',
  });

  const visibleSteps = useMemo(() => {
    if (!solution) return [];
    return mode === 'hint' ? solution.steps.slice(0, 1) : solution.steps;
  }, [mode, solution]);
  const practiceCorrect = practiceAnswer.trim().replace(',', '.') === '4';

  const handleImage = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Зөвхөн зураг оруулна уу', variant: 'destructive' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImageData(String(reader.result));
      setImageName(file.name);
      toast({ title: 'Зураг бэлэн боллоо', description: 'Одоо “Бодож тайлбарлах” товчийг дарна уу.' });
    };
    reader.onerror = () => toast({ title: 'Зураг уншиж чадсангүй', variant: 'destructive' });
    reader.readAsDataURL(file);
  };

  const handleSolve = async () => {
    if (!problem.trim() && !imageData) {
      toast({ title: 'Бодлого оруулна уу', description: 'Текст бичих эсвэл зураг сонгоно уу.' });
      return;
    }
    try {
      const response = await solve({
        variables: {
          grade: Number(grade),
          problem: problem.trim() || undefined,
          imageData: imageData || undefined,
          imageReference: imageName || undefined,
        },
        update: (cache, { data }) => {
          if (!data) return;
          cache.modify({
            fields: {
              studyAssistantLearningAttempts(existing: Attempt[] = []) {
                return [data.studyAssistantSolve, ...existing];
              },
            },
          });
        },
      });
      setSolution(response.data?.studyAssistantSolve ?? null);
      setCheckResult(null);
      setStudentWork('');
      setMode('hint');
      setView('solve');
      setSolvedCount((count) => count + 1);
      setEquationScore((score) => Math.min(100, score + 4));
    } catch (error) {
      toast({
        title: 'Бодлогыг боловсруулахад алдаа гарлаа',
        description: error instanceof Error ? error.message : 'Дахин оролдоно уу.',
        variant: 'destructive',
      });
    }
  };

  const handleCheckWork = async () => {
    const steps = studentWork
      .split('\n')
      .map((step) => step.trim())
      .filter(Boolean);
    if (!problem.trim() || steps.length === 0) {
      toast({
        title: 'Өөрийн бодолтоо оруулна уу',
        description: 'Алхам бүрийг шинэ мөрөнд бичээд дахин шалгана уу.',
      });
      return;
    }
    try {
      const response = await checkSolution({
        variables: { problem, steps },
      });
      setCheckResult(response.data?.studyAssistantCheckSolution ?? null);
    } catch (error) {
      toast({
        title: 'Алдааг шалгаж чадсангүй',
        description: error instanceof Error ? error.message : 'Дахин оролдоно уу.',
        variant: 'destructive',
      });
    }
  };

  const reset = () => {
    setGrade('8');
    setProblem(initialProblem);
    setImageData('');
    setImageName('');
    setSolution(null);
    setMode('hint');
    setView('solve');
    setPracticeAnswer('');
    setPracticeChecked(false);
    setStudentWork('');
    setCheckResult(null);
    setSolvedCount(0);
    setEquationScore(55);
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-6 overflow-auto p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Badge variant="secondary" className="mb-2 gap-1">
            <IconSparkles size={14} /> MathBridge AI · Хариуг биш, ойлголтыг бүтээе
          </Badge>
          <h1 className="text-2xl font-semibold tracking-tight">Хувийн математикийн багш</h1>
          <p className="mt-1 text-muted-foreground">
            Ангидаа тохируулан зураг эсвэл гараар оруулсан бодлогыг алхам бүрээр ойлгоорой.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={reset}>
          <IconRefresh size={16} /> Дахин эхлүүлэх
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 border-b pb-3">
        {[
          ['solve', 'Бодлого бодох', IconCamera],
          ['practice', 'Дасгал хийх', IconTarget],
          ['progress', 'Math DNA', IconActivity],
          ['history', 'Түүх', IconHistory],
        ].map(([value, label, Icon]) => (
          <Button
            key={value as string}
            variant={view === value ? 'secondary' : 'ghost'}
            onClick={() => setView(value as typeof view)}
          >
            <Icon size={16} /> {label}
          </Button>
        ))}
      </div>

      {view === 'solve' && (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <Card className="p-5">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">Алхам 01</p>
                <h2 className="mt-1 text-lg font-semibold">Ангиа сонгоод бодлого оруулах</h2>
              </div>
              <IconTarget className="text-primary" />
            </div>
            <label className="mb-2 block text-sm font-medium">Суралцагчийн анги</label>
            <Select value={grade} onValueChange={setGrade}>
              <Select.Trigger>
                <Select.Value placeholder="Анги сонгох" />
              </Select.Trigger>
              <Select.Content>
                {grades.map((item) => (
                  <Select.Item key={item} value={String(item)}>{item}-р анги</Select.Item>
                ))}
              </Select.Content>
            </Select>
            <p className="mt-2 text-xs text-muted-foreground">
              Сэдвийг тусад нь сонгох шаардлагагүй. Систем бодлогоос таньж, {grade}-р ангийн түвшинд тайлбарлана.
            </p>
            <label className="mt-5 flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed p-6 text-center hover:bg-muted/40">
              <IconFileUpload size={28} className="text-muted-foreground" />
              <span className="font-medium">{imageName || 'Бодлогын зураг оруулах'}</span>
              <span className="text-xs text-muted-foreground">Photomath шиг зураг сонгоод, таньсан бодлогоо засварлах боломжтой</span>
              <input ref={fileInput} className="hidden" type="file" accept="image/*" onChange={(event) => handleImage(event.target.files?.[0])} />
            </label>
            {imageData && (
              <div className="mt-3 flex items-center gap-3 rounded-lg border p-2">
                <img src={imageData} alt="Оруулсан бодлого" className="size-14 rounded object-cover" />
                <span className="min-w-0 flex-1 truncate text-sm">{imageName}</span>
                <Button size="sm" variant="ghost" onClick={() => { setImageData(''); setImageName(''); }}>Устгах</Button>
              </div>
            )}
            <div className="my-5 text-center text-xs text-muted-foreground">эсвэл гараар бичих</div>
            <Textarea
              value={problem}
              onChange={(event) => setProblem(event.target.value)}
              rows={4}
              placeholder="Жишээ: 2x + 3 = 11"
            />
            <div className="mt-2 flex flex-wrap gap-1">
              {symbols.map((symbol) => (
                <Button
                  key={symbol}
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setProblem((value) => `${value}${symbol}`)}
                >
                  {symbol}
                </Button>
              ))}
            </div>
            <Button className="mt-5 w-full" onClick={handleSolve} disabled={loading}>
              <IconSparkles size={16} /> {loading ? 'Таниж, тайлбарлаж байна...' : 'Бодож тайлбарлах'}
            </Button>
          </Card>

          <Card className="p-5">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">Алхам 02</p>
                <h2 className="mt-1 text-lg font-semibold">AI багшийн тайлбар</h2>
              </div>
              {solution && <Badge variant="outline">{solution.topic}</Badge>}
            </div>
            {!solution ? (
              <div className="flex min-h-72 flex-col items-center justify-center rounded-lg bg-muted/40 p-6 text-center">
                <IconBulb size={32} className="mb-3 text-amber-500" />
                <p className="font-medium">Бодлогоо оруулсны дараа тайлбар энд гарна</p>
                <p className="mt-1 text-sm text-muted-foreground">AI хариуг математик шалгагчтай хамт боловсруулна.</p>
              </div>
            ) : (
              <>
                <div className="rounded-lg bg-primary/5 p-4">
                  <p className="text-xs uppercase text-muted-foreground">Танигдсан бодлого</p>
                  <p className="mt-1 text-xl font-semibold">{solution.recognized}</p>
                  <p className="mt-2 text-sm">{solution.answer}</p>
                  <p className="mt-2 text-xs text-muted-foreground">Итгэлцэл: {Math.round(solution.confidence * 100)}% · {solution.source === 'gemini' ? 'Gemini AI' : 'Demo fallback'}</p>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {(['hint', 'steps', 'full'] as const).map((item) => (
                    <Button key={item} size="sm" variant={mode === item ? 'default' : 'outline'} onClick={() => setMode(item)}>
                      {item === 'hint' ? 'Сэжүүр' : item === 'steps' ? 'Алхамчилсан' : 'Бүтэн тайлбар'}
                    </Button>
                  ))}
                </div>
                <div className="mt-4 space-y-3">
                  {mode === 'hint' ? (
                    <div className="rounded-lg border p-4 text-sm"><IconBulb size={16} className="mb-2 text-amber-500" /><p>{solution.hint}</p></div>
                  ) : visibleSteps.map((step, index) => (
                    <div key={`${step}-${index}`} className="flex gap-3 rounded-lg border p-3 text-sm">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{index + 1}</span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
                {mode === 'hint' && <Button className="mt-4" variant="outline" onClick={() => setMode('steps')}>Дараагийн алхмыг үзэх <IconArrowRight size={16} /></Button>}
                <div className="mt-5 rounded-lg bg-muted/50 p-4 text-sm">
                  <p className="font-medium">Дараагийн дасгал</p>
                  <p className="mt-1">{solution.practice}</p>
                  <Button className="mt-3" size="sm" variant="ghost" onClick={() => setView('practice')}>Дасгал руу очих <IconChevronRight size={16} /></Button>
                </div>
                <div className="mt-5 rounded-lg border-2 border-primary/20 bg-background p-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-primary/10 p-2 text-primary">
                      <IconAlertTriangle size={18} />
                    </div>
                    <div>
                      <p className="font-semibold">Error Detective</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Өөрийн бодолтыг оруул. MathBridge зөвхөн хариуг биш, яг аль алхам дээр яагаад алдсаныг олно.
                      </p>
                    </div>
                  </div>
                  <Textarea
                    className="mt-4"
                    value={studentWork}
                    onChange={(event) => {
                      setStudentWork(event.target.value);
                      setCheckResult(null);
                    }}
                    rows={4}
                    placeholder={'2x + 3 = 11\n2x = 11 + 3\nx = 7'}
                  />
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setStudentWork('2x + 3 = 11\n2x = 11 + 3\nx = 7');
                        setCheckResult(null);
                      }}
                    >
                      Demo алдаа оруулах
                    </Button>
                    <Button size="sm" onClick={handleCheckWork} disabled={checking}>
                      {checking ? 'Мөрдөж байна...' : 'Алдааг мөрдөх'}
                      <IconArrowRight size={15} />
                    </Button>
                  </div>
                  {checkResult && (
                    <div className={`mt-4 rounded-lg p-4 ${checkResult.correct ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                      <div className="flex items-start gap-3">
                        {checkResult.correct ? (
                          <IconCircleCheck className="mt-0.5 text-emerald-600" size={20} />
                        ) : (
                          <IconAlertTriangle className="mt-0.5 text-rose-600" size={20} />
                        )}
                        <div className="min-w-0">
                          <p className={`font-semibold ${checkResult.correct ? 'text-emerald-800' : 'text-rose-800'}`}>
                            {checkResult.correct ? 'Маш сайн! Бодолтын логик зөв байна.' : checkResult.errorTitle}
                          </p>
                          <p className="mt-1 text-sm text-foreground">{checkResult.explanation}</p>
                          {!checkResult.correct && checkResult.firstErrorStep && (
                            <Badge className="mt-2" variant="outline">
                              Алдаатай алхам: {checkResult.firstErrorStep} · {checkResult.errorType}
                            </Badge>
                          )}
                          {checkResult.correction && (
                            <div className="mt-3 rounded-md bg-background p-3 text-sm">
                              <p className="font-medium">Зөв хувиргалт</p>
                              <p className="mt-1">{checkResult.correction}</p>
                            </div>
                          )}
                          {checkResult.nextExercise && (
                            <Button
                              className="mt-3"
                              size="sm"
                              variant="secondary"
                              onClick={() => {
                                setProblem(checkResult.nextExercise || '');
                                setSolution(null);
                                setCheckResult(null);
                                setStudentWork('');
                              }}
                            >
                              Энэ чадварыг дахин дасгалжуулах
                              <IconChevronRight size={15} />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </Card>
        </div>
      )}

      {view === 'practice' && (
        <Card className="max-w-2xl p-6">
          <Badge variant="secondary">Өөрөө бодох</Badge>
          <h2 className="mt-3 text-xl font-semibold">Хариуг шууд харахгүйгээр оролдоорой</h2>
          <p className="mt-2 text-lg">{solution?.practice || '3x + 2 = 14'}</p>
          <div className="mt-6 flex gap-2">
            <Input value={practiceAnswer} onChange={(event) => { setPracticeAnswer(event.target.value); setPracticeChecked(false); }} placeholder="x = ?" onKeyDown={(event) => event.key === 'Enter' && setPracticeChecked(true)} />
            <Button onClick={() => { setPracticeChecked(true); if (practiceCorrect) setSolvedCount((count) => count + 1); }}>Шалгах</Button>
          </div>
          {practiceChecked && <div className={`mt-4 rounded-lg p-4 text-sm ${practiceCorrect ? 'bg-emerald-50 text-emerald-800' : 'bg-destructive/10'}`}>{practiceCorrect ? 'Зөв! Ойлголтоо амжилттай хэрэглэсэн байна.' : 'Одоохондоо буруу байна. Хоёр талаас 2-ыг хасаад, дараа нь 3-т хуваагаарай.'}</div>}
        </Card>
      )}

      {view === 'progress' && (
        <div className="grid gap-6 xl:grid-cols-2">
          <Card className="p-6">
            <div className="mb-5 flex items-center gap-2"><IconActivity className="text-primary" /><div><h2 className="font-semibold">Math DNA</h2><p className="text-sm text-muted-foreground">Таны чадварын зураглал · {solvedCount} бодлого ажилласан</p></div></div>
            <div className="space-y-4">
              {skillMap.map((skill) => {
                const score = skill.name === 'Алгебр' ? equationScore : skill.score;
                return <div key={skill.name}><div className="mb-1 flex justify-between text-sm"><span>{skill.name}</span><span className="text-muted-foreground">{score}%</span></div><div className="h-2 rounded-full bg-muted"><div className={`h-2 rounded-full ${skill.color}`} style={{ width: `${score}%` }} /></div></div>;
              })}
            </div>
            <p className="mt-5 text-sm text-muted-foreground">Зөв бодолт бүр таны чадварын зураглалыг шинэчилнэ.</p>
          </Card>
          <Card className="p-6">
            <div className="mb-5 flex items-center gap-2"><IconCalendar className="text-primary" /><div><h2 className="font-semibold">7 өдрийн нөхөх зам</h2><p className="text-sm text-muted-foreground">Анги {grade}-д тохируулсан богино төлөвлөгөө</p></div></div>
            <div className="space-y-3">{recoveryPlan.map(([day, title, detail], index) => <div key={day} className={`flex items-center gap-3 rounded-lg border p-3 ${index === 0 ? 'border-primary bg-primary/5' : ''}`}><span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">{index + 1}</span><div className="min-w-0 flex-1"><p className="text-xs uppercase text-muted-foreground">{day}</p><p className="text-sm font-medium">{title}</p><p className="text-xs text-muted-foreground">{detail}</p></div><IconChevronRight size={16} className="text-muted-foreground" /></div>)}</div>
          </Card>
        </div>
      )}

      {view === 'history' && (
        <Card className="p-6">
          <div className="mb-5 flex items-center gap-2"><IconHistory className="text-primary" /><div><h2 className="font-semibold">Бодлогын түүх</h2><p className="text-sm text-muted-foreground">Анги {grade}-д хадгалагдсан сүүлийн бодлогууд</p></div></div>
          <div className="space-y-2">{attemptsData?.studyAssistantLearningAttempts.length ? attemptsData.studyAssistantLearningAttempts.map((attempt) => <div key={attempt._id} className="flex items-center gap-3 rounded-lg border p-3"><IconCircleCheck size={18} className="text-emerald-600" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{attempt.problem}</p><p className="text-xs text-muted-foreground">{attempt.topic || 'Сэдэв тодорхойлж байна'} · {attempt.source}</p></div><Badge variant="outline">{attempt.answer || 'Тайлбарласан'}</Badge></div>) : <div className="rounded-lg bg-muted/40 p-8 text-center text-sm text-muted-foreground">Одоогоор хадгалсан бодлого алга.</div>}</div>
        </Card>
      )}
    </div>
  );
};
