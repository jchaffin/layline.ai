"use client";

import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  GripVertical, 
  Plus, 
  Trash2, 
  User, 
  Briefcase, 
  GraduationCap, 
  Award,
  Mail,
  Phone,
  MapPin,
  Globe,
  Calendar,
  X,
  Sparkles,
  Wand2,
  Save,
  ChevronDown,
  ChevronUp,
  Target,
  CheckCircle,
  AlertCircle,
  TrendingUp
} from 'lucide-react';
import SimpleDatePicker from '@/components/ui/UnifiedDatePicker';
import { GooglePlacesAutocomplete } from '@/components/AutoComplete';
import { RichTextEditor } from '@/components/rich-text-editor';

interface DraggableResumeBuilderProps {
  resumeData: any;
  onDataChange: (data: any) => void;
  onSave?: () => void;
  readOnly?: boolean;
}

interface ResumeSection {
  id: string;
  type: 'contact' | 'summary' | 'experience' | 'education' | 'skills' | 'custom';
  title: string;
  data: any;
}

// Draggable wrapper component
function SortableItem({ id, children }: { id: string; children: React.ReactNode }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="group relative">
      <div className="absolute left-2 top-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <div 
          {...attributes} 
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-gray-100"
        >
          <GripVertical className="w-4 h-4 text-gray-400" />
        </div>
      </div>
      <div className="pl-8">
        {children}
      </div>
    </div>
  );
}

// Contact Section Component
function ContactSection({ data, onUpdate, onDelete }: { data: any; onUpdate: (data: any) => void; onDelete: () => void }) {
  const contact = data || {};
  const [isCollapsed, setIsCollapsed] = useState(false);

  const updateField = (field: string, value: any) => {
    onUpdate({ ...contact, [field]: value });
  };

  return (
    <Card className="mb-4">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          <User className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Contact Information</h3>
        </div>
        <div className="flex items-center space-x-1">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-gray-500 hover:text-gray-700"
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </Button>
          <Button variant="ghost" size="sm" onClick={onDelete} className="text-red-500 hover:text-red-700">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      {!isCollapsed && (
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Full Name</Label>
            <Input
              value={contact.name || ''}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="Your full name"
            />
          </div>
          <div>
            <Label>Job Title</Label>
            <Input
              value={contact.title || ''}
              onChange={(e) => updateField('title', e.target.value)}
              placeholder="e.g. Senior Software Engineer"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Email</Label>
            <Input
              type="email"
              value={contact.email || ''}
              onChange={(e) => updateField('email', e.target.value)}
              placeholder="your.email@example.com"
            />
          </div>
          <div>
            <Label>Phone</Label>
            <Input
              value={contact.phone || ''}
              onChange={(e) => updateField('phone', e.target.value)}
              placeholder="(555) 123-4567"
            />
          </div>
        </div>

        <div>
          <Label>Location</Label>
          <GooglePlacesAutocomplete
            value={contact.location || ''}
            onChange={(value) => updateField('location', value)}
            placeholder="City, State or Country"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Website</Label>
            <Input
              value={contact.website || ''}
              onChange={(e) => updateField('website', e.target.value)}
              placeholder="https://yourwebsite.com"
            />
          </div>
          <div>
            <Label>LinkedIn</Label>
            <Input
              value={contact.linkedin || ''}
              onChange={(e) => updateField('linkedin', e.target.value)}
              placeholder="linkedin.com/in/username"
            />
          </div>
        </div>
      </CardContent>
      )}
    </Card>
  );
}

