
import { useState } from 'react';
import { gql, useMutation } from '@apollo/client';

type CheckResult = {
  correct: boolean;
  firstErrorStep: number | null;
  expectedAnswer: number | null;
  explanation: string;
};

type CheckSolutionData = {
  studyAssistantCheckSolution: CheckResult;
};

type CheckSolutionVariables = {
  problem: string;
  steps: string[];
};

const CHECK_SOLUTION = gql`
  mutation StudyAssistantCheckSolution(
    $problem: String!
    $steps: [String!]!
  ) {
    studyAssistantCheckSolution(
      problem: $problem
      steps: $steps
    ) {
      correct
      firstErrorStep
      expectedAnswer
      explanation
    }
  }
`;

export const IndexPage = () => {
  const [problem, setProblem] = useState('2x + 5 = 15');

  const [solution, setSolution] = useState(
    '2x = 15 + 5\n2x = 20\nx = 10'
  );

  const [result, setResult] = useState<CheckResult | null>(null);

  const [check, { loading, error }] = useMutation<
    CheckSolutionData,
    CheckSolutionVariables
  >(CHECK_SOLUTION);

  const handleCheck = async () => {
    setResult(null);

    const steps = solution
      .split('\n')
      .map((step) => step.trim())
      .filter(Boolean);

    if (!problem.trim() || steps.length === 0) {
      return;
    }

    try {
      const response = await check({
        variables: {
          problem,
          steps,
        },
      });

      setResult(
        response.data?.studyAssistantCheckSolution ?? null
      );
    } catch (err) {
      console.error('Study Assistant API error:', err);
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 850 }}>
      <h1 style={{ fontSize: 26, fontWeight: 700 }}>
        AI Study Assistant
      </h1>

      <p style={{ marginTop: 8, marginBottom: 24 }}>
        Математикийн бодолтоо алхам алхмаар шалгуулаарай.
      </p>

      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', marginBottom: 8 }}>
          Математикийн бодлого
        </label>

        <input
          value={problem}
          onChange={(e) => {
            setProblem(e.target.value);
            setResult(null);
          }}
          style={{
            width: '100%',
            padding: 12,
            border: '1px solid #ccc',
            borderRadius: 8,
          }}
        />
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', marginBottom: 8 }}>
          Сурагчийн бодолт (алхам бүрийг шинэ мөрөнд)
        </label>

        <textarea
          value={solution}
          onChange={(e) => {
            setSolution(e.target.value);
            setResult(null);
          }}
          rows={7}
          style={{
            width: '100%',
            padding: 12,
            border: '1px solid #ccc',
            borderRadius: 8,
          }}
        />
      </div>

      <button
        onClick={handleCheck}
        disabled={loading || !problem.trim() || !solution.trim()}
        style={{
          padding: '12px 24px',
          backgroundColor: '#2563eb',
          color: '#fff',
          borderRadius: 8,
          cursor: loading ? 'wait' : 'pointer',
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? 'Шалгаж байна...' : 'Бодолт шалгах'}
      </button>

      {error && (
        <p style={{ color: '#dc2626', marginTop: 16 }}>
          API алдаа: {error.message}
        </p>
      )}

      {result && (
        <div
          style={{
            marginTop: 24,
            padding: 20,
            borderRadius: 8,
            border: `1px solid ${
              result.correct ? '#16a34a' : '#dc2626'
            }`,
          }}
        >
          <h3 style={{ fontWeight: 700, marginBottom: 8 }}>
            {result.correct
              ? 'Алхмуудын шийд тохирч байна'
              : result.firstErrorStep
                ? `Алхам ${result.firstErrorStep} дээр асуудал байна`
                : 'Бодолтыг шалгах боломжгүй'}
          </h3>

          <p>{result.explanation}</p>
        </div>
      )}
    </div>
  );
};
