export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const { repo, users } = req.body;
  const token = process.env.GITHUB_TOKEN;

  try {
    const allStargazers = new Set();
    let page = 1;

    // Fetching logic
    while (page <= 10) {
      const response = await fetch(`https://api.github.com/repos/${repo}/stargazers?per_page=100&page=${page}`, {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Vercel-App',
          ...(token && { 'Authorization': `token ${token}` })
        }
      });

      if (!response.ok) break;
      const data = await response.json();
      if (data.length === 0) break;

      data.forEach(u => allStargazers.add(u.login.toLowerCase()));
      if (data.length < 100) break;
      page++;
    }

    const starred = users.filter(u => allStargazers.has(u.trim().toLowerCase()));
    const notStarred = users.filter(u => !allStargazers.has(u.trim().toLowerCase()));

    res.status(200).json({ starred, notStarred, totalChecked: users.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}