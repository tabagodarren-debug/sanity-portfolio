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

export default async function handler(request, response) {
  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    return response.status(503).json({ error: "GitHub activity is not configured." });
  }

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
    return response.status(502).json({ error: "GitHub activity could not be loaded." });
  }

  const calendar = payload.data.viewer.contributionsCollection.contributionCalendar;

  response.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
  return response.status(200).json(calendar);
}
