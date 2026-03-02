import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { enhanceInstitutionLocation } from '@/lib/googleMaps';

export async function POST() {
  try {
    const institutionsToEnhance = await prisma.institution.findMany({
      where: { formatted_address: null },
      take: 50,
    });

    if (institutionsToEnhance.length === 0) {
      return NextResponse.json({
        message: 'All institutions already have enhanced location data',
        processed: 0,
      });
    }

    const results = [];
    let enhanced = 0;
    let failed = 0;

    for (const institution of institutionsToEnhance) {
      try {
        const locationData = await enhanceInstitutionLocation(
          institution.name,
          institution.location ?? undefined
        );

        if (locationData) {
          await prisma.institution.update({
            where: { id: institution.id },
            data: {
              formatted_address: locationData.formatted_address,
              latitude: locationData.latitude,
              longitude: locationData.longitude,
              city: locationData.city,
              state: locationData.state,
              country: locationData.country,
              place_id: locationData.place_id,
            },
          });
          enhanced++;
          results.push({
            id: institution.id,
            name: institution.name,
            status: 'enhanced',
            location: locationData.formatted_address,
          });
        } else {
          failed++;
          results.push({
            id: institution.id,
            name: institution.name,
            status: 'failed',
            reason: 'Could not geocode location',
          });
        }

        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        failed++;
        results.push({
          id: institution.id,
          name: institution.name,
          status: 'error',
          reason: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      message: `Enhanced location data for ${enhanced} institutions`,
      enhanced,
      failed,
      total: institutionsToEnhance.length,
      results,
    });
  } catch (error) {
    console.error('Error enhancing institution locations:', error);
    return NextResponse.json(
      { error: 'Failed to enhance institution locations' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const allInstitutions = await prisma.institution.findMany();
    const enhanced = allInstitutions.filter((inst) => inst.formatted_address).length;
    const notEnhanced = allInstitutions.length - enhanced;

    return NextResponse.json({
      total: allInstitutions.length,
      enhanced,
      notEnhanced,
      enhancementProgress: `${enhanced}/${allInstitutions.length} (${Math.round((enhanced / allInstitutions.length) * 100)}%)`,
    });
  } catch (error) {
    console.error('Error checking enhancement status:', error);
    return NextResponse.json(
      { error: 'Failed to check enhancement status' },
      { status: 500 }
    );
  }
}
