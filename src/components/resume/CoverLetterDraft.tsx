import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/Dialog';
import { FileText, Sparkles, Download, Copy, Save } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

interface CoverLetterDraftProps {
  resumeData?: any;
  jobDescription?: string;
  companyName?: string;
  jobTitle?: string;
}

export default function CoverLetterDraft({
  resumeData,
  jobDescription,
  companyName = '',
  jobTitle = ''
}: CoverLetterDraftProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState({
    recipientName: '',
    companyName: companyName,
    jobTitle: jobTitle,
    jobDescription: jobDescription || '',
    tone: 'professional',
    experience: resumeData?.experience?.[0]?.role || '',
    skills: resumeData?.skills?.slice(0, 5).join(', ') || ''
  });
  const [coverLetter, setCoverLetter] = useState('');

  const generateCoverLetter = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/cover-letter/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          resumeData
        })
      });

      if (!response.ok) throw new Error('Failed to generate cover letter');
      
      const data = await response.json();
      setCoverLetter(data.coverLetter);
      toast({
        title: "Cover letter generated!",
        description: "Your personalized cover letter is ready."
      });
    } catch (error) {
      console.error('Error generating cover letter:', error);
      // Fallback template if API fails
      const fallbackTemplate = generateFallbackTemplate();
      setCoverLetter(fallbackTemplate);
      toast({
        title: "Cover letter created",
        description: "Using template format - you can customize it further."
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateFallbackTemplate = () => {
    const today = new Date().toLocaleDateString();
    const applicantName = resumeData?.contact?.name || resumeData?.contact?.firstName + ' ' + resumeData?.contact?.lastName || '[Your Name]';
    const applicantEmail = resumeData?.contact?.email || '[Your Email]';
    const applicantPhone = resumeData?.contact?.phone || '[Your Phone]';
    
    return `${today}

${formData.recipientName || '[Hiring Manager Name]'}
${formData.companyName || '[Company Name]'}

Dear ${formData.recipientName || 'Hiring Manager'},

I am writing to express my strong interest in the ${formData.jobTitle || '[Job Title]'} position at ${formData.companyName || '[Company Name]'}. With my background in ${formData.experience || '[Your Field]'} and expertise in ${formData.skills || '[Your Key Skills]'}, I am excited about the opportunity to contribute to your team.

In my previous role, I have successfully [describe relevant achievement or experience]. My skills in ${formData.skills || '[Your Skills]'} align perfectly with the requirements outlined in your job posting.

What particularly attracts me to ${formData.companyName || '[Company Name]'} is [mention something specific about the company or role]. I am eager to bring my passion for [relevant field/technology] and my proven track record of [relevant achievement] to help drive your team's success.

I would welcome the opportunity to discuss how my background and enthusiasm can contribute to ${formData.companyName || '[Company Name]'}. Thank you for considering my application.

Sincerely,
${applicantName}
${applicantEmail}
${applicantPhone}`;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(coverLetter);
    toast({
      title: "Copied to clipboard",
      description: "Cover letter text has been copied."
    });
  };

  const downloadAsText = () => {
    const blob = new Blob([coverLetter], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cover-letter-${formData.companyName || 'draft'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 border-blue-200"
        >
          <FileText className="w-4 h-4" />
          Draft Cover Letter
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Draft Cover Letter
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Form */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Job Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label htmlFor="company">Company Name</Label>
                  <Input
                    id="company"
                    value={formData.companyName}
                    onChange={(e) => setFormData(prev => ({...prev, companyName: e.target.value}))}
                    placeholder="e.g., Google, Microsoft"
                  />
                </div>
                
                <div>
                  <Label htmlFor="jobTitle">Job Title</Label>
                  <Input
                    id="jobTitle"
                    value={formData.jobTitle}
                    onChange={(e) => setFormData(prev => ({...prev, jobTitle: e.target.value}))}
                    placeholder="e.g., Software Engineer"
                  />
                </div>
                
                <div>
                  <Label htmlFor="recipient">Recipient Name (Optional)</Label>
                  <Input
                    id="recipient"
                    value={formData.recipientName}
                    onChange={(e) => setFormData(prev => ({...prev, recipientName: e.target.value}))}
                    placeholder="e.g., John Smith"
                  />
                </div>
                
                <div>
                  <Label htmlFor="jobDesc">Job Description (Optional)</Label>
                  <Textarea
                    id="jobDesc"
                    value={formData.jobDescription}
                    onChange={(e) => setFormData(prev => ({...prev, jobDescription: e.target.value}))}
                    placeholder="Paste the job description here for better personalization..."
                    rows={4}
                  />
                </div>
                
                <Button 
                  onClick={generateCoverLetter}
                  disabled={isGenerating || !formData.companyName || !formData.jobTitle}
                  className="w-full"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Cover Letter
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
          
          {/* Cover Letter Preview */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center justify-between">
                  Cover Letter Preview
                  {coverLetter && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={copyToClipboard}>
                        <Copy className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={downloadAsText}>
                        <Download className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {coverLetter ? (
                  <Textarea
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    rows={20}
                    className="font-mono text-sm"
                    placeholder="Your cover letter will appear here..."
                  />
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Fill in the job details and click "Generate Cover Letter" to create your personalized cover letter.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
