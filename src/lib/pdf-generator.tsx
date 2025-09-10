// PDF generation library using @react-pdf/renderer
import React from 'react';
import { Document, Page, Text, View, StyleSheet, renderToBuffer, Font } from '@react-pdf/renderer';

// Register fonts for better typography
Font.register({
  family: 'Inter',
  src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2'
});

const styles = StyleSheet.create({
  page: { 
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    padding: 38, // 1.5" = 38px
    fontFamily: 'Inter',
    fontSize: 9,
  },
  
  // Left Column (Main Content)
  leftColumn: {
    flex: 3,
    marginRight: 38, // 1.5" spacing
  },
  
  // Right Column (Details)
  rightColumn: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 25,
    borderRadius: 8,
  },
  
  // Header Section
  header: {
    marginBottom: 25,
    borderBottom: '3px solid #2563eb',
    paddingBottom: 15,
  },
  name: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  
  // Section Styles
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    borderBottom: '2px solid #e2e8f0',
    paddingBottom: 6,
  },
  
  // Profile Section
  profile: {
    fontSize: 11,
    lineHeight: 1.6,
    color: '#374151',
    textAlign: 'justify',
  },
  
  // Experience Section
  experienceItem: {
    marginBottom: 18,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  jobTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
    flex: 1,
  },
  jobCompany: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563eb',
    marginBottom: 4,
  },
  jobDuration: {
    fontSize: 10,
    color: '#64748b',
    fontStyle: 'italic',
    fontWeight: '500',
  },
  jobDescription: {
    fontSize: 10,
    lineHeight: 1.5,
    color: '#374151',
    marginBottom: 8,
  },
  achievementsList: {
    marginLeft: 12,
  },
  achievementItem: {
    fontSize: 10,
    lineHeight: 1.4,
    color: '#374151',
    marginBottom: 4,
    flexDirection: 'row',
  },
  bullet: {
    fontSize: 8,
    color: '#2563eb',
    marginRight: 8,
    marginTop: 2,
    fontWeight: 'bold',
  },
  
  // Right Column Styles
  detailsSection: {
    marginBottom: 25,
  },
  detailsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailItem: {
    fontSize: 10,
    color: '#374151',
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    fontSize: 10,
    color: '#2563eb',
    marginRight: 8,
    width: 12,
  },
  linkItem: {
    fontSize: 10,
    color: '#2563eb',
    marginBottom: 6,
    textDecoration: 'underline',
  },
  skillsSection: {
    marginBottom: 25,
  },
  skillItem: {
    fontSize: 10,
    color: '#374151',
    marginBottom: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  skillBullet: {
    fontSize: 8,
    color: '#2563eb',
    marginRight: 6,
    marginTop: 1,
  },
  educationSection: {
    marginBottom: 25,
  },
  educationItem: {
    marginBottom: 12,
  },
  educationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  educationDegree: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  educationInstitution: {
    fontSize: 10,
    color: '#2563eb',
    fontWeight: '600',
  },
  educationYear: {
    fontSize: 9,
    color: '#64748b',
    fontStyle: 'italic',
  },
});

// Helper function to format dates
const formatDate = (date: Date | string | undefined): string => {
  if (!date) return '';
  
  let parsedDate: Date;
  
  if (typeof date === 'string') {
    // Handle ISO date strings like "2024-01-01T08:00:00.000Z"
    parsedDate = new Date(date);
  } else if (date instanceof Date) {
    parsedDate = date;
  } else {
    return '';
  }
  
  if (!isNaN(parsedDate.getTime())) {
    const month = parsedDate.getMonth() + 1;
    const year = parsedDate.getFullYear();
    return `${month}/${year}`;
  }
  
  return '';
};

// Helper function to format duration
const formatDuration = (startDate: Date | string | undefined, endDate: Date | string | undefined, isCurrentRole?: boolean): string => {
  const start = formatDate(startDate);
  const end = isCurrentRole ? 'Present' : formatDate(endDate);
  
  if (!start && !end) return '';
  if (!start) return end;
  if (!end) return start;
  
  return `${start} — ${end}`;
};

// Helper function to get full name
const getFullName = (contact: any): string => {
  if (contact?.name) return contact.name;
  if (contact?.firstName || contact?.lastName) {
    return `${contact.firstName || ''} ${contact.lastName || ''}`.trim();
  }
  return 'Your Name';
};

// Helper function to convert description to bullet points
const formatDescription = (description: string) => {
  if (!description) return [];
  
  return description.split('\n').map((line, index) => {
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith('- ')) {
      return {
        type: 'bullet',
        text: trimmedLine.substring(2),
        key: index
      };
    }
    return trimmedLine ? {
      type: 'text',
      text: trimmedLine,
      key: index
    } : null;
  }).filter(Boolean);
};

