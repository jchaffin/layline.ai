"use client";

import { Button } from "@/components/ui/Button";
import {
  LayoutDashboard,
  FileText,
  Briefcase,
  BarChart3,
  Mic,
  Code2,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
} from "lucide-react";
import LoginButton from "@/components/auth/LoginButton";
import type { NavigationStep } from "@/types/interview";

export type { NavigationStep };

interface NavigationProps {
  currentStep: NavigationStep;
  onStepChange: (step: NavigationStep) => void;
  completedSteps: NavigationStep[];
  resumeReady?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: (collapsed: boolean) => void;
  hideCollapseToggle?: boolean;
}

const NAV_ITEMS: {
  id: NavigationStep;
  label: string;
  icon: typeof LayoutDashboard;
  requiresResume?: boolean;
}[] = [
  { id: "dashboard", label: "Home", icon: LayoutDashboard },
  { id: "documents", label: "Resume", icon: FileText },
  { id: "jobs", label: "Jobs", icon: Briefcase },
  { id: "insights", label: "Analysis", icon: BarChart3, requiresResume: true },
  { id: "interview", label: "Interview", icon: Mic },
  { id: "problems", label: "Problems", icon: Code2 },
];

export function Navigation({
  currentStep,
  onStepChange,
  completedSteps,
  resumeReady = false,
  isCollapsed = false,
  onToggleCollapse,
  hideCollapseToggle = false,
}: NavigationProps) {
  const toggle = () => onToggleCollapse?.(!isCollapsed);

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:fixed lg:left-0 lg:top-0 lg:h-full lg:flex lg:flex-col border-r bg-background transition-all duration-200 ${
          isCollapsed ? "lg:w-16" : "lg:w-56"
        }`}
      >
        <div
          className={`flex items-center justify-between border-b ${isCollapsed ? "p-3" : "px-5 py-4"}`}
        >
          {!isCollapsed && (
            <span className="text-lg font-bold tracking-tight">layline</span>
          )}
          {!hideCollapseToggle && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggle}>
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </Button>
          )}
        </div>

        <nav className="flex-1 py-3 px-2 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = item.id === currentStep;
            const completed = completedSteps.includes(item.id);
            const disabled = item.requiresResume && !resumeReady;

            return (
              <Button
                key={item.id}
                variant={active ? "secondary" : "ghost"}
                className={`w-full ${isCollapsed ? "justify-center px-0" : "justify-start"} h-10 ${
                  disabled ? "opacity-40 pointer-events-none" : ""
                }`}
                onClick={() => !disabled && onStepChange(item.id)}
                title={isCollapsed ? item.label : undefined}
              >
                <div className="relative">
                  <Icon className="w-4 h-4" />
                  {completed && !active && (
                    <CheckCircle className="w-2.5 h-2.5 text-green-500 absolute -top-1 -right-1" />
                  )}
                </div>
                {!isCollapsed && (
                  <span className="ml-3 text-sm">{item.label}</span>
                )}
              </Button>
            );
          })}
        </nav>

        <div className="border-t p-3 flex justify-center">
          <LoginButton compact={isCollapsed} />
        </div>
      </aside>

      {/* Mobile: vertical list */}
      <div className="lg:hidden sticky top-0 z-10 border-b bg-background/80 backdrop-blur-md">
        <nav className="flex flex-col py-2 px-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = item.id === currentStep;
            const disabled = item.requiresResume && !resumeReady;

            return (
              <Button
                key={item.id}
                variant={active ? "secondary" : "ghost"}
                size="sm"
                className={`w-full justify-start gap-2 h-10 ${disabled ? "opacity-40 pointer-events-none" : ""}`}
                onClick={() => !disabled && onStepChange(item.id)}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="text-sm">{item.label}</span>
              </Button>
            );
          })}
        </nav>
        <div className="border-t p-2">
          <LoginButton />
        </div>
      </div>
    </>
  );
}
