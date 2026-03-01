// Utility to clear all legacy localStorage data
export function clearLegacyData() {
  const keysToRemove = [
    'parsedResumeData',
    'resumeData', 
    'jobApplications',
    'interviewSessions',
    'prepSessions',
    'savedJobs',
    'searchHistory',
    'userPreferences',
    'tailoredResumes',
    'documentCache',
  ];

  // Remove all legacy keys
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
    
    // Also remove any guest prefixed versions
    localStorage.removeItem(`guest:${key}`);
  });

  // Clear any other JobLaunch related data
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('joblaunch:') || 
        key.startsWith('interview:') || 
        key.startsWith('resume:') ||
        key.includes('parsed') ||
        key.includes('job') ||
        key.includes('application')) {
      localStorage.removeItem(key);
    }
  });

  console.log('✅ Legacy data cleared - users must now sign in');
}

// Auto-clear on app load
if (typeof window !== 'undefined') {
  clearLegacyData();
}