// Create a React functional component for the PDF
const ResumePDF = ({ resumeData }: { resumeData: any }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Left Column - Main Content */}
      <View style={styles.leftColumn}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.name}>
            {getFullName(resumeData?.contact)}
          </Text>
          
          {resumeData?.jobTitle && (
            <Text style={styles.title}>{resumeData.jobTitle}</Text>
          )}
        </View>

        {/* Profile Section */}
        {resumeData?.summary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Professional Summary</Text>
            <Text style={styles.profile}>{resumeData.summary}</Text>
          </View>
        )}

        {/* Experience Section */}
        {resumeData?.experience && resumeData.experience.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Professional Experience</Text>
            {resumeData.experience.map((exp: any, index: number) => (
              <View key={index} style={styles.experienceItem}>
                <View style={styles.jobHeader}>
                  <Text style={styles.jobTitle}>{exp.role}</Text>
                  <Text style={styles.jobDuration}>
                    {(() => {
                      const parseDate = (dateStr: string) => {
                        if (!dateStr || dateStr === 'undefined' || dateStr === 'null') return '';
                        try {
                          const date = new Date(dateStr);
                          if (isNaN(date.getTime())) return '';
                          const month = date.getMonth() + 1;
                          const year = date.getFullYear();
                          return `${month}/${year}`;
                        } catch (e) {
                          return '';
                        }
                      };
                      const start = parseDate(String(exp.startDate || ''));
                      const end = Boolean(exp.isCurrentRole) ? 'Present' : parseDate(String(exp.endDate || ''));
                      return `${start} — ${end}`;
                    })()}
                  </Text>
                </View>
                
                <Text style={styles.jobCompany}>{exp.company}</Text>
                
                {exp.description && (
                  <View style={styles.achievementsList}>
                    {formatDescription(exp.description).map((item: any) => {
                      if (item.type === 'bullet') {
                        return (
                          <View key={item.key} style={styles.achievementItem}>
                            <Text style={styles.bullet}>•</Text>
                            <Text style={{ flex: 1 }}>{item.text}</Text>
                          </View>
                        );
                      }
                      return (
                        <Text key={item.key} style={styles.jobDescription}>
                          {item.text}
                        </Text>
                      );
                    })}
                  </View>
                )}
              </View>
            ))}
          </View>
                  )}
       </View>

      {/* Right Column - Details */}
      <View style={styles.rightColumn}>
        {/* Contact Details */}
        <View style={styles.detailsSection}>
          <Text style={styles.detailsTitle}>Contact</Text>
          {resumeData?.contact?.location && (
            <Text style={styles.detailItem}>
              <Text style={styles.detailIcon}>📍</Text>
              {resumeData.contact.location}
            </Text>
          )}
          {resumeData?.contact?.phone && (
            <Text style={styles.detailItem}>
              <Text style={styles.detailIcon}>📞</Text>
              {resumeData.contact.phone}
            </Text>
          )}
          {resumeData?.contact?.email && (
            <Text style={styles.detailItem}>
              <Text style={styles.detailIcon}>📧</Text>
              <Text style={styles.linkItem}>{resumeData.contact.email}</Text>
            </Text>
          )}
        </View>

        {/* Links */}
        {(resumeData?.contact?.linkedin || resumeData?.contact?.github || resumeData?.contact?.website) && (
          <View style={styles.detailsSection}>
            <Text style={styles.detailsTitle}>Links</Text>
            {resumeData?.contact?.github && (
              <Text style={styles.detailItem}>
                <Text style={styles.detailIcon}>🔗</Text>
                <Text style={styles.linkItem}>GitHub</Text>
              </Text>
            )}
            {resumeData?.contact?.linkedin && (
              <Text style={styles.detailItem}>
                <Text style={styles.detailIcon}>💼</Text>
                <Text style={styles.linkItem}>LinkedIn</Text>
              </Text>
            )}
            {resumeData?.contact?.website && (
              <Text style={styles.detailItem}>
                <Text style={styles.detailIcon}>🌐</Text>
                <Text style={styles.linkItem}>Website</Text>
              </Text>
            )}
          </View>
        )}

        {/* Skills */}
        {resumeData?.skills && resumeData.skills.length > 0 && (
          <View style={styles.skillsSection}>
            <Text style={styles.detailsTitle}>Skills</Text>
            {resumeData.skills.map((skill: string, index: number) => (
              <Text key={index} style={styles.skillItem}>
                • {skill}
              </Text>
            ))}
          </View>
        )}

        {/* Education */}
        {resumeData?.education && resumeData.education.length > 0 && (
          <View style={styles.educationSection}>
            <Text style={styles.detailsTitle}>Education</Text>
            {resumeData.education.map((edu: any, index: number) => (
              <View key={index} style={styles.educationItem}>
                <View style={styles.educationHeader}>
                  <Text style={styles.educationDegree}>
                    {edu.degree} {edu.field && `in ${edu.field}`}
                  </Text>
                  <Text style={styles.educationYear}>{edu.year}</Text>
                </View>
                <Text style={styles.educationInstitution}>{edu.institution}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </Page>
  </Document>
);

// Export function to generate PDF buffer
export async function generateResumePDF(resumeData: any): Promise<Buffer> {
  const pdfComponent = <ResumePDF resumeData={resumeData} />;
  return await renderToBuffer(pdfComponent);
}