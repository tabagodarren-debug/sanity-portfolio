const contributionQuery = `
  query {
    viewer {
      contributionsCollection {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              contributionLevel
            }
          }
        }
      }
    }
  }
`;

export async function onRequestGet({ env }) {
  const token = env.GITHUB_TOKEN;

  if (!token) {
    return Response.json(
      { error: "GitHub activity is not configured." },
      { status: 503 },
    );
  }

  try {
    const githubResponse = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: contributionQuery }),
    });
    const payload = await githubResponse.json();

    if (!githubResponse.ok || payload.errors) {
      return Response.json(
        { error: "GitHub activity could not be loaded." },
        { status: 502 },
      );
    }

    return Response.json(
      payload.data.viewer.contributionsCollection.contributionCalendar,
      { headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" } },
    );
  } catch {
    return Response.json(
      { error: "GitHub activity could not be loaded." },
      { status: 502 },
    );
  }
}
