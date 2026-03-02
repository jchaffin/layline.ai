"use client";

import { Button } from "@/components/ui/Button";
import {
  FileText,
  Mic,
  Brain,
  ArrowRight,
  Briefcase,
  Search,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-16">
          <Link href="/" className="text-lg font-bold tracking-tight">
            layline
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/signin">Sign in</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/signup">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="px-6 pt-24 pb-20">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.1]">
            Prepare for interviews
            <br />
            <span className="text-muted-foreground">with AI that listens</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Practice with voice-powered AI interviewers that adapt to the role,
            company, and round. Get real-time coaching from an agent that knows
            your resume.
          </p>
          <div className="pt-2">
            <Button size="lg" asChild>
              <Link href="/signup">
                Start practicing
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-20 border-t">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-12">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <Step
              icon={FileText}
              title="Upload your resume"
              description="We parse your experience, skills, and projects so the AI knows exactly what you've built."
            />
            <Step
              icon={Search}
              title="Add a job description"
              description="Paste a JD or drop a URL. We analyze the requirements and research the company via Perplexity."
            />
            <Step
              icon={Mic}
              title="Practice the interview"
              description="Choose your round — recruiter screen, technical deep-dive, or executive final. Talk to a voice AI that asks real questions."
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-20 border-t bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-4">
            Built for real interview prep
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">
            Not flashcards. Not chatbots. A full voice conversation with an AI
            that plays the interviewer while a coach whispers in your ear.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Feature
              icon={Mic}
              title="Voice-first interviews"
              description="OpenAI Realtime powers the conversation. The interviewer speaks, listens, and reacts naturally — just like the real thing."
            />
            <Feature
              icon={Brain}
              title="AI coach in your corner"
              description="A second agent watches the interview and suggests talking points, frameworks, and openers grounded in your actual experience."
            />
            <Feature
              icon={Briefcase}
              title="Three interview modes"
              description="Recruiter screen, technical deep-dive (system design, whiteboard), and executive final round — each with a distinct persona and question style."
            />
            <Feature
              icon={MessageSquare}
              title="Knowledge-backed answers"
              description="Your coach searches your knowledge base and resume to suggest specific projects, metrics, and experiences you can reference."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 border-t">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h2 className="text-2xl font-bold">Ready to practice?</h2>
          <p className="text-muted-foreground">
            Upload your resume, pick a job, and start a mock interview in under
            a minute.
          </p>
          <Button size="lg" asChild>
            <Link href="/signup">
              Get started
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t px-6 py-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-sm text-muted-foreground">
          <span className="font-medium text-foreground">layline</span>
          <span>&copy; {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
}

function Step({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof FileText;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center space-y-3">
      <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>
    </div>
  );
}

function Feature({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof FileText;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4 p-5 rounded-xl border bg-background">
      <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <h3 className="font-semibold mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}
