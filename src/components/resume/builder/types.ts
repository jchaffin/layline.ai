import type { ReactNode } from "react";

export interface DraggableResumeBuilderProps {
  resumeData: any;
  onDataChange: (data: any) => void;
  onSave?: () => void;
  readOnly?: boolean;
}

export type ResumeSectionType =
  | "contact"
  | "summary"
  | "experience"
  | "project"
  | "education"
  | "skills"
  | "custom";

export interface ResumeSection {
  id: string;
  type: ResumeSectionType;
  title: string;
  data: any;
}

export interface SectionEditorProps<T = any> {
  data: T;
  onUpdate: (data: T) => void;
  grip?: ReactNode;
}

export interface DeletableSectionEditorProps<T = any>
  extends SectionEditorProps<T> {
  onDelete: () => void;
}
