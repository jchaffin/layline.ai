import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("query");

  if (!query || query.length < 2) {
    return NextResponse.json({ institutions: [] });
  }

  try {
    const baseUrl = "https://api.data.gov/ed/collegescorecard/v1/schools";
    const apiKey = process.env.COLLEGE_SCORECARD_API_KEY || "DEMO_KEY";

    const params = new URLSearchParams({
      api_key: apiKey,
      "school.name": query,
      "school.operating": "1",
      fields:
        "id,school.name,school.city,school.state,location.lat,location.lon,school.ownership",
      per_page: "20",
    });

    const response = await fetch(`${baseUrl}?${params}`, {
      headers: { "User-Agent": "Interview-Assistant/1.0" },
    });

    if (!response.ok) {
      console.error(
        `College Scorecard API responded with ${response.status}: ${response.statusText}`
      );
      return NextResponse.json({
        institutions: [
          {
            id: `fallback-${Date.now()}`,
            name: query,
            city: "",
            state: "",
            location: "",
            ownership: "Unknown",
            coordinates: { lat: null, lon: null },
          },
        ],
      });
    }

    const data = await response.json();

    const institutions = (data.results || [])
      .map((school: any, index: number) => ({
        id: school.id || `school-${index}-${Date.now()}`,
        name: school["school.name"],
        city: school["school.city"],
        state: school["school.state"],
        location:
          school["school.city"] && school["school.state"]
            ? `${school["school.city"]}, ${school["school.state"]}`
            : "",
        ownership:
          school["school.ownership"] === 1
            ? "Public"
            : school["school.ownership"] === 2
              ? "Private nonprofit"
              : school["school.ownership"] === 3
                ? "Private for-profit"
                : "Unknown",
        coordinates: {
          lat: school["location.lat"],
          lon: school["location.lon"],
        },
      }))
      .filter((school: any) => school.name);

    return NextResponse.json({ institutions });
  } catch (error) {
    console.error("College Scorecard API error:", error);
    return NextResponse.json({
      institutions: [
        {
          id: `fallback-${Date.now()}`,
          name: query,
          city: "",
          state: "",
          location: "",
          ownership: "Unknown",
          coordinates: { lat: null, lon: null },
        },
      ],
    });
  }
}
