"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Eye, EyeOff, FileText, Briefcase } from "lucide-react";
import ResumeUpload from "@/components/resume/ResumeUpload";
import PDFPreviewPane from "@/components/resume/PDFPreviewPane";
import type { ParsedResume } from "@/lib/schema";

interface ResumeUploadWithPreviewProps {
  onResumeUploaded: (resume: ParsedResume | null) => void;
  currentResume: ParsedResume | null;
  autoParseExisting?: boolean;
  onNavigateToJobs: () => void;
  onNavigateToDocs?: () => void;
}

function isResumeReady(r: ParsedResume | null): boolean {
  return !!(
    r?.summary &&
    (r.contact?.name || r.contact?.email) &&
    r.experience?.length
  );
}

export default function ResumeUploadWithPreview({
  onResumeUploaded,
  currentResume,
  onNavigateToJobs,
}: ResumeUploadWithPreviewProps) {
  const [showPreview, setShowPreview] = useState(true);
  const ready = isResumeReady(currentResume);

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Upload form */}
      <div className="flex-1 min-w-0 space-y-6">
        <ResumeUpload
          onResumeUploaded={onResumeUploaded}
          currentResume={currentResume}
        />

        {ready && (
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-500/10 text-green-600 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">Resume processed</p>
                  <p className="text-xs text-muted-foreground">
                    Ready for job matching and interview prep
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={onNavigateToJobs}>
                  <Briefcase className="w-4 h-4 mr-1" />
                  Match Jobs
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowPreview((p) => !p)}
                >
                  {showPreview ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Preview panel */}
      {showPreview && ready && currentResume && (
        <div className="lg:w-[480px] shrink-0 border rounded-xl overflow-hidden bg-card">
          <PDFPreviewPane
            resumeData={currentResume as unknown as Record<string, unknown>}
            onClose={() => setShowPreview(false)}
          />
        </div>
      )}
    </div>
  );
}
