import { useMemo, useRef, useState } from 'react';
import { gql, useMutation, useQuery } from '@apollo/client';
import { Badge, Button, Card, Input, Select, Textarea, toast } from 'erxes-ui';
import {
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
import {
  getLessonForGrade,
  submitLessonStage,
  type LessonDefinition,
  type LessonStage,
} from './exercises';

type Solution = {
  source: string;
  recognized: string;
  topic: string;
  answer: string;
  concept: string;
  hint: string;
  steps: string[];
  practice: string;
  practiceAnswer: string;
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
  correctedStep: string | null;
  nextExercise: string | null;
};

type LearningMode = 'guided' | 'check' | 'explain';
type GuidedStage = 1 | 2 | 3;

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
  mutation StudyAssistantSolve($grade: Int!, $problem: String, $imageData: String, $imageReference: String) {
    studyAssistantSolve(grade: $grade, problem: $problem, imageData: $imageData, imageReference: $imageReference) {
      source recognized topic answer concept hint steps practice practiceAnswer confidence
    }
  }
`;

const ATTEMPTS = gql`
  query StudyAssistantLearningAttempts($grade: Int) {
    studyAssistantLearningAttempts(grade: $grade) {
      _id grade problem topic answer source createdAt
    }
  }
`;

const CHECK_SOLUTION = gql`
  mutation StudyAssistantCheckSolution($problem: String!, $steps: [String!]!) {
    studyAssistantCheckSolution(problem: $problem, steps: $steps) {
      correct firstErrorStep expectedAnswer explanation errorType errorTitle correction correctedStep nextExercise
    }
  }
`;

const grades = Array.from({ length: 12 }, (_, index) => index + 1);
const symbols = ['√', '²', '³', 'π', '÷', '×', '±', '≤', '≥', '≠', '∞', '(', ')'];
const exampleProblem = '2x + 3 = 11';
export const IndexPage = () => {
  const [grade, setGrade] = useState('8');
  const [problem, setProblem] = useState('');
  const [imageData, setImageData] = useState('');
  const [imageName, setImageName] = useState('');
  const [mode, setMode] = useState<'hint' | 'steps' | 'full'>('hint');
  const [view, setView] = useState<'solve' | 'practice' | 'lesson' | 'history'>('solve');
  const [showInput, setShowInput] = useState(false);
  const [learningMode, setLearningMode] = useState<LearningMode | null>(null);
  const [guidedStage, setGuidedStage] = useState<GuidedStage>(1);
  const [guidedChoice, setGuidedChoice] = useState('');
  const [guidedAnswer, setGuidedAnswer] = useState('');
  const [guidedFeedback, setGuidedFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [guidedHintVisible, setGuidedHintVisible] = useState(false);
  const [lesson, setLesson] = useState<LessonDefinition | null>(null);
  const [lessonCompleted, setLessonCompleted] = useState(false);
  const [solution, setSolution] = useState<Solution | null>(null);
  const [practiceAnswer, setPracticeAnswer] = useState('');
  const [practiceChecked, setPracticeChecked] = useState(false);
  const [practiceResult, setPracticeResult] = useState<CheckResult | null>(null);
  const [studentWork, setStudentWork] = useState('');
  const [checkResult, setCheckResult] = useState<CheckResult | null>(null);
  const [showCorrection, setShowCorrection] = useState(false);
  const verifiedKeys = useRef(new Set<string>());
  const fileInput = useRef<HTMLInputElement>(null);
  const problemInput = useRef<HTMLTextAreaElement>(null);
  const detectiveSection = useRef<HTMLDivElement>(null);
  const [solve, { loading }] = useMutation<SolveData, SolveVariables>(SOLVE);
  const [checkSolution, { loading: checking }] = useMutation<CheckData>(CHECK_SOLUTION);
  const { data: attemptsData, loading: attemptsLoading, error: attemptsError } = useQuery<AttemptsData>(ATTEMPTS, {
    variables: { grade: Number(grade) },
    fetchPolicy: 'cache-and-network',
  });

  const visibleSteps = useMemo(() => {
    if (!solution) return [];
    return mode === 'hint' ? solution.steps.slice(0, 1) : solution.steps;
  }, [mode, solution]);
  const studentSteps = useMemo(() => studentWork.split('\n').map((step) => step.trim()), [studentWork]);
  const practiceCorrect = practiceResult?.correct === true;

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
      toast({ title: 'Зураг бэлэн боллоо', description: 'Таньсан бодлогоо шалгаад засварлаж болно.' });
    };
    reader.onerror = () => toast({ title: 'Зураг уншиж чадсангүй', variant: 'destructive' });
    reader.readAsDataURL(file);
  };

  const handleSolve = async (problemOverride?: string) => {
    const requestedProblem = problemOverride ?? problem;
    if (!requestedProblem.trim() && !imageData) {
      toast({ title: 'Бодлого оруулна уу', description: 'Текст бичих эсвэл зураг сонгоно уу.' });
      return;
    }
    try {
      const response = await solve({
        variables: {
          grade: Number(grade),
          problem: requestedProblem.trim() || undefined,
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
      const nextSolution = response.data?.studyAssistantSolve ?? null;
      setSolution(nextSolution);
      if (!requestedProblem.trim() && nextSolution) setProblem(nextSolution.recognized);
      setCheckResult(null);
      setStudentWork('');
      setShowCorrection(false);
      setMode('hint');
      setLearningMode(null);
      setGuidedStage(1);
      setGuidedChoice('');
      setGuidedAnswer('');
      setGuidedFeedback(null);
      setGuidedHintVisible(false);
      setLesson(null);
      setLessonCompleted(false);
      setShowInput(true);
      setView('solve');
    } catch (error) {
      toast({ title: 'Бодлогыг боловсруулахад алдаа гарлаа', description: error instanceof Error ? error.message : 'Дахин оролдоно уу.', variant: 'destructive' });
    }
  };

  const handleCheckWork = async () => {
    const steps = studentWork.split('\n').map((step) => step.trim()).filter(Boolean);
    if (!problem.trim() || steps.length === 0) {
      toast({ title: 'Өөрийн бодолтоо оруулна уу', description: 'Алхам бүрийг шинэ мөрөнд бичээд дахин шалгана уу.' });
      return;
    }
    try {
      const response = await checkSolution({ variables: { problem, steps } });
      const result = response.data?.studyAssistantCheckSolution ?? null;
      setCheckResult(result);
      if (result?.correct) {
        const verificationKey = `${problem}\n${studentWork}`;
        if (!verifiedKeys.current.has(verificationKey)) {
          verifiedKeys.current.add(verificationKey);
          toast({ title: 'Бодолт баталгаажлаа', description: 'Таны бүх алхам математик хувьд зөв байна.' });
        }
      }
      setShowCorrection(false);
    } catch (error) {
      toast({ title: 'Алдааг шалгаж чадсангүй', description: error instanceof Error ? error.message : 'Дахин оролдоно уу.', variant: 'destructive' });
    }
  };

  const updateStudentStep = (index: number, value: string) => {
    const nextSteps = [...studentSteps];
    nextSteps[index] = value;
    setStudentWork(nextSteps.join('\n'));
    setCheckResult(null);
    setShowCorrection(false);
  };

  const addStudentStep = () => {
    setStudentWork((current) => `${current}${current ? '\n' : ''}`);
    setCheckResult(null);
  };

  const removeStudentStep = (index: number) => {
    setStudentWork(studentSteps.filter((_, stepIndex) => stepIndex !== index).join('\n'));
    setCheckResult(null);
    setShowCorrection(false);
  };

  const handlePracticeCheck = async () => {
    if (!solution?.practice || !practiceAnswer.trim()) {
      toast({ title: 'Хариугаа оруулна уу', description: 'Дасгалын хариуг оруулаад дахин шалгана уу.' });
      return;
    }
    try {
      const response = await checkSolution({
        variables: { problem: solution.practice, steps: [solution.practice, practiceAnswer.trim()] },
      });
      const result = response.data?.studyAssistantCheckSolution ?? null;
      setPracticeResult(result);
      setPracticeChecked(true);
      const practiceKey = `${solution.practice}\n${practiceAnswer.trim()}`;
      if (result?.correct && !verifiedKeys.current.has(practiceKey)) {
        verifiedKeys.current.add(practiceKey);
        toast({ title: 'Дасгал баталгаажлаа', description: 'Та энэ чадварыг өөрөө зөв хэрэглэж чадлаа.' });
      }
    } catch (error) {
      toast({ title: 'Дасгалыг шалгаж чадсангүй', description: error instanceof Error ? error.message : 'Дахин оролдоно уу.', variant: 'destructive' });
    }
  };

  const reset = () => {
    setGrade('8');
    setProblem('');
    setShowInput(false);
    setImageData('');
    setImageName('');
    setSolution(null);
    setMode('hint');
    setView('solve');
    setPracticeAnswer('');
    setPracticeChecked(false);
    setPracticeResult(null);
    setStudentWork('');
    setCheckResult(null);
    setShowCorrection(false);
    setLearningMode(null);
    setGuidedStage(1);
    setGuidedChoice('');
    setGuidedAnswer('');
    setGuidedFeedback(null);
    verifiedKeys.current.clear();
  };

  const guidedStageDefinition: LessonStage | null = lesson?.stages[guidedStage - 1] || null;
  const hasWorkspace = showInput || Boolean(problem.trim() || solution || imageData);

  const checkGuidedStage = () => {
    if (!lesson || !guidedStageDefinition) return;
    const answer = guidedStageDefinition.kind === 'choice' ? guidedChoice : guidedAnswer.trim();
    const submission = submitLessonStage(lesson, { stage: (guidedStage - 1) as 0 | 1 | 2, completed: lessonCompleted }, answer);
    const correct = submission.correct;
    setGuidedFeedback(correct ? 'correct' : 'incorrect');
    setGuidedHintVisible(!correct);
    if (!correct) return;
    if (guidedStage === 3) {
      setLessonCompleted(true);
      return;
    }
    setGuidedStage((submission.progress.stage + 1) as GuidedStage);
    setGuidedChoice('');
    setGuidedAnswer('');
    setGuidedFeedback(null);
    setGuidedHintVisible(false);
  };

  const startLesson = (selectedLesson: LessonDefinition | undefined) => {
    if (!selectedLesson) return;
    setLesson(selectedLesson);
    setSolution(null);
    setStudentWork('');
    setCheckResult(null);
    setShowCorrection(false);
    setPracticeAnswer('');
    setPracticeChecked(false);
    setPracticeResult(null);
    setLessonCompleted(false);
    setGuidedStage(1);
    setGuidedChoice('');
    setGuidedAnswer('');
    setGuidedFeedback(null);
    setGuidedHintVisible(false);
    setLearningMode('guided');
    setProblem(selectedLesson.problem);
    setShowInput(true);
    setView('solve');
  };

  const restartLesson = () => {
    if (lesson) startLesson(lesson);
  };

  const renderDetective = () => {
    const unsupported = Boolean(checkResult) && !checkResult?.correct && checkResult?.firstErrorStep === null;
    return (
      <Card ref={detectiveSection} className="border-0 bg-[#17134B] p-5 text-white shadow-[0_12px_30px_rgba(23,19,75,0.18)]">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-[#B8F23D] p-2.5 text-[#17134B]"><IconAlertTriangle size={19} /></div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#B8F23D]">AI TUTOR</p>
              <h2 className="mt-1 text-lg font-semibold text-white">Error Detective</h2>
              <p className="mt-1 text-xs leading-5 text-indigo-100">Алдааг хамтдаа олъё. Яагаад гэдгийг нь ойлгоно.</p>
            </div>
          </div>
          {checking ? <Badge variant="secondary">Шалгаж байна</Badge> : checkResult ? <Badge variant={checkResult.correct ? 'default' : 'outline'}>{checkResult.correct ? 'Зөв' : unsupported ? 'Баталгаагүй' : 'Засах'}</Badge> : null}
        </div>

        <div className="mt-5 rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-200">Шалгах бодлого</p>
          <p className="mt-1 break-words font-mono text-xl font-semibold text-white">{problem || 'Бодлого оруулсны дараа энд харагдана'}</p>
        </div>

        <div className="mt-5 space-y-2">
          {studentSteps.map((step, index) => {
            const isWrong = checkResult?.firstErrorStep === index + 1;
            const isVerified = Boolean(checkResult) && (checkResult.correct || (checkResult.firstErrorStep !== null && index + 1 < (checkResult.firstErrorStep || Infinity)));
            const statusClass = isWrong ? 'border-rose-300 bg-rose-50' : isVerified ? 'border-emerald-200 bg-emerald-50' : unsupported ? 'border-amber-200 bg-amber-50/50' : 'border-slate-200 bg-white';
            const numberClass = isWrong ? 'bg-rose-100 text-rose-700' : isVerified ? 'bg-emerald-100 text-emerald-700' : unsupported ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500';
            return (
              <div key={`detective-step-${index}`} className={`flex items-center gap-2 rounded-2xl border p-2 ${statusClass} ${checkResult ? '' : 'border-white/10 bg-white/5'}`}>
                <span className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${numberClass}`}>{index + 1}</span>
                <span className={`min-w-0 flex-1 truncate font-mono text-sm ${checkResult ? 'text-slate-700' : 'text-indigo-50'}`}>{step || 'Хоосон алхам'}</span>
                {isWrong && <IconAlertTriangle size={16} className="shrink-0 text-rose-600" />}
                {isVerified && <IconCircleCheck size={16} className="shrink-0 text-emerald-600" />}
              </div>
            );
          })}
          {!studentSteps.length && <div className="rounded-2xl border border-dashed border-white/20 px-4 py-6 text-center text-sm text-indigo-100">Өөрийн бодолтын алхмууд энд харагдана.</div>}
        </div>

        {checking && <div className="mt-4 rounded-2xl bg-[#3C86FF] px-4 py-3 text-sm text-white">Алхам бүрийг математикаар шалгаж байна...</div>}
        {checkResult && !checking && (
          <div className={`mt-4 rounded-xl border p-4 ${checkResult.correct ? 'border-emerald-200 bg-emerald-50' : unsupported ? 'border-amber-200 bg-amber-50' : 'border-rose-200 bg-rose-50'}`}>
            <div className="flex items-start gap-3">
              {checkResult.correct ? <IconCircleCheck className="mt-0.5 shrink-0 text-emerald-600" size={20} /> : <IconAlertTriangle className={`mt-0.5 shrink-0 ${unsupported ? 'text-amber-600' : 'text-rose-600'}`} size={20} />}
              <div className="min-w-0">
                <p className="font-semibold text-slate-900">{checkResult.correct ? 'Маш сайн! Бүх алхам зөв байна.' : checkResult.errorTitle || 'Бодолтыг баталгаажуулж чадсангүй.'}</p>
                <p className="mt-1 text-sm leading-6 text-slate-700">{checkResult.explanation}</p>
                {!checkResult.correct && checkResult.firstErrorStep && <Badge className="mt-3" variant="outline">Эхний алдаа: {checkResult.firstErrorStep}-р алхам · {checkResult.errorType}</Badge>}
                {unsupported && <p className="mt-3 text-sm leading-6 text-amber-800">Энэ бодолтыг аюулгүйгээр шалгаж чадсангүй. Дэмжигдсэн нэг хувьсагчтай шугаман тэгшитгэл ашиглана уу.</p>}
                {!checkResult.correct && checkResult.correctedStep && (
                  <div className="mt-4 rounded-2xl border border-white/80 bg-white/90 p-3">
                    <p className="text-sm font-medium text-slate-800">Зөв дараагийн алхам</p>
                    {showCorrection ? <p className="mt-2 font-mono text-base font-semibold text-indigo-700">{checkResult.correctedStep}</p> : <Button className="mt-2" size="sm" variant="outline" onClick={() => setShowCorrection(true)}>Зөв алхмыг харах</Button>}
                  </div>
                )}
                {checkResult.nextExercise && <Button className="mt-4" size="sm" variant="secondary" onClick={() => { setProblem(checkResult.nextExercise || ''); setSolution(null); setCheckResult(null); setShowCorrection(false); setStudentWork(''); setPracticeResult(null); setPracticeChecked(false); setView('solve'); }}>Энэ чадварыг дахин дасгалжуулах <IconChevronRight size={15} /></Button>}
              </div>
            </div>
          </div>
        )}

        {solution?.practice && checkResult && (
          <div className="mt-4 border-t border-slate-200 pt-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#B8F23D]">NEXT LEVEL</p>
            <p className="mt-2 text-sm text-indigo-100">Чи чадна. Ижил чадварыг шинэ бодлогод хэрэглээрэй.</p>
            <p className="mt-3 rounded-2xl bg-white/10 px-3 py-2 font-mono text-base font-semibold text-white">{solution.practice}</p>
            <div className="mt-3 flex gap-2">
              <Input value={practiceAnswer} onChange={(event) => { setPracticeAnswer(event.target.value); setPracticeChecked(false); setPracticeResult(null); }} onKeyDown={(event) => event.key === 'Enter' && void handlePracticeCheck()} placeholder="x = ?" />
              <Button onClick={() => void handlePracticeCheck()} disabled={checking}>Шалгах</Button>
            </div>
            {practiceChecked && practiceResult && <div className={`mt-3 rounded-lg px-3 py-2 text-sm ${practiceCorrect ? 'bg-emerald-50 text-emerald-800' : practiceResult.firstErrorStep === null ? 'bg-amber-50 text-amber-800' : 'bg-rose-50 text-rose-800'}`}>{practiceCorrect ? 'Зөв! Та энэ чадварыг шинэ бодлогод хэрэглэж чадлаа.' : practiceResult.firstErrorStep === null ? 'Энэ дасгалыг баталгаажуулж чадсангүй.' : 'Одоохондоо буруу байна. Дахин оролдоорой.'}</div>}
          </div>
        )}
      </Card>
    );
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-auto bg-background px-4 py-4 text-foreground sm:px-6">
      <header className="mx-auto flex w-full max-w-[1440px] items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-3">
          <div className="relative flex size-10 items-center justify-center rounded-2xl bg-[#3C86FF] text-white shadow-[0_5px_0_#17134B]">
            <span className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-[#B8F23D]" />
            <span className="flex gap-1"><span className="size-1.5 rounded-full bg-white" /><span className="size-1.5 rounded-full bg-white" /></span>
          </div>
          <div><p className="text-sm font-extrabold tracking-tight">MathBridge Studio</p><p className="text-xs text-muted-foreground">Математик хамтдаа амархан!</p></div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={grade} onValueChange={setGrade}>
            <Select.Trigger className="h-9 w-[112px] rounded-xl border-border bg-background text-sm"><Select.Value placeholder="Анги" /></Select.Trigger>
            <Select.Content>{grades.map((item) => <Select.Item key={item} value={String(item)}>{item}-р анги</Select.Item>)}</Select.Content>
          </Select>
          <Button variant="ghost" size="sm" onClick={reset} aria-label="Дахин эхлүүлэх"><IconRefresh size={16} /><span className="hidden sm:inline">Дахин эхлүүлэх</span></Button>
        </div>
      </header>

      <div className="mx-auto mt-3 flex w-full max-w-[1440px] flex-wrap items-center gap-1 border-b border-border pb-2">
        {[
          ['solve', 'Бодлого шалгах', IconCamera],
          ['lesson', 'Өнөөдрийн хичээл', IconCalendar],
          ['practice', 'Дасгал хийх', IconTarget],
          ['history', 'Түүх', IconHistory],
        ].map(([value, label, Icon]) => <Button key={value as string} size="sm" variant={view === value ? 'secondary' : 'ghost'} onClick={() => setView(value as typeof view)}><Icon size={16} /> {label}</Button>)}
      </div>

      <main className="mx-auto w-full max-w-[1440px] py-4">
        {view === 'solve' && (!hasWorkspace ? (
            <div className="mx-auto max-w-5xl space-y-6">
              <section className="rounded-3xl border border-border bg-card px-6 py-8 shadow-sm sm:px-10">
                <div className="max-w-2xl">
                  <Badge variant="secondary">MathBridge · {grade}-р анги</Badge>
                  <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Өнөөдөр математикаа нэг алхмаар ахиулъя.</h1>
                  <p className="mt-3 max-w-xl text-base leading-7 text-muted-foreground">Бодлогоо сонгоод, зөв үйлдлийг өөрөө олж, дараа нь бодолтоо итгэлтэй шалгаарай.</p>
                </div>
                <div className="mt-7 grid gap-3 sm:grid-cols-2">
                  <Button className="h-auto justify-between rounded-2xl px-5 py-4 text-left" onClick={() => setView('lesson')}>
                    <span><span className="block text-base font-semibold">Өнөөдрийн хичээл</span><span className="mt-1 block text-sm font-normal opacity-75">Богино дасгалаар эхлэх</span></span>
                    <IconArrowRight size={18} />
                  </Button>
                  <Button variant="outline" className="h-auto justify-between rounded-2xl px-5 py-4 text-left" onClick={() => setShowInput(true)}>
                    <span><span className="block text-base font-semibold">Өөрийн бодлогоо бодох</span><span className="mt-1 block text-sm font-normal text-muted-foreground">Өөрийн жишээг оруулах</span></span>
                    <IconArrowRight size={18} />
                  </Button>
                </div>
              </section>
              <section className="rounded-3xl border border-border bg-background p-5 sm:p-7">
                <div className="flex items-center justify-between gap-3">
                  <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">СУРАЛЦАХ ЗАМ</p><h2 className="mt-1 text-xl font-semibold text-foreground">Дэмжигдсэн сэдвүүд</h2></div>
                  <span className="text-sm text-muted-foreground">Ахиц хадгалагдсан гэж тооцохгүй</span>
                </div>
                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  {[
                    ['5-р анги', 'Бутархай', '1/2 + 1/4'],
                    ['8-р анги', 'Тэнцэтгэл биш', '-2x > 6'],
                    ['11-р анги', 'Квадрат тэгшитгэл', 'x² - 5x + 6 = 0'],
                  ].map(([label, title, example], index) => (
                    <button key={label} type="button" className="group relative rounded-2xl border border-border bg-card p-4 text-left transition hover:border-primary hover:shadow-sm" onClick={() => { setGrade(String(index === 0 ? 5 : index === 1 ? 8 : 11)); setView('lesson'); }}>
                      <span className={`mb-4 flex size-9 items-center justify-center rounded-full text-sm font-semibold ${index === 0 ? 'bg-muted text-muted-foreground' : index === 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>{index + 1}</span>
                      <p className="text-sm font-semibold text-foreground">{label}</p><p className="mt-1 text-sm text-muted-foreground">{title}</p><p className="mt-4 font-mono text-sm text-foreground">{example}</p>
                      {index < 2 && <span className="absolute -right-3 top-8 hidden h-px w-6 bg-border md:block" />}
                    </button>
                  ))}
                </div>
              </section>
            </div>
          ) : (
          <>
          <section className="mb-4 flex items-center justify-between overflow-hidden rounded-[28px] bg-[#3C86FF] px-5 py-4 text-white shadow-[0_7px_0_#17134B] sm:px-7">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#B8F23D]">Өнөөдрийн математикийн аялал</p>
              <h1 className="mt-1 text-xl font-extrabold tracking-tight sm:text-2xl">Сайн уу, бяцхан математикч!</h1>
              <p className="mt-1 text-sm text-blue-100">Бодлогоо сонгоод, алдаагаа хамтдаа ойлгоё.</p>
            </div>
            <div className="relative mr-2 hidden h-16 w-20 shrink-0 rounded-[22px] border-4 border-[#17134B] bg-white sm:block">
              <span className="absolute -top-5 left-1/2 h-5 w-1 -translate-x-1/2 bg-[#17134B]" />
              <span className="absolute -top-7 left-1/2 size-3 -translate-x-1/2 rounded-full bg-[#B8F23D] ring-2 ring-[#17134B]" />
              <span className="absolute left-4 top-6 size-2.5 rounded-full bg-[#17134B]" />
              <span className="absolute right-4 top-6 size-2.5 rounded-full bg-[#17134B]" />
              <span className="absolute bottom-2 left-1/2 h-1.5 w-7 -translate-x-1/2 rounded-full bg-[#B8F23D]" />
            </div>
          </section>
          <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)]">
            <div className="space-y-4">
              <Card className="border-0 bg-white p-5 shadow-[0_5px_0_#DCD6FF]">
                <div className="flex items-start justify-between gap-3"><div><p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#3C86FF]">МАТЕМАТИКИЙН ДЭВТЭР</p><h2 className="mt-1 text-xl font-extrabold tracking-tight">Бодлогоо сонгоё</h2></div><Badge className="rounded-full bg-[#B8F23D] text-[#17134B] hover:bg-[#B8F23D]">Алхам 1</Badge></div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button size="sm" className="rounded-xl bg-[#B8F23D] font-bold text-[#17134B] hover:bg-[#C9F76B]" onClick={() => fileInput.current?.click()}><IconFileUpload size={15} /> Зураг оруулах</Button>
                  <Button size="sm" variant="outline" className="rounded-xl border-[#3C86FF] text-[#245BC2] hover:bg-[#EEF3FF]" onClick={() => problemInput.current?.focus()}><IconCamera size={15} /> Бодлого бичих</Button>
                  <Button size="sm" variant="ghost" className="rounded-xl text-[#6F68A5] hover:bg-[#F1EEFF]" onClick={() => { setProblem(exampleProblem); setStudentWork(`${exampleProblem}\n2x = 11 + 3\nx = 7`); setCheckResult(null); detectiveSection.current?.scrollIntoView({ behavior: 'smooth' }); }}><IconSparkles size={15} /> Жишээгээр эхлэх</Button>
                </div>
                <input ref={fileInput} className="hidden" type="file" accept="image/*" onChange={(event) => handleImage(event.target.files?.[0])} />
                {imageData && <div className="mt-4 flex items-center gap-3 rounded-xl border border-indigo-100 bg-indigo-50/50 p-2"><img src={imageData} alt="Оруулсан бодлого" className="size-14 rounded-lg object-cover" /><span className="min-w-0 flex-1 truncate text-sm">{imageName}</span><Button size="sm" variant="ghost" onClick={() => { setImageData(''); setImageName(''); }}>Устгах</Button></div>}
                <Textarea ref={problemInput} value={problem} onChange={(event) => setProblem(event.target.value)} rows={2} className="mt-4 min-h-20 resize-none rounded-2xl border-2 border-[#DCD6FF] bg-[#FBFAFF] font-mono text-xl font-semibold shadow-inner focus-visible:border-[#3C86FF]" placeholder="Жишээ: 2x + 3 = 11" />
                <div className="mt-2 flex flex-wrap gap-1">{symbols.map((symbol) => <Button key={symbol} type="button" size="sm" variant="ghost" className="h-7 min-w-7 px-2 text-xs" onClick={() => setProblem((value) => `${value}${symbol}`)}>{symbol}</Button>)}</div>
                <Button className="mt-3 rounded-xl font-bold" onClick={() => void handleSolve()} disabled={loading}><IconSparkles size={16} /> {loading ? 'Боловсруулж байна...' : 'Бодлогыг эхлүүлэх'}</Button>
              </Card>

              <Card className="border-0 bg-[#FFFDF7] p-5 shadow-[0_5px_0_#DCD6FF]">
                <div className="flex items-start justify-between"><div><p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#3C86FF]">МИНИЙ БОДОЛТ</p><h2 className="mt-1 text-lg font-extrabold">Алхмуудаа нэг нэгээр нь бич</h2></div><Badge className="rounded-full bg-[#E8E3FF] text-[#5146E5] hover:bg-[#E8E3FF]">Алхам 2</Badge></div>
                {(solution || lesson) && (
                  <div className="mt-4 rounded-2xl border border-indigo-100 bg-[#F5F4FF] p-4">
                    <p className="text-sm font-bold text-[#17134B]">Энэ бодлогыг яаж сурах вэ?</p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-3">
                      {([
                        ['guided', 'Хамт бодъё', 'Сонголт → нөхөх → өөрөө бодох'],
                        ['check', 'Бодолтоо шалгая', 'Өөрийн алхмуудаа шалгуулах'],
                        ['explain', 'Шийдлийг ойлгоё', 'Тайлбарыг алхмаар харах'],
                      ] as const).map(([value, label, description]) => (
                        <Button
                          key={value}
                          type="button"
                          variant={learningMode === value ? 'default' : 'outline'}
                          className="h-auto justify-start whitespace-normal p-3 text-left"
                          onClick={() => {
                            setLearningMode(value);
                            if (value === 'guided') {
                              const matchingLesson = getLessonForGrade(Number(grade));
                              if (!matchingLesson || matchingLesson.problem !== problem.trim()) {
                                setLesson(null);
                                setGuidedFeedback(null);
                                return;
                              }
                              setLesson(matchingLesson);
                              setGuidedStage(1);
                              setGuidedChoice('');
                              setGuidedAnswer('');
                              setGuidedFeedback(null);
                              setGuidedHintVisible(false);
                            }
                          }}
                        >
                          <span><span className="block font-bold">{label}</span><span className="mt-1 block text-xs font-normal opacity-75">{description}</span></span>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
                {learningMode === 'guided' && (
                  <div className="mt-4 rounded-2xl border-2 border-[#B8F23D] bg-white p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div><p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#3C86FF]">ХАМТ БОДЪЁ</p><h3 className="mt-1 font-bold text-[#17134B]">Алхам {guidedStage} / 3</h3></div>
                      <Badge variant="secondary">Алхам бүрээр</Badge>
                    </div>
                    {!lesson && <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">Энэ бодлогод бэлэн guided дасгал байхгүй байна. `Бодолтоо шалгая` эсвэл `Шийдлийг ойлгоё` горимыг ашиглана уу.</div>}
                    {lesson && lessonCompleted && <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"><p className="font-semibold">Хичээл амжилттай дууслаа!</p><p className="mt-1">Гурван алхмыг бүгдийг нь зөв баталгаажууллаа.</p><div className="mt-3 flex flex-wrap gap-2"><Button size="sm" onClick={restartLesson}>Дахин эхлүүлэх</Button><Button size="sm" variant="outline" onClick={() => { setView('lesson'); setLearningMode(null); }}>Хичээл сонгох</Button></div></div>}
                    {lesson && !lessonCompleted && guidedStageDefinition?.kind === 'choice' && <div className="mt-3"><p className="text-sm text-slate-700">{guidedStageDefinition.prompt}</p><div className="mt-3 grid gap-2 sm:grid-cols-3">{guidedStageDefinition.choices.map((choice) => <Button key={choice.id} type="button" variant={guidedChoice === choice.id ? 'default' : 'outline'} className="h-auto whitespace-normal p-3 text-left" onClick={() => { setGuidedChoice(choice.id); setGuidedFeedback(null); }}>{choice.label}</Button>)}</div></div>}
                    {lesson && !lessonCompleted && guidedStageDefinition && guidedStageDefinition.kind !== 'choice' && <div className="mt-3"><p className="text-sm text-slate-700">{guidedStageDefinition.prompt}</p><Input className="mt-3 font-mono" value={guidedAnswer} onChange={(event) => { setGuidedAnswer(event.target.value); setGuidedFeedback(null); }} placeholder={guidedStageDefinition.placeholder} onKeyDown={(event) => event.key === 'Enter' && checkGuidedStage()} /></div>}
                    {guidedFeedback === 'incorrect' && guidedStageDefinition && <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"><p>Одоохондоо зөв биш байна. Дахин бодоод үзье.</p>{guidedHintVisible && <p className="mt-1 font-medium">{guidedStageDefinition.hint}</p>}</div>}
                    {lesson && !lessonCompleted && guidedStageDefinition && <Button className="mt-3" type="button" onClick={checkGuidedStage} disabled={(guidedStageDefinition.kind === 'choice' && !guidedChoice) || (guidedStageDefinition.kind !== 'choice' && !guidedAnswer.trim())}>Үргэлжлүүлэх <IconArrowRight size={15} /></Button>}
                  </div>
                )}
                {learningMode === 'check' && <div className="mt-4 space-y-2">
                  {studentSteps.map((step, index) => <div key={`student-step-${index}`} className="flex items-center gap-2"><span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500">{index + 1}</span><Input value={step} onChange={(event) => updateStudentStep(index, event.target.value)} placeholder="Жишээ: 2x + 3 = 11" aria-label={`${index + 1}-р алхам`} className="h-10 font-mono" /><Button size="icon" variant="ghost" onClick={() => removeStudentStep(index)} aria-label={`${index + 1}-р алхмыг устгах`}>×</Button></div>)}
                  {!studentSteps.length && <p className="rounded-xl border border-dashed border-slate-300 px-4 py-5 text-center text-sm text-slate-500">Эхний алхмаа дээрх бодлогын доор бичээрэй.</p>}
                <div className="mt-4 flex flex-wrap items-center gap-2"><Button size="sm" variant="outline" onClick={addStudentStep}>+ Алхам нэмэх</Button><Button size="sm" onClick={handleCheckWork} disabled={checking || !problem.trim()}>{checking ? 'Шалгаж байна...' : 'Алхам шалгах'} <IconArrowRight size={15} /></Button><span className="text-xs text-slate-500">Олон мөрийг paste хийж болно.</span></div>
                </div>}
              </Card>

              {solution && (learningMode === 'explain' || learningMode === null) && <Card className="border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)]"><details open={learningMode === 'explain'}><summary className="cursor-pointer list-none text-sm font-semibold text-slate-800">AI багшийн тайлбар <span className="ml-2 text-xs font-normal text-slate-500">{solution.topic}</span></summary><div className="mt-3 border-t border-slate-100 pt-3"><div className="flex flex-wrap gap-2">{(['hint', 'steps', 'full'] as const).map((item) => <Button key={item} size="sm" variant={mode === item ? 'default' : 'outline'} onClick={() => setMode(item)}>{item === 'hint' ? 'Сэжүүр' : item === 'steps' ? 'Алхамчилсан тайлбар' : 'Бүтэн тайлбар'}</Button>)}</div><div className="mt-3 rounded-xl bg-indigo-50/70 p-4 text-sm leading-6">{mode === 'hint' ? <><IconBulb size={16} className="mb-2 text-amber-500" /><p>{solution.hint}</p></> : visibleSteps.map((step, index) => <p key={`${step}-${index}`} className="mb-2 font-mono last:mb-0">{index + 1}. {step}</p>)}</div></div></details></Card>}
            </div>
            <div className="xl:sticky xl:top-4">{renderDetective()}</div>
          </div>
          </>
          ))}

        {view === 'lesson' && <Card className="mx-auto max-w-3xl border-border bg-card p-6"><Badge variant="secondary">Өнөөдрийн хичээл</Badge><h2 className="mt-3 text-xl font-semibold text-foreground">Ангиа сонгоод бодож эхэлье</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Эдгээр гурван хичээл нь сонголт, нөхөх, өөрөө бодох гэсэн дараалалтай. Зөвхөн бүх алхмыг баталгаажуулсны дараа дууссан гэж тооцно.</p><div className="mt-5 grid gap-3 md:grid-cols-3">{[5, 8, 11].map((lessonGrade) => { const selectedLesson = getLessonForGrade(lessonGrade); if (!selectedLesson) return null; return <div key={selectedLesson.id} className={`rounded-2xl border p-4 ${Number(grade) === lessonGrade ? 'border-primary bg-accent' : 'border-border bg-background'}`}><p className="text-sm font-semibold text-foreground">{lessonGrade}-р анги</p><p className="mt-1 text-sm text-muted-foreground">{selectedLesson.topic}</p><p className="mt-4 font-mono text-base font-semibold text-foreground">{selectedLesson.problem}</p><Button className="mt-4 w-full" size="sm" onClick={() => { setGrade(String(lessonGrade)); startLesson(selectedLesson); }}>Эхлүүлэх <IconArrowRight size={15} /></Button></div>; })}</div></Card>}

        {view === 'practice' && <Card className="mx-auto max-w-2xl border-slate-200 bg-white p-6"><Badge variant="secondary">Өөрөө бодох</Badge><h2 className="mt-3 text-xl font-semibold">Хариуг шууд харалгүй оролдоорой</h2>{!solution?.practice ? <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm">Эхлээд бодлогоо оруулж, өөрийн бодолтыг шалгуулсны дараа танд тохирсон дасгал энд гарна.<Button className="mt-3" size="sm" onClick={() => setView('solve')}>Бодлого руу буцах</Button></div> : <><p className="mt-3 font-mono text-lg">{solution.practice}</p><div className="mt-5 flex gap-2"><Input value={practiceAnswer} onChange={(event) => { setPracticeAnswer(event.target.value); setPracticeChecked(false); setPracticeResult(null); }} placeholder="x = ?" onKeyDown={(event) => event.key === 'Enter' && void handlePracticeCheck()} /><Button onClick={() => void handlePracticeCheck()} disabled={checking}>Шалгах</Button></div>{practiceChecked && practiceResult && <div className={`mt-4 rounded-xl p-4 text-sm ${practiceCorrect ? 'bg-emerald-50 text-emerald-800' : practiceResult.firstErrorStep === null ? 'bg-amber-50 text-amber-800' : 'bg-rose-50 text-rose-800'}`}>{practiceCorrect ? 'Зөв! Ойлголтоо амжилттай хэрэглэсэн байна.' : 'Одоохондоо буруу байна. Дахин оролдоорой.'}</div>}</>}</Card>}

        {view === 'history' && <Card className="border-slate-200 bg-white p-6"><div className="mb-4 flex items-center gap-2"><IconHistory className="text-indigo-600" /><div><h2 className="font-semibold">Бодлогын түүх</h2><p className="text-sm text-slate-500">Анги {grade}-д хадгалагдсан сүүлийн бодлогууд</p></div></div>{attemptsLoading ? <div className="rounded-xl bg-slate-50 p-8 text-center text-sm text-slate-500">Түүхийг ачаалж байна...</div> : attemptsError ? <div className="rounded-xl bg-rose-50 p-8 text-center text-sm text-rose-700">Түүхийг ачаалж чадсангүй. Дахин оролдоно уу.</div> : attemptsData?.studyAssistantLearningAttempts.length ? <div className="space-y-2">{attemptsData.studyAssistantLearningAttempts.map((attempt) => <div key={attempt._id} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3"><IconCircleCheck size={18} className="text-emerald-600" /><div className="min-w-0 flex-1"><p className="truncate font-mono text-sm font-medium">{attempt.problem}</p><p className="text-xs text-slate-500">{attempt.topic || 'Сэдэв тодорхойлж байна'} · {attempt.source}</p></div><Badge variant="outline">{attempt.answer || 'Тайлбарласан'}</Badge></div>)}</div> : <div className="rounded-xl bg-slate-50 p-8 text-center text-sm text-slate-500">Одоогоор хадгалсан бодлого алга.</div>}</Card>}
      </main>
    </div>
  );
};
