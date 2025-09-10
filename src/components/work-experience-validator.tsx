'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Edit3, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WorkExperience {
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  duration: string;
  location: string;
  achievements: string[];
  responsibilities: string[];
  keywords: string[];
  isCurrentRole: boolean;
}

interface WorkExperienceValidatorProps {
  experiences: WorkExperience[];
  onUpdate: (experiences: WorkExperience[]) => void;
  originalText: string;
}

// Helper function to format dates
const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (!isNaN(date.getTime())) {
    return `${date.getMonth() + 1}/${date.getFullYear()}`;
  }
  return dateString;
};

export function WorkExperienceValidator({ experiences, onUpdate, originalText }: WorkExperienceValidatorProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [validationIssues, setValidationIssues] = useState<string[]>([]);
  const { toast } = useToast();

  const validateExperience = async () => {
    try {
      const response = await fetch('/api/resume/validate-parsing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parsedData: { experience: experiences },
          originalText
        })
      });

      if (response.ok) {
        const validation = await response.json();
        setValidationIssues(validation.issues || []);
        
        if (validation.isValid) {
          toast({
            title: "Validation Passed",
            description: "Work experience parsing looks good!",
          });
        } else {
          toast({
            title: "Validation Issues Found",
            description: `Found ${validation.issues.length} potential issues`,
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error('Validation error:', error);
    }
  };

  const updateExperience = (index: number, field: keyof WorkExperience, value: any) => {
    const updated = [...experiences];
    updated[index] = { ...updated[index], [field]: value };
    onUpdate(updated);
  };

  const saveEdit = () => {
    setEditingIndex(null);
    validateExperience();
    toast({
      title: "Experience Updated",
      description: "Work experience has been saved",
    });
  };

  const addNewExperience = () => {
    const newExp: WorkExperience = {
      company: '',
      role: '',
      startDate: '',
      endDate: '',
      duration: '',
      location: '',
      achievements: [],
      responsibilities: [],
      keywords: [],
      isCurrentRole: false
    };
    onUpdate([...experiences, newExp]);
    setEditingIndex(experiences.length);
  };

  const removeExperience = (index: number) => {
    const updated = experiences.filter((_, i) => i !== index);
    onUpdate(updated);
    setEditingIndex(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Edit3 className="w-5 h-5" />
          Work Experience Validation
        </CardTitle>
        {validationIssues.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-orange-800 mb-2">
              <AlertTriangle className="w-4 h-4" />
              <span className="font-medium">Parsing Issues Detected</span>
            </div>
            <ul className="text-sm text-orange-700 space-y-1">
              {validationIssues.map((issue, index) => (
                <li key={index}>• {issue}</li>
              ))}
            </ul>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {experiences.map((exp, index) => (
          <div key={index} className="border rounded-lg p-4 space-y-4">
            {editingIndex === index ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Company Name</Label>
                    <Input
                      value={exp.company}
                      onChange={(e) => updateExperience(index, 'company', e.target.value)}
                      placeholder="Company name"
                    />
                  </div>
                  <div>
                    <Label>Job Title</Label>
                    <Input
                      value={exp.role}
                      onChange={(e) => updateExperience(index, 'role', e.target.value)}
                      placeholder="Job title"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Start Date</Label>
                    <Input
                      value={exp.startDate}
                      onChange={(e) => updateExperience(index, 'startDate', e.target.value)}
                      placeholder="MM/YYYY"
                    />
                  </div>
                  <div>
                    <Label>End Date</Label>
                    <Input
                      value={exp.endDate}
                      onChange={(e) => updateExperience(index, 'endDate', e.target.value)}
                      placeholder="MM/YYYY or Present"
                    />
                  </div>
                  <div>
                    <Label>Location</Label>
                    <Input
                      value={exp.location}
                      onChange={(e) => updateExperience(index, 'location', e.target.value)}
                      placeholder="City, State"
                    />
                  </div>
                </div>

                <div>
                  <Label>Key Achievements</Label>
                  <Textarea
                    value={exp.achievements.join('\n')}
                    onChange={(e) => updateExperience(index, 'achievements', e.target.value.split('\n').filter(a => a.trim()))}
                    placeholder="Enter each achievement on a new line"
                    rows={3}
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={saveEdit} size="sm">
                    <Save className="w-4 h-4 mr-1" />
                    Save
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setEditingIndex(null)} 
                    size="sm"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Cancel
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={() => removeExperience(index)} 
                    size="sm"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-lg">{exp.role || 'No title'}</h3>
                    <p className="text-gray-600">{exp.company || 'No company'}</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setEditingIndex(index)}
                  >
                    <Edit3 className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                  <div>
                    <strong>Duration:</strong> {exp.isCurrentRole ? `${formatDate(exp.startDate)} - Present` : `${formatDate(exp.startDate)} - ${formatDate(exp.endDate)}`}
                  </div>
                  <div>
                    <strong>Location:</strong> {exp.location || 'Not specified'}
                  </div>
                </div>

                {exp.achievements.length > 0 && (
                  <div className="mb-3">
                    <strong className="text-sm">Key Achievements:</strong>
                    <div className="text-sm text-gray-700 mt-1 space-y-2">
                      {exp.achievements.map((achievement, i) => (
                        <div key={i} className="flex items-start">
                          <span className="mr-2 mt-1 text-gray-600">•</span>
                          <div className="flex-1 leading-relaxed whitespace-pre-line">{achievement}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {exp.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {exp.keywords.map((keyword, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        <div className="flex gap-2">
          <Button onClick={addNewExperience} variant="outline">
            Add Experience
          </Button>
          <Button onClick={validateExperience} variant="outline">
            <CheckCircle className="w-4 h-4 mr-1" />
            Validate Parsing
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}