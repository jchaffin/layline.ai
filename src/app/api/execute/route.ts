import { NextRequest, NextResponse } from "next/server";

const JUDGE0_URL =
  process.env.JUDGE0_URL || "https://judge0-ce.p.rapidapi.com";
const JUDGE0_API_KEY = process.env.JUDGE0_API_KEY || "";

const LANGUAGE_IDS: Record<string, number> = {
  python: 71,
  javascript: 63,
  typescript: 74,
  java: 62,
  cpp: 54,
  c: 50,
  go: 60,
  rust: 73,
};

interface TestCase {
  input: string;
  expected: string;
}

interface TestResult {
  input: string;
  expected: string;
  actual: string;
  passed: boolean;
  error?: string;
  runtime_ms?: number;
  memory_kb?: number;
}

async function submitToJudge0(
  code: string,
  languageId: number,
  stdin: string,
): Promise<{ stdout: string | null; stderr: string | null; status: { id: number; description: string }; time: string | null; memory: number | null }> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const isRapidApi = JUDGE0_URL.includes("rapidapi.com");
  if (isRapidApi && JUDGE0_API_KEY) {
    headers["X-RapidAPI-Key"] = JUDGE0_API_KEY;
    headers["X-RapidAPI-Host"] = "judge0-ce.p.rapidapi.com";
  }

  const submitRes = await fetch(
    `${JUDGE0_URL}/submissions?base64_encoded=true&wait=true&fields=stdout,stderr,status,time,memory`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        source_code: Buffer.from(code).toString("base64"),
        language_id: languageId,
        stdin: Buffer.from(stdin).toString("base64"),
      }),
    },
  );

  if (!submitRes.ok) {
    const errText = await submitRes.text();
    throw new Error(`Judge0 error (${submitRes.status}): ${errText}`);
  }

  const result = await submitRes.json();

  return {
    stdout: result.stdout ? Buffer.from(result.stdout, "base64").toString() : null,
    stderr: result.stderr ? Buffer.from(result.stderr, "base64").toString() : null,
    status: result.status,
    time: result.time,
    memory: result.memory,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      code?: string;
      files?: Record<string, string>;
      entryFile?: string;
      language: string;
      testCases: TestCase[];
    };
    const { language, testCases } = body;

    let code: string;
    if (body.files != null && Object.keys(body.files).length > 0) {
      const entry = body.entryFile ?? Object.keys(body.files).sort()[0];
      code = body.files[entry] ?? "";
      if (!code) {
        return NextResponse.json(
          { error: `entryFile "${entry}" not found in files` },
          { status: 400 },
        );
      }
    } else if (typeof body.code === "string") {
      code = body.code;
    } else {
      return NextResponse.json(
        { error: "Either code or files (with entryFile) is required" },
        { status: 400 },
      );
    }

    if (!language || !testCases?.length) {
      return NextResponse.json(
        { error: "language and testCases are required" },
        { status: 400 },
      );
    }

    const languageId = LANGUAGE_IDS[language];
    if (!languageId) {
      return NextResponse.json(
        { error: `Unsupported language: ${language}. Supported: ${Object.keys(LANGUAGE_IDS).join(", ")}` },
        { status: 400 },
      );
    }

    const results: TestResult[] = [];

    for (const tc of testCases) {
      try {
        const res = await submitToJudge0(code, languageId, tc.input);

        const actual = (res.stdout || "").trim();
        const expected = tc.expected.trim();
        const passed = actual === expected;

        results.push({
          input: tc.input,
          expected,
          actual,
          passed,
          error: res.stderr || (res.status.id > 3 ? res.status.description : undefined),
          runtime_ms: res.time ? parseFloat(res.time) * 1000 : undefined,
          memory_kb: res.memory ?? undefined,
        });
      } catch (err) {
        results.push({
          input: tc.input,
          expected: tc.expected.trim(),
          actual: "",
          passed: false,
          error: err instanceof Error ? err.message : "Execution failed",
        });
      }
    }

    const allPassed = results.every((r) => r.passed);

    return NextResponse.json({ results, allPassed });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
