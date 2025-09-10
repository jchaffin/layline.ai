import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { experience } = await request.json();

    if (!experience) {
      return NextResponse.json(
        { error: "Experience data is required" },
        { status: 400 }
      );
    }

    // Simulate AI improvement of the experience description
    const improvedDescription = await improveExperienceDescription(experience);

    return NextResponse.json({
      success: true,
      improvedDescription,
      message: "Experience improved with AI suggestions"
    });

  } catch (error) {
    console.error("Improve experience error:", error);
    return NextResponse.json(
      { error: "Failed to improve experience" },
      { status: 500 }
    );
  }
}

async function improveExperienceDescription(experience: {
  company?: string;
  role?: string;
  description?: string;
  duration?: string;
}): Promise<string> {
  // For now, provide enhanced descriptions with better keywords and structure
  const { company, role, description } = experience;

  // Basic improvements with action verbs and quantifiable achievements
  const actionVerbs = [
    "Developed", "Implemented", "Led", "Managed", "Designed", "Optimized", 
    "Created", "Delivered", "Achieved", "Improved", "Collaborated", "Streamlined"
  ];

  const improvements = [
    "• Collaborated with cross-functional teams to deliver high-quality solutions",
    "• Implemented best practices and coding standards to improve code quality",
    "• Participated in agile development processes and sprint planning",
    "• Contributed to technical documentation and knowledge sharing",
    "• Optimized performance and user experience through innovative solutions"
  ];

  // If there's already a description, enhance it
  if (description && description.trim()) {
    let enhanced = description;
    
    // Add action verbs if missing
    if (!actionVerbs.some(verb => enhanced.toLowerCase().includes(verb.toLowerCase()))) {
      enhanced = `Developed and ${enhanced.toLowerCase()}`;
    }

    // Add quantifiable impact if missing numbers
    if (!/\d/.test(enhanced)) {
      enhanced += ". Improved system efficiency by 20% and reduced processing time.";
    }

    // Add collaboration if not mentioned
    if (!enhanced.toLowerCase().includes("team") && !enhanced.toLowerCase().includes("collaborat")) {
      enhanced += " Worked closely with team members to ensure project success.";
    }

    return enhanced;
  }

  // Generate a new description if none exists
  const roleTitle = role || "Professional";
  const companyName = company || "the organization";

  return `Developed and implemented key initiatives as ${roleTitle} at ${companyName}. ${improvements.slice(0, 3).join(" ")} Delivered measurable results while maintaining high standards of quality and efficiency.`;
}