"use client";

import {
  useState,
  useCallback,
  useRef,
  useEffect,
  useImperativeHandle,
  forwardRef,
  useMemo,
} from "react";
import Editor, { type OnMount } from "@monaco-editor/react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Play,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Loader2,
  Lightbulb,
  FileCode,
} from "lucide-react";

interface TestCase {
  input: string;
  expected: string;
  isHidden: boolean;
}

interface TestResult {
  input: string;
  expected: string;
  actual: string;
  passed: boolean;
  error?: string;
  runtime_ms?: number;
}

/** Per language: single file (string) or multi-file (filename -> content) */
type StarterCodeValue = string | Record<string, string>;

interface CodingProblem {
  id: string;
  title: string;
  slug: string;
  description: string;
  difficulty: string;
  tags: string[];
  testCases: TestCase[];
  starterCode: Record<string, StarterCodeValue>;
  hints: string[];
}

export interface CodePanelRef {
  getCode: () => string;
  getLanguage: () => string;
  getFiles: () => Record<string, string> | null;
}

interface CodePanelProps {
  problem: CodingProblem;
}

const LANGUAGES = [
  { id: "python", label: "Python" },
  { id: "javascript", label: "JavaScript" },
  { id: "typescript", label: "TypeScript" },
];

const DEFAULT_FILENAMES: Record<string, string> = {
  python: "main.py",
  javascript: "index.js",
  typescript: "index.ts",
};

function normalizeStarterCode(
  raw: StarterCodeValue | undefined,
  language: string,
): Record<string, string> {
  if (!raw) return { [DEFAULT_FILENAMES[language] || "main"]: "" };
  if (typeof raw === "string") {
    return { [DEFAULT_FILENAMES[language] || "main"]: raw };
  }
  return raw;
}

function pickEntryFile(files: Record<string, string>, language: string): string {
  const names = Object.keys(files).sort();
  const preferred =
    language === "python"
      ? "main.py"
      : language === "typescript"
        ? "index.ts"
        : language === "javascript"
          ? "index.js"
          : "main";
  if (preferred && files[preferred]) return preferred;
  const main = names.find((n) => n.startsWith("main.") || n === "main");
  if (main) return main;
  return names[0] ?? "";
}

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "bg-green-100 text-green-700 border-green-200",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  hard: "bg-red-100 text-red-700 border-red-200",
};

