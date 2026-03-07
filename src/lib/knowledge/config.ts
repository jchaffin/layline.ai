export const KNOWLEDGE_CORPORA = [
  "work_experience",
  "interview_materials",
] as const;

export type KnowledgeCorpus = (typeof KNOWLEDGE_CORPORA)[number];

export const EMBEDDING_MODEL = "text-embedding-3-large";
export const DEFAULT_KNOWLEDGE_LIMIT = 8;
export const MAX_KNOWLEDGE_LIMIT = 20;

const KNOWLEDGE_NAMESPACE_BY_CORPUS: Record<KnowledgeCorpus, string> = {
  work_experience: "work-experience",
  interview_materials: "interview-materials",
};

const KNOWLEDGE_BUCKET_BY_CORPUS: Record<KnowledgeCorpus, string> = {
  work_experience:
    process.env.GCS_WORK_EXPERIENCE_BUCKET || "layline-ai-work-experience",
  interview_materials:
    process.env.GCS_INTERVIEW_KB_BUCKET || "interview-kb",
};

export function isKnowledgeCorpus(value: unknown): value is KnowledgeCorpus {
  return (
    typeof value === "string" &&
    KNOWLEDGE_CORPORA.includes(value as KnowledgeCorpus)
  );
}

export function getKnowledgeNamespace(corpus: KnowledgeCorpus): string {
  return KNOWLEDGE_NAMESPACE_BY_CORPUS[corpus];
}

export function getKnowledgeBucket(corpus: KnowledgeCorpus): string {
  return KNOWLEDGE_BUCKET_BY_CORPUS[corpus];
}
