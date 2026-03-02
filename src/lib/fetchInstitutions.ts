import { prisma } from './db';

// College Scorecard API endpoint for institution data
const COLLEGE_SCORECARD_API = 'https://api.data.gov/ed/collegescorecard/v1/schools.json';

interface CollegeScorecardInstitution {
  id: number;
  'school.name': string;
  'school.city': string;
  'school.state': string;
  'school.school_url': string;
  'school.type': number;
  '2022.academics.program_available.assoc': number;
  '2022.academics.program_available.bachelors': number;
  '2022.academics.program_available.certificate': number;
  latest: {
    school: {
      name: string;
      city: string;
      state: string;
      zip: string;
      school_url: string;
      type: number;
    };
  };
}

function mapSchoolType(type: number): string {
  switch (type) {
    case 1:
      return 'public';
    case 2:
      return 'private_nonprofit';
    case 3:
      return 'private_forprofit';
    default:
      return 'university';
  }
}

function determineInstitutionType(name: string, type: number): string {
  const lowerName = name.toLowerCase();

  if (lowerName.includes('community college') || lowerName.includes('comm college')) {
    return 'community_college';
  }
  if (lowerName.includes('technical') || lowerName.includes('tech college') || lowerName.includes('vocational')) {
    return 'technical';
  }
  if (lowerName.includes('university') || lowerName.includes('institute of technology')) {
    return 'university';
  }
  if (lowerName.includes('college')) {
    return 'college';
  }

  return type === 1 ? 'public' : 'private';
}

export async function fetchAndSeedInstitutions(limit: number = 1000): Promise<void> {
  try {
    console.log('Fetching institutions from College Scorecard API...');

    const params = new URLSearchParams({
      api_key: 'DEMO_KEY',
      _fields: 'id,school.name,school.city,school.state,school.type,school.school_url',
      _sort: 'school.name',
      _per_page: limit.toString(),
      'school.operating': '1',
      'school.main_campus': '1',
    });

    const response = await fetch(`${COLLEGE_SCORECARD_API}?${params}`);

    if (!response.ok) {
      throw new Error(`College Scorecard API error: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.results || !Array.isArray(data.results)) {
      throw new Error('Invalid response format from College Scorecard API');
    }

    console.log(`Processing ${data.results.length} institutions...`);

    await prisma.institution.deleteMany({});

    const institutionData = data.results
      .filter(
        (school: CollegeScorecardInstitution) =>
          school['school.name'] && school['school.city'] && school['school.state']
      )
      .map((school: CollegeScorecardInstitution) => ({
        name: school['school.name'],
        type: determineInstitutionType(school['school.name'], school['school.type']),
        location: `${school['school.city']}, ${school['school.state']}`,
        isActive: true,
      }));

    const batchSize = 100;
    for (let i = 0; i < institutionData.length; i += batchSize) {
      const batch = institutionData.slice(i, i + batchSize);
      await prisma.institution.createMany({
        data: batch,
        skipDuplicates: true,
      });
      console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(institutionData.length / batchSize)}`);
    }

    console.log(`Successfully seeded ${institutionData.length} institutions from College Scorecard!`);

    const commonInstitutions = [
      { name: 'Community College (General)', type: 'community_college', location: null },
      { name: 'Technical Institute (General)', type: 'technical', location: null },
      { name: 'Online University (General)', type: 'online', location: null },
      { name: 'International University (General)', type: 'international', location: null },
      { name: 'Trade School (General)', type: 'technical', location: null },
      { name: 'Art Institute (General)', type: 'college', location: null },
    ];

    for (const institution of commonInstitutions) {
      await prisma.institution.upsert({
        where: { name: institution.name },
        create: institution as { name: string; type: string; location: string | null },
        update: {},
      });
    }

    console.log('Added common institution types as fallbacks');
  } catch (error) {
    console.error('Error fetching institutions from College Scorecard:', error);

    console.log('Falling back to original seed data...');
    const fallbackInstitutions = [
      { name: 'Harvard University', type: 'university', location: 'Cambridge, MA' },
      { name: 'Stanford University', type: 'university', location: 'Stanford, CA' },
      { name: 'Massachusetts Institute of Technology (MIT)', type: 'university', location: 'Cambridge, MA' },
      { name: 'University of California, Berkeley', type: 'university', location: 'Berkeley, CA' },
      { name: 'Community College', type: 'community_college', location: null },
      { name: 'Technical Institute', type: 'technical', location: null },
      { name: 'Online University', type: 'online', location: null },
    ];

    for (const institution of fallbackInstitutions) {
      await prisma.institution.upsert({
        where: { name: institution.name },
        create: institution,
        update: {},
      });
    }

    throw error;
  }
}