const CodePanel = forwardRef<CodePanelRef, CodePanelProps>(
  function CodePanel({ problem }, ref) {
    const [language, setLanguage] = useState("python");
    const starterFiles = useMemo(
      () => normalizeStarterCode(problem.starterCode[language], language),
      [problem.starterCode, language],
    );
    const [files, setFiles] = useState<Record<string, string>>(() => ({ ...starterFiles }));
    const fileNames = useMemo(() => Object.keys(files).sort(), [files]);
    const [activeFile, setActiveFile] = useState<string>(() =>
      fileNames.length ? fileNames[0] : DEFAULT_FILENAMES[language],
    );
    const [results, setResults] = useState<TestResult[] | null>(null);
    const [isRunning, setIsRunning] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [showDescription, setShowDescription] = useState(true);
    const [revealedHints, setRevealedHints] = useState(0);
    const editorRef = useRef<Parameters<OnMount>[0] | null>(null);

    const isMultiFile = fileNames.length > 1;
    const entryFile = useMemo(
      () => pickEntryFile(files, language),
      [files, language],
    );
    const currentCode = files[activeFile] ?? "";

    useImperativeHandle(ref, () => ({
      getCode: () => {
        if (!isMultiFile) return currentCode;
        return fileNames
          .map((name) => `--- ${name} ---\n${files[name] ?? ""}`)
          .join("\n\n");
      },
      getLanguage: () => language,
      getFiles: () => (isMultiFile ? { ...files } : null),
    }));

    useEffect(() => {
      const next = normalizeStarterCode(problem.starterCode[language], language);
      setFiles(next);
      const names = Object.keys(next).sort();
      setActiveFile(names[0] ?? DEFAULT_FILENAMES[language]);
      setResults(null);
      setRevealedHints(0);
    }, [problem.id, language, problem.starterCode]);

    const handleEditorMount: OnMount = (editor) => {
      editorRef.current = editor;
    };

    const visibleTests = useMemo(
      () => problem.testCases.filter((tc) => !tc.isHidden),
      [problem.testCases],
    );
    const runPayload = useMemo(() => {
      if (isMultiFile) {
        return {
          files: { ...files },
          entryFile: entryFile || fileNames[0],
          language,
          testCases: visibleTests.map((tc) => ({ input: tc.input, expected: tc.expected })),
        };
      }
      return {
        code: currentCode,
        language,
        testCases: visibleTests.map((tc) => ({ input: tc.input, expected: tc.expected })),
      };
    }, [isMultiFile, files, entryFile, fileNames, language, currentCode, visibleTests]);

    const handleRun = useCallback(async () => {
      setIsRunning(true);
      setShowResults(true);
      try {
        const res = await fetch("/api/execute", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(runPayload),
        });
        const data = await res.json();
        setResults(data.results || []);
      } catch {
        setResults([]);
      } finally {
        setIsRunning(false);
      }
    }, [runPayload]);

    const submitPayload = useMemo(() => {
      if (isMultiFile) {
        return {
          files: { ...files },
          entryFile: entryFile || fileNames[0],
          language,
          testCases: problem.testCases.map((tc) => ({ input: tc.input, expected: tc.expected })),
        };
      }
      return {
        code: currentCode,
        language,
        testCases: problem.testCases.map((tc) => ({ input: tc.input, expected: tc.expected })),
      };
    }, [isMultiFile, files, entryFile, fileNames, language, currentCode, problem.testCases]);

    const handleSubmit = useCallback(async () => {
      setIsRunning(true);
      setShowResults(true);
      try {
        const res = await fetch("/api/execute", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(submitPayload),
        });
        const data = await res.json();
        setResults(data.results || []);
      } catch {
        setResults([]);
      } finally {
        setIsRunning(false);
      }
    }, [submitPayload]);

    const handleReset = () => {
      setFiles({ ...starterFiles });
      setResults(null);
    };

    const passedCount = results?.filter((r) => r.passed).length ?? 0;
    const totalCount = results?.length ?? 0;

    return (
      <div className="flex flex-col h-full border-l border-r">
        {/* Problem header */}
        <div className="border-b px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-sm">{problem.title}</h2>
            <Badge
              variant="outline"
              className={`text-[10px] capitalize ${DIFFICULTY_COLORS[problem.difficulty] || ""}`}
            >
              {problem.difficulty}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setShowDescription(!showDescription)}
          >
            {showDescription ? (
              <ChevronUp className="w-3 h-3 mr-1" />
            ) : (
              <ChevronDown className="w-3 h-3 mr-1" />
            )}
            Problem
          </Button>
        </div>

        {/* Problem description */}
        {showDescription && (
          <div className="border-b overflow-y-auto max-h-[40%] px-4 py-3 text-sm prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown>{problem.description}</ReactMarkdown>
            {problem.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3 not-prose">
                {problem.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-[10px]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            {problem.hints.length > 0 && (
              <div className="mt-3 not-prose">
                {revealedHints < problem.hints.length && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs text-yellow-600"
                    onClick={() => setRevealedHints((p) => p + 1)}
                  >
                    <Lightbulb className="w-3 h-3 mr-1" />
                    Hint ({revealedHints}/{problem.hints.length})
                  </Button>
                )}
                {problem.hints.slice(0, revealedHints).map((hint, i) => (
                  <p
                    key={i}
                    className="text-xs text-muted-foreground mt-1 pl-2 border-l-2 border-yellow-300"
                  >
                    {hint}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Editor toolbar */}
        <div className="flex items-center justify-between px-3 py-2 border-b shrink-0">
          <div className="flex items-center gap-2">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="text-xs border rounded px-2 py-1 bg-background"
            >
              {LANGUAGES.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.label}
                </option>
              ))}
            </select>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={handleReset}>
              <RotateCcw className="w-3 h-3 mr-1" />
              Reset
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={handleRun}
              disabled={isRunning}
            >
              {isRunning ? (
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              ) : (
                <Play className="w-3 h-3 mr-1" />
              )}
              Run
            </Button>
            <Button
              size="sm"
              className="h-7 text-xs"
              onClick={handleSubmit}
              disabled={isRunning}
            >
              Submit
            </Button>
          </div>
        </div>

        {/* File tabs (multi-file) */}
        {isMultiFile && (
          <div className="flex items-center gap-0 border-b shrink-0 overflow-x-auto">
            {fileNames.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => setActiveFile(name)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
                  activeFile === name
                    ? "border-primary text-foreground bg-muted/50"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                {name}
              </button>
            ))}
          </div>
        )}

        {/* Monaco editor */}
        <div className="flex-1 min-h-0">
          <Editor
            key={activeFile}
            language={language}
            value={currentCode}
            onChange={(v) =>
              setFiles((prev) => ({ ...prev, [activeFile]: v ?? "" }))
            }
            onMount={handleEditorMount}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              lineNumbers: "on",
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              wordWrap: "on",
              padding: { top: 8 },
            }}
          />
        </div>

        {/* Test results */}
        {showResults && results && (
          <div className="border-t shrink-0 max-h-[30%] overflow-y-auto">
            <div className="flex items-center justify-between px-3 py-2 border-b">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium">
                  Results: {passedCount}/{totalCount} passed
                </span>
                {passedCount === totalCount && totalCount > 0 && (
                  <Badge className="bg-green-600 text-white text-[10px]">
                    All Passed
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={() => setShowResults(false)}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
            <div className="divide-y">
              {results.map((r, i) => (
                <div key={i} className="px-3 py-2 text-xs">
                  <div className="flex items-center gap-2 mb-1">
                    {r.passed ? (
                      <Check className="w-3 h-3 text-green-600" />
                    ) : (
                      <X className="w-3 h-3 text-red-500" />
                    )}
                    <span className="font-medium">Test {i + 1}</span>
                    {r.runtime_ms != null && (
                      <span className="text-muted-foreground ml-auto">
                        {r.runtime_ms.toFixed(0)}ms
                      </span>
                    )}
                  </div>
                  {!r.passed && (
                    <div className="ml-5 space-y-0.5 text-muted-foreground">
                      <div>
                        <span className="font-medium text-foreground">Input:</span>{" "}
                        <code className="bg-muted px-1 rounded">{r.input}</code>
                      </div>
                      <div>
                        <span className="font-medium text-foreground">Expected:</span>{" "}
                        <code className="bg-muted px-1 rounded">{r.expected}</code>
                      </div>
                      <div>
                        <span className="font-medium text-foreground">Got:</span>{" "}
                        <code className="bg-muted px-1 rounded">{r.actual || "(empty)"}</code>
                      </div>
                      {r.error && (
                        <div className="text-red-500 mt-1">{r.error}</div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  },
);

export default CodePanel;