// Summary Section Component
function SummarySection({ data, onUpdate, onDelete }: { data: any; onUpdate: (data: any) => void; onDelete: () => void }) {
  const [isImproving, setIsImproving] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const improveSummaryWithAI = async () => {
    if (!data || data.trim() === '') {
      return;
    }

    setIsImproving(true);
    try {
      const response = await fetch('/api/resume/improve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          section: 'summary',
          content: data,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.improvedContent) {
          onUpdate(result.improvedContent);
        }
      }
    } catch (error) {
      console.error('Error improving summary:', error);
    } finally {
      setIsImproving(false);
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          <User className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-semibold">Professional Summary</h3>
        </div>
        <div className="flex items-center space-x-1">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-gray-500 hover:text-gray-700"
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </Button>
          <Button variant="ghost" size="sm" onClick={onDelete} className="text-red-500 hover:text-red-700">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      {!isCollapsed && (
      <CardContent className="space-y-4">
        <RichTextEditor
          value={data || ''}
          onChange={onUpdate}
          placeholder="Write a compelling 2-3 sentence summary of your professional background and key strengths..."
          showWordCount={true}
          showAIButton={true}
          onAIClick={improveSummaryWithAI}
          minHeight="120px"
        />
        
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Focus on your most relevant experience and achievements for the role you're targeting.
          </p>
          
          <Button
            onClick={improveSummaryWithAI}
            variant="outline"
            size="sm"
            className="text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300"
            disabled={isImproving || !data || data.trim() === ''}
          >
            {isImproving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                Improving...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Write with AI
              </>
            )}
          </Button>
        </div>
      </CardContent>
      )}
    </Card>
  );
}

