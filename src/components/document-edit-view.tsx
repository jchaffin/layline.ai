"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Edit, Save, X, FileText } from 'lucide-react';
import PDFPreviewPane from '@/components/pdf/PDFPreviewPane';
import DraggableResumeBuilder from '@/components/pdf/DraggableResumeBuilder';

interface DocumentEditViewProps {
  document: any;
  onBack: () => void;
  onSave: (data: any) => void;
}

export default function DocumentEditView({ document, onBack, onSave }: DocumentEditViewProps) {
  const [isEditing, setIsEditing] = useState(true);
  const [resumeData, setResumeData] = useState(document.data);

  const handleSave = () => {
    onSave(resumeData);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="fixed inset-0 z-50 bg-gray-50">
        {/* Header with controls */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => setIsEditing(false)}
              size="sm"
            >
              <X className="w-4 h-4 mr-2" />
              Exit Edit Mode
            </Button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">{document.name}</h1>
              <p className="text-sm text-gray-500">Split view - Edit & Preview</p>
            </div>
          </div>

        </div>

        {/* 50/50 Split View */}
        <div className="flex pt-16" style={{ height: 'calc(100vh - 64px)' }}>
          {/* Left Side - Draggable Resume Builder */}
          <div className="w-1/2 border-r border-gray-300" style={{ height: '100%', overflowY: 'auto' }}>
            <DraggableResumeBuilder
              resumeData={resumeData}
              onDataChange={setResumeData}
              onSave={handleSave}
            />
          </div>
          
          {/* Right Side - PDF Preview */}
          <div className="w-1/2 bg-gray-50">
            {resumeData ? (
              <PDFPreviewPane 
                resumeData={resumeData}
                onClose={undefined}
                onEdit={undefined} // Hide edit button in split view
              />
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">No Preview Available</h3>
                  <p className="text-gray-500">Fill out the form to see preview</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-white">
      {/* Top Controls Bar */}
      <div className="absolute top-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 px-6 py-4 flex items-center justify-between z-40">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={onBack}
            size="sm"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Documents
          </Button>
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-gray-500" />
            <div>
              <h1 className="text-lg font-semibold text-gray-900">{document.name}</h1>
              <p className="text-sm text-gray-500">
                {document.type} • {document.size} • Last modified {new Date(document.uploadDate).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Full Viewport PDF Viewer */}
      <div className="pt-20 h-full w-full">
        {resumeData ? (
          <PDFPreviewPane 
            resumeData={resumeData}
            onClose={undefined} // Don't show close button since we're embedded
            onEdit={() => setIsEditing(true)}
          />
        ) : (
          <div className="h-full flex items-center justify-center bg-gray-100">
            <div className="text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No Resume Data</h3>
              <p className="text-gray-500 mb-4">
                Click "Edit Resume" to add content to this document
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
