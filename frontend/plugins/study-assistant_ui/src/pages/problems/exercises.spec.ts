import {
  LESSONS,
  equivalentFraction,
  equivalentInequality,
  equivalentQuadraticRoots,
  getLessonForGrade,
  submitLessonStage,
} from './exercises';

describe('MathBridge deterministic demo lessons', () => {
  it('accepts and rejects Grade 5 fraction answers', () => {
    expect(equivalentFraction('3/4', '3/4')).toBe(true);
    expect(equivalentFraction('6/8', '3/4')).toBe(true);
    expect(equivalentFraction('2/4', '3/4')).toBe(false);
  });

  it('teaches Grade 8 inequality reversal', () => {
    const lesson = getLessonForGrade(8);
    expect(lesson?.problem).toBe('-2x > 6');
    expect(lesson?.stages[0].kind).toBe('choice');
    expect(lesson?.stages[0].kind === 'choice' && lesson.stages[0].correctChoice).toBe('divide-negative');
    expect(equivalentInequality('x < -3')).toBe(true);
    expect(equivalentInequality('x > -3')).toBe(false);
  });

  it('accepts both Grade 11 quadratic roots', () => {
    expect(equivalentQuadraticRoots('x = 2, x = 3')).toBe(true);
    expect(equivalentQuadraticRoots('3, 2')).toBe(true);
    expect(equivalentQuadraticRoots('x = 2')).toBe(false);
    expect(equivalentQuadraticRoots('x = -2, x = 3')).toBe(false);
  });

  it('keeps every stage and choice attached to one lesson', () => {
    expect(LESSONS).toHaveLength(3);
    for (const lesson of LESSONS) {
      expect(lesson.stages).toHaveLength(3);
      const firstStage = lesson.stages[0];
      expect(firstStage.kind).toBe('choice');
      if (firstStage.kind === 'choice') {
        expect(firstStage.choices.some((choice) => choice.id === firstStage.correctChoice)).toBe(true);
      }
    }
  });

  it('does not advance when a stage validator rejects an answer', () => {
    const lesson = getLessonForGrade(8);
    expect(lesson?.stages[1].kind === 'fill' && lesson.stages[1].validate('3')).toBe(false);
    expect(lesson?.stages[2].kind === 'independent' && lesson.stages[2].validate('x > -3')).toBe(false);
  });

  it('advances exactly one stage and completes only after all stages', () => {
    const lesson = getLessonForGrade(5);
    if (!lesson) throw new Error('Grade 5 lesson is missing');
    const initial = { stage: 0 as const, completed: false };
    const wrong = submitLessonStage(lesson, initial, 'add-denominators');
    expect(wrong.correct).toBe(false);
    expect(wrong.progress).toEqual(initial);
    const first = submitLessonStage(lesson, initial, 'add-numerators');
    expect(first.progress).toEqual({ stage: 1, completed: false });
    const second = submitLessonStage(lesson, first.progress, '3');
    expect(second.progress).toEqual({ stage: 2, completed: false });
    const complete = submitLessonStage(lesson, second.progress, '3/4');
    expect(complete.progress).toEqual({ stage: 2, completed: true });
    expect(submitLessonStage(lesson, initial, 'add-numerators').progress).not.toEqual({ stage: 2, completed: true });
  });
});
