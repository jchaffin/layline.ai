"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import {
  ArrowLeft,
  Save,
  Mic,
  Plus,
  X,
  Building,
  MapPin,
  Briefcase,
  Clock,
  FileText,
  Play,
  Check,
} from "lucide-react";

interface InterviewStep {
  step: number;
  name: string;
  duration?: string;
  completed?: boolean;
}

interface Analysis {
  company?: string;
  role?: string;
  companyInfo?: string;
  experience?: string;
  experienceLevel?: string;
  requiredSkills?: string[];
  preferredSkills?: string[];
  responsibilities?: string[];
  qualifications?: string[];
  workType?: string;
  location?: string;
  keywords?: string[];
  interviewProcess?: InterviewStep[];
}

interface JDEditViewProps {
  application: {
    id: string;
    jobTitle: string;
    company: string;
    location: string;
    jobUrl?: string;
    description?: string;
    analysis?: Analysis;
  };
  onBack: () => void;
  onSave: (id: string, data: { jobTitle: string; company: string; location: string; description?: string; analysis: Analysis }) => void;
  onPracticeInterview: (context: { companyName: string; roleTitle: string; jobDescription: string }) => void;
}

export default function JDEditView({ application, onBack, onSave, onPracticeInterview }: JDEditViewProps) {
  const [analysis, setAnalysis] = useState<Analysis>(() => ({
    company: application.company,
    role: application.jobTitle,
    location: application.location,
    ...application.analysis,
  }));
  const [description, setDescription] = useState(application.description || "");
  const [dirty, setDirty] = useState(false);
  const [newSkill, setNewSkill] = useState("");
  const [newPrefSkill, setNewPrefSkill] = useState("");
  const [newQual, setNewQual] = useState("");
  const [newResp, setNewResp] = useState("");

  const update = useCallback(<K extends keyof Analysis>(key: K, value: Analysis[K]) => {
    setAnalysis((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  }, []);

  const toggleStepComplete = (index: number) => {
    const steps = [...(analysis.interviewProcess || [])];
    steps[index] = { ...steps[index], completed: !steps[index].completed };
    update("interviewProcess", steps);
  };

  const addToList = (key: "requiredSkills" | "preferredSkills" | "qualifications" | "responsibilities", value: string) => {
    if (!value.trim()) return;
    update(key, [...(analysis[key] || []), value.trim()]);
  };

  const removeFromList = (key: "requiredSkills" | "preferredSkills" | "qualifications" | "responsibilities", index: number) => {
    update(key, (analysis[key] || []).filter((_, i) => i !== index));
  };

  const handleSave = () => {
    onSave(application.id, {
      jobTitle: analysis.role || application.jobTitle,
      company: analysis.company || application.company,
      location: analysis.location || application.location,
      description,
      analysis,
    });
    setDirty(false);
  };

  const handlePracticeInterview = (stepName?: string) => {
    const jdParts = [
      analysis.companyInfo && `About: ${analysis.companyInfo}`,
      analysis.experience && `Experience: ${analysis.experience}`,
      analysis.requiredSkills?.length && `Required Skills: ${analysis.requiredSkills.join(", ")}`,
      analysis.qualifications?.length && `Qualifications:\n${analysis.qualifications.join("\n")}`,
      analysis.responsibilities?.length && `Responsibilities:\n${analysis.responsibilities.join("\n")}`,
      stepName && `Interview Stage: ${stepName}`,
      description,
    ].filter(Boolean).join("\n\n");

    onPracticeInterview({
      companyName: analysis.company || application.company,
      roleTitle: analysis.role || application.jobTitle,
      jobDescription: jdParts,
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to tracker
        </button>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleSave} disabled={!dirty}>
            <Save className="w-4 h-4 mr-1.5" />
            {dirty ? "Save changes" : "Saved"}
          </Button>
          <Button size="sm" onClick={() => handlePracticeInterview()}>
            <Mic className="w-4 h-4 mr-1.5" />
            Practice Interview
          </Button>
        </div>
      </div>

      {/* Role & Company */}
      <div className="bg-white rounded-xl border p-5 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Role</label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={analysis.role || ""}
                onChange={(e) => update("role", e.target.value)}
                className="pl-10"
                placeholder="Job title"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Company</label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={analysis.company || ""}
                onChange={(e) => update("company", e.target.value)}
                className="pl-10"
                placeholder="Company name"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Location</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={analysis.location || ""}
              onChange={(e) => update("location", e.target.value)}
              className="pl-10"
              placeholder="City, State"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Work Type</label>
            <select
              value={analysis.workType || ""}
              onChange={(e) => update("workType", e.target.value)}
              className="w-full h-10 px-3 text-sm rounded-md border border-gray-200 bg-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Select</option>
              <option value="Remote">Remote</option>
              <option value="Hybrid">Hybrid</option>
              <option value="Onsite">Onsite</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Level</label>
            <select
              value={analysis.experienceLevel || ""}
              onChange={(e) => update("experienceLevel", e.target.value)}
              className="w-full h-10 px-3 text-sm rounded-md border border-gray-200 bg-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Select</option>
              <option value="Entry">Entry</option>
              <option value="Mid">Mid</option>
              <option value="Senior">Senior</option>
              <option value="Staff">Staff</option>
              <option value="Principal">Principal</option>
              <option value="Executive">Executive</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Experience</label>
          <Input
            value={analysis.experience || ""}
            onChange={(e) => update("experience", e.target.value)}
            placeholder="e.g. 5+ years of relevant experience"
          />
        </div>
      </div>

      {/* Company Info */}
      <div className="bg-white rounded-xl border p-5">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">About the Company</label>
        <Textarea
          value={analysis.companyInfo || ""}
          onChange={(e) => update("companyInfo", e.target.value)}
          placeholder="Brief company description..."
          rows={3}
        />
      </div>

      {/* Interview Process */}
      {analysis.interviewProcess && analysis.interviewProcess.length > 0 && (
        <div className="bg-white rounded-xl border p-5">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 block">Interview Process</label>
          <div className="space-y-2">
            {analysis.interviewProcess.map((step, i) => {
              const done = step.completed;
              return (
                <div
                  key={i}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer group ${
                    done
                      ? "border-green-200 bg-green-50/40"
                      : "border-gray-100 hover:border-blue-300 hover:bg-blue-50/40"
                  }`}
                >
                  <button
                    onClick={() => toggleStepComplete(i)}
                    className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all border-2 ${
                      done
                        ? "bg-green-500 border-green-500 text-white"
                        : "border-gray-300 text-transparent hover:border-blue-400"
                    }`}
                  >
                    {done ? <Check className="w-3.5 h-3.5" /> : <span className="text-xs font-bold text-gray-400">{step.step || i + 1}</span>}
                  </button>

                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => handlePracticeInterview(step.name)}
                  >
                    <p className={`text-sm font-medium ${done ? "text-green-800 line-through" : "text-gray-900"}`}>{step.name}</p>
                    {step.duration && <p className={`text-xs ${done ? "text-green-600" : "text-gray-500"}`}>{step.duration}</p>}
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePracticeInterview(step.name)}
                    className={`transition-opacity ${done ? "opacity-50" : "opacity-0 group-hover:opacity-100"}`}
                  >
                    <Play className="w-3.5 h-3.5 mr-1" />
                    Practice
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Required Skills */}
      <EditableTagSection
        title="Required Skills"
        items={analysis.requiredSkills || []}
        onRemove={(i) => removeFromList("requiredSkills", i)}
        inputValue={newSkill}
        onInputChange={setNewSkill}
        onAdd={() => { addToList("requiredSkills", newSkill); setNewSkill(""); }}
        tagClassName="bg-gray-900 text-white"
        placeholder="Add skill..."
      />

      {/* Preferred Skills */}
      <EditableTagSection
        title="Preferred Skills"
        items={analysis.preferredSkills || []}
        onRemove={(i) => removeFromList("preferredSkills", i)}
        inputValue={newPrefSkill}
        onInputChange={setNewPrefSkill}
        onAdd={() => { addToList("preferredSkills", newPrefSkill); setNewPrefSkill(""); }}
        tagClassName="bg-gray-100 text-gray-700"
        placeholder="Add skill..."
      />

      {/* Qualifications */}
      <EditableBulletSection
        title="Qualifications"
        items={analysis.qualifications || []}
        onRemove={(i) => removeFromList("qualifications", i)}
        inputValue={newQual}
        onInputChange={setNewQual}
        onAdd={() => { addToList("qualifications", newQual); setNewQual(""); }}
        placeholder="Add qualification..."
      />

      {/* Responsibilities */}
      <EditableBulletSection
        title="Responsibilities"
        items={analysis.responsibilities || []}
        onRemove={(i) => removeFromList("responsibilities", i)}
        inputValue={newResp}
        onInputChange={setNewResp}
        onAdd={() => { addToList("responsibilities", newResp); setNewResp(""); }}
        placeholder="Add responsibility..."
      />

      {/* Full Description */}
      <div className="bg-white rounded-xl border p-5">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5" /> Full Description
        </label>
        <Textarea
          value={description}
          onChange={(e) => { setDescription(e.target.value); setDirty(true); }}
          rows={10}
          className="text-sm leading-relaxed"
        />
      </div>
    </div>
  );
}

function EditableTagSection({
  title,
  items,
  onRemove,
  inputValue,
  onInputChange,
  onAdd,
  tagClassName,
  placeholder,
}: {
  title: string;
  items: string[];
  onRemove: (i: number) => void;
  inputValue: string;
  onInputChange: (v: string) => void;
  onAdd: () => void;
  tagClassName: string;
  placeholder: string;
}) {
  return (
    <div className="bg-white rounded-xl border p-5">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">{title}</label>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {items.map((item, i) => (
          <span key={i} className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-medium ${tagClassName}`}>
            {item}
            <button onClick={() => onRemove(i)} className="opacity-60 hover:opacity-100"><X className="w-3 h-3" /></button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onAdd(); } }}
          placeholder={placeholder}
          className="text-sm"
        />
        <Button variant="outline" size="sm" onClick={onAdd} disabled={!inputValue.trim()}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

function EditableBulletSection({
  title,
  items,
  onRemove,
  inputValue,
  onInputChange,
  onAdd,
  placeholder,
}: {
  title: string;
  items: string[];
  onRemove: (i: number) => void;
  inputValue: string;
  onInputChange: (v: string) => void;
  onAdd: () => void;
  placeholder: string;
}) {
  return (
    <div className="bg-white rounded-xl border p-5">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">{title}</label>
      <ul className="space-y-1.5 mb-3">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-gray-700 group">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-[7px] flex-shrink-0" />
            <span className="flex-1">{item}</span>
            <button onClick={() => onRemove(i)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity flex-shrink-0">
              <X className="w-3.5 h-3.5" />
            </button>
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onAdd(); } }}
          placeholder={placeholder}
          className="text-sm"
        />
        <Button variant="outline" size="sm" onClick={onAdd} disabled={!inputValue.trim()}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
