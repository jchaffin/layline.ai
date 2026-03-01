'use client'

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  LayoutDashboard,
  FileText, 
  Briefcase,
  BarChart3,
  MessageSquare,
  Mic,
  MoreHorizontal,
  CheckCircle,
  Clock,
  ChevronRight,
  ChevronLeft,
  Menu
} from "lucide-react";
import LoginButton from "@/components/auth/LoginButton";

export type NavigationStep = 'dashboard' | 'documents' | 'jobs' | 'job-board' | 'insights' | 'prep' | 'interview' | 'live-interview' | 'mock-interview' | 'other';

interface NavigationProps {
  currentStep: NavigationStep;
  onStepChange: (step: NavigationStep) => void;
  completedSteps: NavigationStep[];
  resumeReady?: boolean;
  prepComplete?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: (collapsed: boolean) => void;
}

export function Navigation({ 
  currentStep, 
  onStepChange, 
  completedSteps,
  resumeReady = false,
  prepComplete = false,
  isCollapsed: externalCollapsed,
  onToggleCollapse
}: NavigationProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const isCollapsed = externalCollapsed !== undefined ? externalCollapsed : internalCollapsed;
  
  const handleToggle = () => {
    const newState = !isCollapsed;
    if (onToggleCollapse) {
      onToggleCollapse(newState);
    } else {
      setInternalCollapsed(newState);
    }
  };
  const steps = [
    {
      id: 'dashboard' as NavigationStep,
      title: 'Dashboard',
      description: 'Overview and quick actions',
      icon: LayoutDashboard,
      status: currentStep === 'dashboard' ? 'active' : 'available',
      enabled: true
    },
    {
      id: 'documents' as NavigationStep,
      title: 'Documents',
      description: 'Resume management and storage',
      icon: FileText,
      status: resumeReady ? 'completed' : (currentStep === 'documents' ? 'active' : 'available'),
      enabled: true
    },
    {
      id: 'jobs' as NavigationStep,
      title: 'Jobs',
      description: 'Job tracking and applications',
      icon: Briefcase,
      status: currentStep === 'jobs' ? 'active' : 'available',
      enabled: true
    },
    {
      id: 'job-board' as NavigationStep,
      title: 'Job Board',
      description: 'Advanced job search and discovery',
      icon: Briefcase,
      status: currentStep === 'job-board' ? 'active' : 'available',
      enabled: true
    },
    {
      id: 'insights' as NavigationStep,
      title: 'Insights',
      description: 'Analytics and performance',
      icon: BarChart3,
      status: currentStep === 'insights' ? 'active' : 'available',
      enabled: resumeReady
    },
    {
      id: 'prep' as NavigationStep,
      title: 'Interview Prep',
      description: 'AI-powered practice and coaching',
      icon: MessageSquare,
      status: prepComplete ? 'completed' : (currentStep === 'prep' ? 'active' : 'available'),
      enabled: resumeReady
    },
    {
      id: 'interview' as NavigationStep,
      title: 'Live Interview',
      description: 'Real-time assistance during interviews',
      icon: Mic,
      status: currentStep === 'interview' ? 'active' : 'available',
      enabled: true
    },
    {
      id: 'other' as NavigationStep,
      title: 'Other',
      description: 'Additional tools and settings',
      icon: MoreHorizontal,
      status: currentStep === 'other' ? 'active' : 'available',
      enabled: true
    }
  ];

  const getStepStyle = (step: typeof steps[0]) => {
    switch (step.status) {
      case 'completed':
        return 'bg-green-50 border-green-200 text-green-700';
      case 'active':
        return 'bg-blue-50 border-blue-200 text-blue-700';
      default:
        return step.enabled ? 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300' : 'bg-gray-50 border-gray-200 text-gray-400';
    }
  };

  const getIconStyle = (step: typeof steps[0]) => {
    switch (step.status) {
      case 'completed':
        return 'text-green-600';
      case 'active':
        return 'text-blue-600';
      default:
        return step.enabled ? 'text-gray-600' : 'text-gray-400';
    }
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <div className={`hidden lg:fixed lg:left-0 lg:top-0 lg:h-full lg:bg-white lg:border-r lg:border-gray-200 lg:flex lg:flex-col transition-all duration-300 ${
        isCollapsed ? 'lg:w-16' : 'lg:w-64'
      }`}>
        {/* Header */}
        <div className={`border-b border-gray-200 ${isCollapsed ? 'p-3' : 'p-6'}`}>
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <h1 className="text-xl font-semibold text-gray-900">Layline</h1>
            )}
            <div className="flex items-center space-x-2">
              {!isCollapsed && <LoginButton />}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggle}
                className="p-1 h-8 w-8"
              >
                {isCollapsed ? (
                  <ChevronRight className="w-4 h-4" />
                ) : (
                  <ChevronLeft className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
          
          {/* Status indicators */}
          {!isCollapsed && (
            <div className="flex flex-wrap gap-2 mt-3">
              {resumeReady && (
                <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                  Resume Ready
                </Badge>
              )}
              {prepComplete && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs">
                  Prep Complete
                </Badge>
              )}
            </div>
          )}
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {steps.map((step) => {
              const Icon = step.icon;
              const isActive = step.id === currentStep;
              const isCompleted = step.status === 'completed';
              const isClickable = step.enabled;
              
              return (
                <Button
                  key={step.id}
                  variant="ghost"
                  className={`w-full ${isCollapsed ? 'justify-center px-2' : 'justify-start px-3'} py-3 h-auto ${
                    isActive 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : isCompleted 
                        ? 'text-green-700 hover:text-green-800 hover:bg-green-50'
                        : isClickable
                          ? 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                          : 'text-gray-400 cursor-not-allowed'
                  } ${!isClickable ? 'bg-gray-300' : ''}`}
                  onClick={() => isClickable && onStepChange(step.id)}
                  disabled={!isClickable}
                  title={isCollapsed ? step.title : undefined}
                >
                  {isCollapsed ? (
                    <div className="relative">
                      {isCompleted ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <Icon className="w-5 h-5" />
                      )}
                      {isCompleted && (
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"></div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center space-x-3 w-full">
                      <div className="relative">
                        {isCompleted ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : (
                          <Icon className="w-5 h-5" />
                        )}
                        {isCompleted && (
                          <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"></div>
                        )}
                      </div>
                      
                      <div className="flex-1 text-left min-w-0">
                        <div className="font-medium truncate">{step.title}</div>
                        <div className="text-xs opacity-70 mt-0.5 line-clamp-2">{step.description}</div>
                      </div>
                      
                      {isActive && (
                        <div className="w-1 h-8 bg-white rounded-full ml-auto"></div>
                      )}
                    </div>
                  )}
                </Button>
              );
            })}
          </div>
        </nav>
        
        {/* Footer */}
        {!isCollapsed && (
          <div className="p-4 border-t border-gray-200">
            <div className="text-xs text-gray-500 text-center">
              AI-Powered Interview Assistant
            </div>
          </div>
        )}
      </div>

      {/* Mobile/Tablet Navigation */}
      <div className="lg:hidden bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-3">
          <h1 className="text-lg font-semibold text-gray-900 mb-3">Interview Assistant</h1>
          
          {/* Mobile navigation tabs */}
          <div className="flex space-x-1 overflow-x-auto pb-1 scrollbar-hide">
            {steps.map((step) => {
              const Icon = step.icon;
              const isActive = step.id === currentStep;
              const isCompleted = step.status === 'completed';
              const isClickable = step.enabled;
              
              // Shortened titles for mobile
              const mobileTitle = step.title === 'Interview Prep' ? 'Prep' :
                                step.title === 'Live Interview' ? 'Live' :
                                step.title === 'Documents' ? 'Docs' :
                                step.title;
              
              return (
                <Button
                  key={step.id}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  className={`flex-shrink-0 px-2 py-2 min-w-[4rem] ${
                    isActive 
                      ? 'bg-blue-600 text-white' 
                      : isCompleted 
                        ? 'border-green-200 text-green-700'
                        : isClickable
                          ? 'text-gray-700'
                          : 'text-gray-400 cursor-not-allowed'
                  }`}
                  onClick={() => isClickable && onStepChange(step.id)}
                  disabled={!isClickable}
                >
                  <div className="flex flex-col items-center gap-1">
                    {isCompleted ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                    <span className="text-xs leading-none">{mobileTitle}</span>
                  </div>
                </Button>
              );
            })}
          </div>
          
          {/* Mobile status indicators */}
          <div className="flex gap-2 mt-3">
            {resumeReady && (
              <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                Resume Ready
              </Badge>
            )}
            {prepComplete && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs">
                Prep Complete
              </Badge>
            )}
          </div>
        </div>
      </div>
    </>
  );
}