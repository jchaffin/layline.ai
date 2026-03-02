"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Download, 
  Eye, 
  Trash2, 
  Plus,
  Calendar,
  User
} from 'lucide-react';
import PDFThumbnail from '@/components/resume/PDFThumbnail';

interface Document {
  id: string;
  name: string;
  type: 'resume' | 'cover-letter' | 'certificate';
  uploadDate: Date;
  size: string;
  thumbnail?: string;
  data?: any;
}

interface DocumentManagerProps {
  currentResume?: any;
  onDocumentSelect?: (document: Document) => void;
  onNavigateToUpload?: () => void;
  onNavigateToEdit?: (document: Document) => void;
}

export default function DocumentManager({ 
  currentResume, 
  onDocumentSelect,
  onNavigateToUpload,
  onNavigateToEdit
}: DocumentManagerProps) {
  const [documents, setDocuments] = useState<Document[]>([]);

  useEffect(() => {
    // Load documents from localStorage and create mock data
    const loadDocuments = () => {
      const docs: Document[] = [];
      
      // Add current resume if exists
      if (currentResume) {
        docs.push({
          id: 'current-resume',
          name: currentResume.contact?.name ? 
            `${currentResume.contact.name} - Resume` : 
            'My Resume',
          type: 'resume',
          uploadDate: new Date(),
          size: '245 KB',
          data: currentResume
        });
      }

      // Add some mock documents for demo
      docs.push(
        {
          id: 'resume-v1',
          name: 'Software Engineer Resume v1',
          type: 'resume',
          uploadDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          size: '128 KB'
        },
        {
          id: 'resume-v2', 
          name: 'Frontend Developer Resume',
          type: 'resume',
          uploadDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
          size: '156 KB'
        },
        {
          id: 'cover-letter-1',
          name: 'Cover Letter - Tech Company',
          type: 'cover-letter',
          uploadDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          size: '89 KB'
        }
      );

      setDocuments(docs);
    };

    loadDocuments();
  }, [currentResume]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'resume':
        return <User className="w-5 h-5" />;
      case 'cover-letter':
        return <FileText className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'resume':
        return 'bg-blue-100 text-blue-800';
      case 'cover-letter':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="h-screen bg-gray-50 p-6 overflow-auto">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Documents</h1>
            <p className="text-gray-600">Manage your resumes, cover letters, and certificates</p>
          </div>
          <Button 
            onClick={onNavigateToUpload}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Upload New Document
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <FileText className="w-8 h-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Documents</p>
                  <p className="text-2xl font-bold text-gray-900">{documents.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <User className="w-8 h-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Resumes</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {documents.filter(d => d.type === 'resume').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <FileText className="w-8 h-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Cover Letters</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {documents.filter(d => d.type === 'cover-letter').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Calendar className="w-8 h-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Last Updated</p>
                  <p className="text-sm font-bold text-gray-900">Today</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Documents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {documents.map((doc) => (
            <Card 
              key={doc.id} 
              className="hover:shadow-lg transition-shadow cursor-pointer group"
              onClick={() => onNavigateToEdit?.(doc)}
            >
              <CardContent className="p-0">
                {/* Thumbnail */}
                <div className="h-48 relative overflow-hidden">
                  {doc.type === 'resume' && doc.data ? (
                    <PDFThumbnail 
                      resumeData={doc.data}
                      className="h-full w-full"
                      fallbackIcon={getTypeIcon(doc.type)}
                    />
                  ) : (
                    <div className="h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      <div className="text-center">
                        {getTypeIcon(doc.type)}
                        <div className="mt-2 text-xs text-gray-500 font-medium uppercase tracking-wide">
                          {doc.type.replace('-', ' ')}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Overlay actions */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                    <Button 
                      size="sm" 
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigateToEdit?.(doc);
                      }}
                      title="View & Edit"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Handle download
                        console.log('Download document:', doc.name);
                      }}
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Handle delete
                        if (confirm(`Delete ${doc.name}?`)) {
                          setDocuments(prev => prev.filter(d => d.id !== doc.id));
                        }
                      }}
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">
                      {doc.name}
                    </h3>
                    <Badge className={getTypeColor(doc.type)}>
                      {doc.type}
                    </Badge>
                  </div>
                  
                  <div className="space-y-1 text-xs text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      {formatDate(doc.uploadDate)}
                    </div>
                    <div className="flex items-center">
                      <FileText className="w-3 h-3 mr-1" />
                      {doc.size}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Add New Document Card */}
          <Card 
            className="hover:shadow-lg transition-shadow cursor-pointer border-dashed border-2 border-gray-300 hover:border-blue-400"
            onClick={onNavigateToUpload}
          >
            <CardContent className="p-0">
              <div className="h-48 flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <Plus className="w-12 h-12 mx-auto mb-2" />
                  <p className="text-sm font-medium">Add New Document</p>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-600 text-sm">
                  Upload Resume or Cover Letter
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  PDF, DOC, or DOCX files
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}