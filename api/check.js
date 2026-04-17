// api/check.js
export default async function handler(req, res) {
  const { repo, users } = req.body;
  
  if (!repo || !users || !Array.isArray(users)) {
    return res.status(400).json({ error: "Invalid request." });
  }

  const headers = {
    'Accept': 'application/vnd.github.v3+json',
    ...(process.env.GITHUB_TOKEN && { 'Authorization': `token ${process.env.GITHUB_TOKEN}` })
  };

  try {
    let allStargazers = new Set();
    let page = 1;
    let keepFetching = true;

    while (keepFetching && page <= 30) { 
      const response = await fetch(`https://api.github.com/repos/${repo}/stargazers?per_page=100&page=${page}`, { headers });
      if (!response.ok) throw new Error("Repository not found or private");

      const data = await response.json();
      if (data.length === 0) break;

      data.forEach(user => allStargazers.add(user.login.toLowerCase()));
      if (data.length < 100) keepFetching = false;
      page++;
    }

    // --- LOGIC CHANGE HERE ---
    const starredList = [];
    const notStarredList = [];

    users.forEach(username => {
        const cleanName = username.trim().toLowerCase();
        if (allStargazers.has(cleanName)) {
            starredList.push(username.trim());
        } else {
            notStarredList.push(username.trim());
        }
    });

    res.status(200).json({ 
      starred: starredList,
      notStarred: notStarredList,
      totalChecked: users.length
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}