import { prisma } from './db';

const seedDegrees = [
  { name: 'Associate of Arts (AA)', level: 'associate' },
  { name: 'Associate of Science (AS)', level: 'associate' },
  { name: 'Associate of Applied Science (AAS)', level: 'associate' },
  { name: 'Bachelor of Arts (BA)', level: 'bachelor' },
  { name: 'Bachelor of Science (BS)', level: 'bachelor' },
  { name: 'Bachelor of Business Administration (BBA)', level: 'bachelor' },
  { name: 'Bachelor of Engineering (BE)', level: 'bachelor' },
  { name: 'Bachelor of Technology (BTech)', level: 'bachelor' },
  { name: 'Bachelor of Computer Science (BCS)', level: 'bachelor' },
  { name: 'Bachelor of Fine Arts (BFA)', level: 'bachelor' },
  { name: 'Master of Arts (MA)', level: 'master' },
  { name: 'Master of Science (MS)', level: 'master' },
  { name: 'Master of Business Administration (MBA)', level: 'master' },
  { name: 'Master of Engineering (ME)', level: 'master' },
  { name: 'Master of Technology (MTech)', level: 'master' },
  { name: 'Master of Computer Science (MCS)', level: 'master' },
  { name: 'Master of Fine Arts (MFA)', level: 'master' },
  { name: 'Master of Public Administration (MPA)', level: 'master' },
  { name: 'Doctor of Philosophy (PhD)', level: 'doctoral' },
  { name: 'Doctor of Medicine (MD)', level: 'doctoral' },
  { name: 'Doctor of Law (JD)', level: 'doctoral' },
  { name: 'Doctor of Education (EdD)', level: 'doctoral' },
  { name: 'Certificate', level: 'certificate' },
  { name: 'Diploma', level: 'certificate' },
];

const seedInstitutions = [
  { name: 'Harvard University', type: 'university', location: 'Cambridge, MA' },
  { name: 'Stanford University', type: 'university', location: 'Stanford, CA' },
  { name: 'Massachusetts Institute of Technology (MIT)', type: 'university', location: 'Cambridge, MA' },
  { name: 'University of California, Berkeley', type: 'university', location: 'Berkeley, CA' },
  { name: 'University of California, Los Angeles (UCLA)', type: 'university', location: 'Los Angeles, CA' },
  { name: 'California Institute of Technology (Caltech)', type: 'university', location: 'Pasadena, CA' },
  { name: 'Princeton University', type: 'university', location: 'Princeton, NJ' },
  { name: 'Yale University', type: 'university', location: 'New Haven, CT' },
  { name: 'Columbia University', type: 'university', location: 'New York, NY' },
  { name: 'University of Chicago', type: 'university', location: 'Chicago, IL' },
  { name: 'Cornell University', type: 'university', location: 'Ithaca, NY' },
  { name: 'University of Pennsylvania', type: 'university', location: 'Philadelphia, PA' },
  { name: 'Duke University', type: 'university', location: 'Durham, NC' },
  { name: 'Northwestern University', type: 'university', location: 'Evanston, IL' },
  { name: 'Johns Hopkins University', type: 'university', location: 'Baltimore, MD' },
  { name: 'Carnegie Mellon University', type: 'university', location: 'Pittsburgh, PA' },
  { name: 'University of Michigan', type: 'university', location: 'Ann Arbor, MI' },
  { name: 'New York University (NYU)', type: 'university', location: 'New York, NY' },
  { name: 'University of Southern California (USC)', type: 'university', location: 'Los Angeles, CA' },
  { name: 'Georgetown University', type: 'university', location: 'Washington, DC' },
  { name: 'University of Texas at Austin', type: 'university', location: 'Austin, TX' },
  { name: 'Georgia Institute of Technology', type: 'university', location: 'Atlanta, GA' },
  { name: 'University of Washington', type: 'university', location: 'Seattle, WA' },
  { name: 'University of Illinois', type: 'university', location: 'Urbana-Champaign, IL' },
  { name: 'Penn State University', type: 'university', location: 'University Park, PA' },
  { name: 'Ohio State University', type: 'university', location: 'Columbus, OH' },
  { name: 'University of Florida', type: 'university', location: 'Gainesville, FL' },
  { name: 'Arizona State University', type: 'university', location: 'Tempe, AZ' },
  { name: 'Boston University', type: 'university', location: 'Boston, MA' },
  { name: 'Northeastern University', type: 'university', location: 'Boston, MA' },
  { name: 'Community College', type: 'community_college', location: null },
  { name: 'Technical Institute', type: 'technical', location: null },
  { name: 'Online University', type: 'online', location: null },
  { name: 'International University', type: 'international', location: null },
];

export async function seedEducationData() {
  try {
    console.log('Seeding degrees...');
    for (const degree of seedDegrees) {
      await prisma.degree.upsert({
        where: { name: degree.name },
        create: degree,
        update: {},
      });
    }

    console.log('Seeding institutions...');
    for (const institution of seedInstitutions) {
      await prisma.institution.upsert({
        where: { name: institution.name },
        create: institution as { name: string; type: string; location: string | null },
        update: {},
      });
    }

    console.log('Education data seeded successfully!');
  } catch (error) {
    console.error('Error seeding education data:', error);
    throw error;
  }
}
