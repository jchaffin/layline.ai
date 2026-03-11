import type { ResumeSection } from "./types";

export function initializeSections(resumeData: any): ResumeSection[] {
  const sections: ResumeSection[] = [];

  if (resumeData?.contact || true) {
    sections.push({
      id: "contact",
      type: "contact",
      title: "Contact Information",
      data: {
        ...(resumeData?.contact || {}),
        title: resumeData?.contact?.title || resumeData?.jobTitle || "",
      },
    });
  }

  if (resumeData?.summary || true) {
    sections.push({
      id: "summary",
      type: "summary",
      title: "Professional Summary",
      data: resumeData?.summary || "",
    });
  }

  if (resumeData?.skills || true) {
    sections.push({
      id: "skills",
      type: "skills",
      title: "Skills",
      data: resumeData?.skills || [],
    });
  }

  if ((resumeData?.experience && resumeData.experience.length > 0) || true) {
    sections.push({
      id: "work-experience-header",
      type: "custom",
      title: "Work Experience",
      data: { title: "Work Experience", content: "", isHeader: true },
    });
  }

  const experiences = resumeData?.experience || [];
  experiences.forEach((exp: any, index: number) => {
    sections.push({
      id: `experience-${index}`,
      type: "experience",
      title: `${exp.role || "New Position"}`,
      data: exp,
    });
  });

  if (resumeData?.projects && resumeData.projects.length > 0) {
    sections.push({
      id: "projects-header",
      type: "custom",
      title: "Projects",
      data: { title: "Projects", content: "", isHeader: true },
    });
  }

  const projects = resumeData?.projects || [];
  projects.forEach((project: any, index: number) => {
    sections.push({
      id: `project-${index}`,
      type: "project",
      title: `${project.company || project.role || "New Project"}`,
      data: project,
    });
  });

  if ((resumeData?.education && resumeData.education.length > 0) || true) {
    sections.push({
      id: "education-header",
      type: "custom",
      title: "Education",
      data: { title: "Education", content: "", isHeader: true },
    });
  }

  const educations = resumeData?.education || [];
  educations.forEach((edu: any, index: number) => {
    sections.push({
      id: `education-${index}`,
      type: "education",
      title: `${edu.degree || "New Education"}`,
      data: edu,
    });
  });

  return sections;
}

export function serializeSectionsToResumeData(
  resumeData: any,
  newSections: ResumeSection[],
) {
  const nextResumeData = { ...resumeData };

  nextResumeData.experience = [];
  nextResumeData.projects = [];
  nextResumeData.education = [];

  newSections.forEach((section) => {
    switch (section.type) {
      case "contact":
        nextResumeData.contact = section.data;
        nextResumeData.jobTitle =
          typeof section.data?.title === "string" && section.data.title.trim()
            ? section.data.title
            : undefined;
        break;
      case "summary":
        nextResumeData.summary = section.data;
        break;
      case "skills":
        nextResumeData.skills = section.data;
        break;
      case "experience":
        nextResumeData.experience.push(section.data);
        break;
      case "project":
        nextResumeData.projects.push(section.data);
        break;
      case "education":
        nextResumeData.education.push(section.data);
        break;
      case "custom":
        break;
    }
  });

  return nextResumeData;
}

export function createSection(type: "experience" | "project" | "education") {
  const id = `${type}-${Date.now()}`;

  const data =
    type === "experience"
      ? {
          company: "",
          role: "",
          startDate: new Date(),
          endDate: undefined,
          isCurrentRole: false,
          location: "",
          description: "",
        }
      : type === "project"
        ? {
            company: "",
            role: "",
            startDate: undefined,
            endDate: undefined,
            isCurrentRole: false,
            location: "",
            description: "",
          }
        : {
            institution: "",
            degree: "",
            field: "",
            year: "",
          };

  return {
    id,
    type,
    title:
      type === "experience"
        ? "New Experience"
        : type === "project"
          ? "New Project"
          : "New Education",
    data,
  } satisfies ResumeSection;
}

export function getInsertIndex(
  sections: ResumeSection[],
  type: "experience" | "project" | "education",
) {
  let insertIndex = sections.length;

  if (type === "experience" || type === "project") {
    const firstEducationIndex = sections.findIndex(
      (section) => section.type === "education",
    );
    if (firstEducationIndex !== -1) {
      insertIndex = firstEducationIndex;
    }
  }

  return insertIndex;
}
