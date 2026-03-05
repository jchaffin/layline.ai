"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Label } from "@/components/ui/Label";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  X,
  Search,
  Play,
} from "lucide-react";

interface ProblemSummary {
  id: string;
  title: string;
  slug: string;
  difficulty: string;
  tags: string[];
  createdAt: string;
}

interface ProblemFull extends ProblemSummary {
  description: string;
  testCases: { input: string; expected: string; isHidden: boolean }[];
  starterCode: Record<string, string>;
  hints: string[];
}

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "bg-green-100 text-green-700",
  medium: "bg-yellow-100 text-yellow-700",
  hard: "bg-red-100 text-red-700",
};

const ALL_TAGS = [
  "arrays", "strings", "linked-list", "trees", "graphs",
  "dp", "hash-map", "sorting", "heap", "stack",
  "two-pointers", "sliding-window", "binary-search",
  "recursion", "bfs", "dfs", "topological-sort",
  "design", "bst", "prefix-sum",
];

export default function ProblemsPage() {
  const router = useRouter();
  const [problems, setProblems] = useState<ProblemSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDifficulty, setFilterDifficulty] = useState("");
  const [filterTag, setFilterTag] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingProblem, setEditingProblem] = useState<ProblemFull | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const fetchProblems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterDifficulty) params.set("difficulty", filterDifficulty);
      if (filterTag) params.append("tag", filterTag);
      const res = await fetch(`/api/problems?${params}`);
      const data = res.ok ? await res.json() : { problems: [] };
      setProblems(data.problems || []);
    } catch {
      setProblems([]);
    } finally {
      setLoading(false);
    }
  }, [filterDifficulty, filterTag]);

  useEffect(() => {
    fetchProblems();
  }, [fetchProblems]);

  const handleEdit = async (id: string) => {
    const res = await fetch(`/api/problems/${id}`);
    const data = await res.json();
    if (data.problem) setEditingProblem(data.problem);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this problem?")) return;
    await fetch(`/api/problems/${id}`, { method: "DELETE" });
    fetchProblems();
  };

  const filteredProblems = problems.filter((p) =>
    !searchQuery || p.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (editingProblem || isCreating) {
    return (
      <ProblemForm
        problem={editingProblem}
        onSave={() => {
          setEditingProblem(null);
          setIsCreating(false);
          fetchProblems();
        }}
        onCancel={() => {
          setEditingProblem(null);
          setIsCreating(false);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto">
        <button
          onClick={() => router.push("/dashboard")}
          className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Coding Problems</h1>
            <p className="text-muted-foreground mt-1">
              Manage your problem bank for technical interviews
            </p>
          </div>
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Problem
          </Button>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search problems..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            value={filterDifficulty}
            onChange={(e) => setFilterDifficulty(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm bg-background"
          >
            <option value="">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
          <select
            value={filterTag}
            onChange={(e) => setFilterTag(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm bg-background"
          >
            <option value="">All Tags</option>
            {ALL_TAGS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <p className="text-muted-foreground text-center py-12">Loading...</p>
        ) : filteredProblems.length === 0 ? (
          <p className="text-muted-foreground text-center py-12">
            No problems found. Add some to get started.
          </p>
        ) : (
          <div className="space-y-2">
            {filteredProblems.map((p) => (
              <Card key={p.id} className="hover:border-primary/30 transition-colors">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="outline"
                      className={`text-[10px] capitalize ${DIFFICULTY_COLORS[p.difficulty] || ""}`}
                    >
                      {p.difficulty}
                    </Badge>
                    <span className="font-medium text-sm">{p.title}</span>
                    <div className="flex gap-1">
                      {p.tags.slice(0, 3).map((t) => (
                        <span
                          key={t}
                          className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-[10px]"
                        >
                          {t}
                        </span>
                      ))}
                      {p.tags.length > 3 && (
                        <span className="text-[10px] text-muted-foreground">
                          +{p.tags.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1.5"
                      onClick={() => router.push(`/problems/${p.id}/practice`)}
                    >
                      <Play className="w-3.5 h-3.5" />
                      Practice
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => handleEdit(p.id)}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                      onClick={() => handleDelete(p.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProblemForm({
  problem,
  onSave,
  onCancel,
}: {
  problem: ProblemFull | null;
  onSave: () => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(problem?.title || "");
  const [slug, setSlug] = useState(problem?.slug || "");
  const [description, setDescription] = useState(problem?.description || "");
  const [difficulty, setDifficulty] = useState(problem?.difficulty || "medium");
  const [tags, setTags] = useState(problem?.tags.join(", ") || "");
  const [hints, setHints] = useState(problem?.hints.join("\n") || "");
  const [pythonStarter, setPythonStarter] = useState(
    problem?.starterCode?.python || "",
  );
  const [jsStarter, setJsStarter] = useState(
    problem?.starterCode?.javascript || "",
  );
  const [testCasesJson, setTestCasesJson] = useState(
    problem?.testCases
      ? JSON.stringify(problem.testCases, null, 2)
      : '[{ "input": "", "expected": "", "isHidden": false }]',
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const autoSlug = useCallback((t: string) => {
    return t
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }, []);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!problem) setSlug(autoSlug(val));
  };

  const handleSave = async () => {
    setError("");
    setSaving(true);

    let testCases;
    try {
      testCases = JSON.parse(testCasesJson);
    } catch {
      setError("Test cases must be valid JSON");
      setSaving(false);
      return;
    }

    const body = {
      title,
      slug,
      description,
      difficulty,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      testCases,
      starterCode: {
        python: pythonStarter,
        javascript: jsStarter,
      },
      hints: hints.split("\n").filter(Boolean),
    };

    try {
      const url = problem ? `/api/problems/${problem.id}` : "/api/problems";
      const method = problem ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save");
        setSaving(false);
        return;
      }

      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={onCancel}
          className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors mb-6"
        >
          <X className="w-4 h-4" />
          Cancel
        </button>

        <h1 className="text-2xl font-bold mb-6">
          {problem ? "Edit Problem" : "New Problem"}
        </h1>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Title</Label>
              <Input
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Two Sum"
              />
            </div>
            <div>
              <Label>Slug</Label>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="two-sum"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Difficulty</Label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm bg-background mt-1"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div>
              <Label>Tags (comma-separated)</Label>
              <Input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="arrays, hash-map, two-pointers"
              />
            </div>
          </div>

          <div>
            <Label>Description (Markdown)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Given an array of integers..."
              rows={12}
              className="font-mono text-sm"
            />
          </div>

          <div>
            <Label>Test Cases (JSON array)</Label>
            <Textarea
              value={testCasesJson}
              onChange={(e) => setTestCasesJson(e.target.value)}
              rows={8}
              className="font-mono text-sm"
              placeholder='[{ "input": "...", "expected": "...", "isHidden": false }]'
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Starter Code (Python)</Label>
              <Textarea
                value={pythonStarter}
                onChange={(e) => setPythonStarter(e.target.value)}
                rows={6}
                className="font-mono text-sm"
                placeholder="def solution(nums):\n    pass"
              />
            </div>
            <div>
              <Label>Starter Code (JavaScript)</Label>
              <Textarea
                value={jsStarter}
                onChange={(e) => setJsStarter(e.target.value)}
                rows={6}
                className="font-mono text-sm"
                placeholder="function solution(nums) {\n  \n}"
              />
            </div>
          </div>

          <div>
            <Label>Hints (one per line)</Label>
            <Textarea
              value={hints}
              onChange={(e) => setHints(e.target.value)}
              rows={4}
              placeholder="Use a hash map for O(1) lookup.\nConsider the edge case where..."
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !title || !slug}>
              {saving ? "Saving..." : problem ? "Update Problem" : "Create Problem"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