// Skills Section Component
function SkillsSection({ data, onUpdate, onDelete }: { data: any; onUpdate: (data: any) => void; onDelete: () => void }) {
  const skills = data || [];
  const [newSkill, setNewSkill] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);

  const addSkill = () => {
    if (newSkill.trim()) {
      onUpdate([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const removeSkill = (index: number) => {
    onUpdate(skills.filter((_: any, i: number) => i !== index));
  };

  return (
    <Card className="mb-4">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          <Award className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold">Skills</h3>
        </div>
        <div className="flex items-center space-x-1">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-gray-500 hover:text-gray-700"
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </Button>
          <Button variant="ghost" size="sm" onClick={onDelete} className="text-red-500 hover:text-red-700">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      {!isCollapsed && (
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            placeholder="Add a skill..."
            onKeyPress={(e) => e.key === 'Enter' && addSkill()}
            className="flex-1"
          />
          <Button onClick={addSkill} size="sm">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {skills.map((skill: string, index: number) => (
            <Badge key={index} variant="secondary" className="text-sm py-1 px-3">
              {skill}
              <button
                onClick={() => removeSkill(index)}
                className="ml-2 text-gray-500 hover:text-red-500"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
        
        {skills.length === 0 && (
          <p className="text-gray-500 text-sm italic">No skills added yet. Add your key technical and soft skills.</p>
        )}
      </CardContent>
      )}
    </Card>
  );
}

// Experience Item Component (individual draggable experience)
function ExperienceItem({ 
  experience, 
  onUpdate, 
  onDelete 
}: { 
  experience: any; 
  onUpdate: (exp: any) => void; 
  onDelete: () => void;
}) {
  const [isImproving, setIsImproving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const updateField = (field: string, value: any) => {
    onUpdate({ ...experience, [field]: value });
    if (field === 'description') {
      setHasUnsavedChanges(true);
    }
  };

  const improveDescriptionWithAI = async () => {
    if (!experience.description || experience.description.trim() === '') {
      return;
    }

    setIsImproving(true);
    try {
      const response = await fetch('/api/resume/improve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          section: 'experience',
          content: experience.description,
          context: {
            role: experience.role,
            company: experience.company
          }
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.improvedContent) {
          updateField('description', result.improvedContent);
          setHasUnsavedChanges(true);
        }
      }
    } catch (error) {
      console.error('Error improving description:', error);
    } finally {
      setIsImproving(false);
    }
  };

  const saveChanges = () => {
    // Here you could add additional save logic if needed
    setHasUnsavedChanges(false);
  };

  return (
    <Card className="mb-4 border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <h4 className="text-lg font-semibold">{experience.role || 'New Position'}</h4>
          <div className="flex items-center space-x-1">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="text-gray-500 hover:text-gray-700"
            >
              {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={onDelete} className="text-red-500 hover:text-red-700">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      {!isCollapsed && (
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Company</Label>
            <Input
              value={experience.company || ''}
              onChange={(e) => updateField('company', e.target.value)}
              placeholder="Company name"
            />
          </div>
          <div>
            <Label>Job Title</Label>
            <Input
              value={experience.role || ''}
              onChange={(e) => updateField('role', e.target.value)}
              placeholder="Your role"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label className="flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              Start Date
            </Label>
            <SimpleDatePicker
              value={experience.startDate}
              onChange={(date) => updateField('startDate', date)}
              placeholder="Start date"
            />
          </div>
          <div>
            <Label className="flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              End Date
            </Label>
            {experience.isCurrentRole ? (
              <div className="h-10 px-3 border border-input bg-muted rounded-md flex items-center text-sm text-muted-foreground">
                Present
              </div>
            ) : (
              <SimpleDatePicker
                value={experience.endDate}
                onChange={(date) => updateField('endDate', date)}
                placeholder="End date"
              />
            )}
          </div>
          <div className="flex items-end">
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={experience.isCurrentRole || false}
                onChange={(e) => updateField('isCurrentRole', e.target.checked)}
                className="rounded border-gray-300"
              />
              <span>Current role</span>
            </label>
          </div>
        </div>

        <div>
          <Label className="flex items-center">
            <MapPin className="w-4 h-4 mr-1" />
            Location
          </Label>
          <GooglePlacesAutocomplete
            value={experience.location || ''}
            onChange={(value) => updateField('location', value)}
            placeholder="City, State"
          />
        </div>

        <div>
          <Label>Description & Achievements</Label>
          <Textarea
            value={experience.description || ''}
            onChange={(e) => updateField('description', e.target.value)}
            placeholder="• Led development of new features for mobile app&#10;• Managed team of 5 developers across 3 projects&#10;• Improved application performance by 40%"
            className="min-h-[100px] resize-none font-mono text-sm"
            rows={4}
          />
          
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-gray-500">
              Use bullet points (•) to list your key achievements and responsibilities.
            </p>
            
            <div className="flex gap-2">
              <Button
                onClick={improveDescriptionWithAI}
                variant="outline"
                size="sm"
                className="text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300"
                disabled={isImproving || !experience.description || experience.description.trim() === ''}
              >
                {isImproving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    Improving...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Improve with AI
                  </>
                )}
              </Button>
              
              {hasUnsavedChanges && (
                <Button
                  onClick={saveChanges}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Wand2 className="w-4 h-4 mr-2" />
                  Save
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
      )}
    </Card>
  );
}

// Custom Section Component
function CustomSection({ data, onUpdate, onDelete }: { data: any; onUpdate: (data: any) => void; onDelete: () => void }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  
  const updateField = (field: string, value: any) => {
    onUpdate({ ...data, [field]: value });
  };

  const handleTitleSave = () => {
    setIsEditingTitle(false);
  };

  // If this is a header section, render it differently
  if (data.isHeader) {
    return (
      <div className="mb-6 mt-8 first:mt-0">
        <div className="flex items-center space-x-3 border-b-2 border-gray-300 pb-2">
          {data.title === 'Work Experience' && <Briefcase className="w-6 h-6 text-blue-600" />}
          {data.title === 'Education' && <GraduationCap className="w-6 h-6 text-green-600" />}
          <h2 className="text-2xl font-bold text-gray-900">{data.title}</h2>
        </div>
      </div>
    );
  }



  return (
    <Card className="mb-4 border-l-4 border-l-orange-500">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          {isEditingTitle ? (
            <div className="flex items-center space-x-2 flex-1">
              <Input
                value={data.title || 'New Section'}
                onChange={(e) => updateField('title', e.target.value)}
                onBlur={handleTitleSave}
                onKeyPress={(e) => e.key === 'Enter' && handleTitleSave()}
                className="text-lg font-semibold border-none p-0 h-auto focus:ring-0"
                autoFocus
              />
            </div>
          ) : (
            <h4 
              className="text-lg font-semibold cursor-pointer hover:text-blue-600"
              onClick={() => setIsEditingTitle(true)}
            >
              {data.title || 'New Section'}
            </h4>
          )}
          <div className="flex items-center space-x-1">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="text-gray-500 hover:text-gray-700"
            >
              {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={onDelete} className="text-red-500 hover:text-red-700">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      {!isCollapsed && (
      <CardContent className="space-y-4">
        <div>
          <Label>Content</Label>
          <Textarea
            value={data.content || ''}
            onChange={(e) => updateField('content', e.target.value)}
            placeholder="Add content for this section..."
            className="min-h-[120px] resize-none"
            rows={5}
          />
        </div>
      </CardContent>
      )}
    </Card>
  );
}

// ATS Rating Section Component (Fixed, Non-sortable)
function ATSRatingSection({ resumeData, onDataChange }: { resumeData: any; onDataChange: (data: any) => void }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isImproving, setIsImproving] = useState(false);
  const atsScore = parseInt(resumeData?.ats_score || '0');
  const recommendations = resumeData?.ats_recommendations || [];

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="w-5 h-5 text-green-600" />;
    if (score >= 60) return <TrendingUp className="w-5 h-5 text-yellow-600" />;
    return <AlertCircle className="w-5 h-5 text-red-600" />;
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    return 'Needs Improvement';
  };

  const improveATSWithAI = async () => {
    setIsImproving(true);
    try {
      const response = await fetch('/api/resume/improve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeData: resumeData,
          focusArea: 'ats_optimization'
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.data) {
          onDataChange(result.data);
        }
      }
    } catch (error) {
      console.error('Error improving ATS score:', error);
    } finally {
      setIsImproving(false);
    }
  };

  return (
    <Card className="mb-6 border-l-4 border-l-purple-500 bg-purple-50/30">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          <Target className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold">ATS Compatibility Analysis</h3>
          <Badge variant="secondary" className="bg-purple-100 text-purple-700">
            Auto-Generated
          </Badge>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={improveATSWithAI}
            variant="outline"
            size="sm"
            className="text-purple-600 hover:text-purple-700 border-purple-200 hover:border-purple-300"
            disabled={isImproving}
          >
            {isImproving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 mr-2"></div>
                Improving...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Improve with AI
              </>
            )}
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-gray-500 hover:text-gray-700"
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </Button>
        </div>
      </CardHeader>
      {!isCollapsed && (
      <CardContent className="space-y-4">
        {/* ATS Score Display */}
        <div className={`rounded-lg p-4 border-2 ${getScoreColor(atsScore)}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              {getScoreIcon(atsScore)}
              <div>
                <div className="text-2xl font-bold">{atsScore}%</div>
                <div className="text-sm font-medium">{getScoreLabel(atsScore)}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-600">ATS Score</div>
              <div className="text-xs text-gray-500">Applicant Tracking System</div>
            </div>
          </div>
          
          {/* Score Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                atsScore >= 80 ? 'bg-green-500' : 
                atsScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(atsScore, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">
              Recommendations for Improvement:
            </Label>
            <div className="space-y-2">
              {recommendations.map((rec: string, index: number) => (
                <div key={index} className="flex items-start space-x-2 p-2 bg-blue-50 rounded-md">
                  <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-blue-800">{rec}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-md">
          <strong>About ATS Compatibility:</strong> This score indicates how well your resume will be parsed by Applicant Tracking Systems (ATS) used by employers. Higher scores mean better keyword matching, formatting, and structure.
        </div>
      </CardContent>
      )}
    </Card>
  );
}

// Education Item Component
function EducationItem({ 
  education, 
  onUpdate, 
  onDelete 
}: { 
  education: any; 
  onUpdate: (edu: any) => void; 
  onDelete: () => void;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const updateField = (field: string, value: any) => {
    onUpdate({ ...education, [field]: value });
  };

  return (
    <Card className="mb-4 border-l-4 border-l-green-500">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <h4 className="text-lg font-semibold">{education.degree || 'New Education'}</h4>
          <div className="flex items-center space-x-1">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="text-gray-500 hover:text-gray-700"
            >
              {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={onDelete} className="text-red-500 hover:text-red-700">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      {!isCollapsed && (
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Institution</Label>
            <Input
              value={education.institution || ''}
              onChange={(e) => updateField('institution', e.target.value)}
              placeholder="University or School name"
            />
          </div>
          <div>
            <Label>Year</Label>
            <Input
              value={education.year || ''}
              onChange={(e) => updateField('year', e.target.value)}
              placeholder="2024"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Degree</Label>
            <div className="relative">
              <Input
                value={education.degree || ''}
                onChange={(e) => updateField('degree', e.target.value)}
                placeholder="Bachelor of Science"
                list="degree-options"
              />
              <datalist id="degree-options">
                <option value="Associate of Arts (AA)" />
                <option value="Associate of Science (AS)" />
                <option value="Associate of Applied Science (AAS)" />
                <option value="Bachelor of Arts (BA)" />
                <option value="Bachelor of Science (BS)" />
                <option value="Bachelor of Business Administration (BBA)" />
                <option value="Bachelor of Engineering (BE)" />
                <option value="Bachelor of Technology (B.Tech)" />
                <option value="Bachelor of Fine Arts (BFA)" />
                <option value="Bachelor of Music (BM)" />
                <option value="Bachelor of Education (B.Ed)" />
                <option value="Master of Arts (MA)" />
                <option value="Master of Science (MS)" />
                <option value="Master of Business Administration (MBA)" />
                <option value="Master of Engineering (MEng)" />
                <option value="Master of Technology (M.Tech)" />
                <option value="Master of Fine Arts (MFA)" />
                <option value="Master of Education (M.Ed)" />
                <option value="Master of Public Health (MPH)" />
                <option value="Master of Social Work (MSW)" />
                <option value="Juris Doctor (JD)" />
                <option value="Doctor of Medicine (MD)" />
                <option value="Doctor of Philosophy (PhD)" />
                <option value="Doctor of Education (Ed.D)" />
                <option value="Doctor of Psychology (Psy.D)" />
                <option value="Doctor of Dental Surgery (DDS)" />
                <option value="Doctor of Veterinary Medicine (DVM)" />
                <option value="Certificate" />
                <option value="Diploma" />
                <option value="Professional Certificate" />
                <option value="High School Diploma" />
                <option value="GED" />
              </datalist>
            </div>
          </div>
          <div>
            <Label>Field of Study</Label>
            <Input
              value={education.field || ''}
              onChange={(e) => updateField('field', e.target.value)}
              placeholder="Computer Science"
            />
          </div>
        </div>
      </CardContent>
      )}
    </Card>
  );
}

export default function DraggableResumeBuilder({ resumeData, onDataChange, onSave, readOnly = false }: DraggableResumeBuilderProps) {
  // Initialize sections from resumeData
  const initializeSections = (): ResumeSection[] => {
    const sections: ResumeSection[] = [];
    
    if (resumeData?.contact || true) {
      sections.push({
        id: 'contact',
        type: 'contact',
        title: 'Contact Information',
        data: resumeData?.contact || {}
      });
    }
    
    if (resumeData?.summary || true) {
      sections.push({
        id: 'summary',
        type: 'summary',
        title: 'Professional Summary',
        data: resumeData?.summary || ''
      });
    }

    if (resumeData?.skills || true) {
      sections.push({
        id: 'skills',
        type: 'skills',
        title: 'Skills',
        data: resumeData?.skills || []
      });
    }



    // Work Experience Section Header
    if ((resumeData?.experience && resumeData.experience.length > 0) || true) {
      sections.push({
        id: 'work-experience-header',
        type: 'custom',
        title: 'Work Experience',
        data: { title: 'Work Experience', content: '', isHeader: true }
      });
    }

    // Individual experience items
    const experiences = resumeData?.experience || [];
    experiences.forEach((exp: any, index: number) => {
      sections.push({
        id: `experience-${index}`,
        type: 'experience',
        title: `${exp.role || 'New Position'}`,
        data: exp
      });
    });

    // Education Section Header
    if ((resumeData?.education && resumeData.education.length > 0) || true) {
      sections.push({
        id: 'education-header',
        type: 'custom',
        title: 'Education',
        data: { title: 'Education', content: '', isHeader: true }
      });
    }

    // Individual education items
    const educations = resumeData?.education || [];
    educations.forEach((edu: any, index: number) => {
      sections.push({
        id: `education-${index}`,
        type: 'education',
        title: `${edu.degree || 'New Education'}`,
        data: edu
      });
    });

    return sections;
  };

  const [sections, setSections] = useState<ResumeSection[]>(initializeSections());

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Update resume data when sections change
  const updateResumeData = (newSections: ResumeSection[]) => {
    const newResumeData = { ...resumeData };
    
    // Reset arrays
    newResumeData.experience = [];
    newResumeData.education = [];
    
    newSections.forEach(section => {
      switch (section.type) {
        case 'contact':
          newResumeData.contact = section.data;
          break;
        case 'summary':
          newResumeData.summary = section.data;
          break;
        case 'skills':
          newResumeData.skills = section.data;
          break;
        case 'experience':
          newResumeData.experience.push(section.data);
          break;
        case 'education':
          newResumeData.education.push(section.data);
          break;
        case 'custom':
          // Handle custom sections (headers, etc.)
          break;
      }
    });
    
    onDataChange(newResumeData);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sections.findIndex(section => section.id === active.id);
      const newIndex = sections.findIndex(section => section.id === over.id);
      
      const newSections = arrayMove(sections, oldIndex, newIndex);
      setSections(newSections);
      updateResumeData(newSections);
    }
  };

  const updateSection = (id: string, data: any) => {
    const newSections = sections.map(section => 
      section.id === id ? { ...section, data } : section
    );
    setSections(newSections);
    updateResumeData(newSections);
  };

  const deleteSection = (id: string) => {
    const newSections = sections.filter(section => section.id !== id);
    setSections(newSections);
    updateResumeData(newSections);
  };

  const addSection = (type: 'experience' | 'education' | 'custom') => {
    const newId = `${type}-${Date.now()}`;
    const defaultData = type === 'experience' 
      ? {
          company: '',
          role: '',
          startDate: new Date(),
          endDate: undefined,
          isCurrentRole: false,
          location: '',
          description: ''
        }
      : type === 'education'
      ? {
          institution: '',
          degree: '',
          field: '',
          year: ''
        }
      : {
          title: 'New Section',
          content: ''
        };

    const newSection: ResumeSection = {
      id: newId,
      type: type as 'contact' | 'summary' | 'experience' | 'education' | 'skills' | 'custom',
      title: type === 'experience' ? 'New Experience' : type === 'education' ? 'New Education' : 'New Section',
      data: defaultData
    };

    let insertIndex = sections.length;
    
    // For experience, insert before the first education section
    if (type === 'experience') {
      const firstEducationIndex = sections.findIndex(section => section.type === 'education');
      if (firstEducationIndex !== -1) {
        insertIndex = firstEducationIndex;
      }
    }

    const newSections = [
      ...sections.slice(0, insertIndex),
      newSection,
      ...sections.slice(insertIndex)
    ];
    setSections(newSections);
    updateResumeData(newSections);
  };

  const renderSection = (section: ResumeSection) => {
    switch (section.type) {
      case 'contact':
        return (
          <ContactSection
            data={section.data}
            onUpdate={readOnly ? () => {} : (data) => updateSection(section.id, data)}
            onDelete={readOnly ? () => {} : () => deleteSection(section.id)}
          />
        );
      case 'summary':
        return (
          <SummarySection
            data={section.data}
            onUpdate={readOnly ? () => {} : (data) => updateSection(section.id, data)}
            onDelete={readOnly ? () => {} : () => deleteSection(section.id)}
          />
        );
      case 'skills':
        return (
          <SkillsSection
            data={section.data}
            onUpdate={readOnly ? () => {} : (data) => updateSection(section.id, data)}
            onDelete={readOnly ? () => {} : () => deleteSection(section.id)}
          />
        );
      case 'experience':
        return (
          <ExperienceItem
            experience={section.data}
            onUpdate={readOnly ? () => {} : (data) => updateSection(section.id, data)}
            onDelete={readOnly ? () => {} : () => deleteSection(section.id)}
          />
        );
      case 'education':
        return (
          <EducationItem
            education={section.data}
            onUpdate={readOnly ? () => {} : (data) => updateSection(section.id, data)}
            onDelete={readOnly ? () => {} : () => deleteSection(section.id)}
          />
        );
      case 'custom':
        return (
          <CustomSection
            data={section.data}
            onUpdate={readOnly ? () => {} : (data) => updateSection(section.id, data)}
            onDelete={readOnly ? () => {} : () => deleteSection(section.id)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className={readOnly ? "p-4" : "bg-gray-50 p-6"}>
      <div className="max-w-4xl mx-auto">
        {!readOnly && (
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Resume Builder</h1>
            <p className="text-gray-600">Drag and drop sections to reorder. All fields are editable.</p>
          </div>
        )}

        {readOnly ? (
          // Read-only mode: no drag and drop
          <div>
            {sections.map((section) => (
              <div key={section.id}>
                {renderSection(section)}
              </div>
            ))}
          </div>
        ) : (
          // Edit mode: with drag and drop
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
              {sections.map((section) => (
                <SortableItem key={section.id} id={section.id}>
                  {renderSection(section)}
                </SortableItem>
              ))}
            </SortableContext>
          </DndContext>
        )}
        
        {!readOnly && (
          <>
            {/* Add New Section */}
            <div className="mt-6">
              <Card className="border-dashed border-2 border-gray-300 hover:border-blue-400 transition-colors">
                <CardContent className="p-6">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-700 mb-4">Add New Section</h3>
                    <div className="flex flex-wrap justify-center gap-2">
                      <Button 
                        onClick={() => addSection('experience')} 
                        variant="outline" 
                        size="sm"
                        className="border-blue-200 text-blue-600 hover:bg-blue-50"
                      >
                        <Briefcase className="w-4 h-4 mr-2" />
                        Experience
                      </Button>
                      <Button 
                        onClick={() => addSection('education')} 
                        variant="outline" 
                        size="sm"
                        className="border-green-200 text-green-600 hover:bg-green-50"
                      >
                        <GraduationCap className="w-4 h-4 mr-2" />
                        Education
                      </Button>
                      <Button 
                        onClick={() => addSection('custom')} 
                        variant="outline" 
                        size="sm"
                        className="border-orange-200 text-orange-600 hover:bg-orange-50"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Custom Section
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Bottom Save Button */}
            <div className="mt-8 pt-6 border-t border-gray-200 bg-white rounded-lg shadow-sm">
              <div className="flex justify-center">
                <Button
                  onClick={onSave}
                  size="lg"
                  className="bg-green-600 hover:bg-green-700 px-8 py-3 text-base font-semibold"
                >
                  <Save className="w-5 h-5 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Fixed ATS Rating Section - Only show if there's resume data */}
        {(resumeData?.ats_score || resumeData?.ats_recommendations) && (
          <div className="mt-6">
            <ATSRatingSection
              resumeData={resumeData}
              onDataChange={onDataChange}
            />
          </div>
        )}
      </div>
    </div>
  );
}
