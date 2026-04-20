// api/check.js
export default async function handler(req, res) {
  const { repo, users } = req.body; // Expecting { repo: "owner/repo", users: ["user1", "user2"] }
  
  if (!repo || !users || !Array.isArray(users)) {
    return res.status(400).json({ error: "Invalid request. Need repo and users array." });
  }

  const headers = {
    'Accept': 'application/vnd.github.v3+json',
    ...(process.env.GITHUB_TOKEN && { 'Authorization': `token ${process.env.GITHUB_TOKEN}` })
  };

  try {
    let allStargazers = new Set();
    let page = 1;
    let keepFetching = true;
    console.log("Fetching StarGazers");
    // Fetch all stargazers of the repository
    while (keepFetching && page <= 30) { // Limit to 3000 stars for safety/speed
      const response = await fetch(`https://api.github.com/repos/${repo}/stargazers?per_page=100&page=${page}`, { headers });
      
      if (!response.ok) {
        if (response.status === 403) throw new Error("Rate limit exceeded");
        throw new Error("Repository not found or private");
      }

      const data = await response.json();
      if (data.length === 0) break;

      data.forEach(user => allStargazers.add(user.login.toLowerCase()));
      if (data.length < 100) keepFetching = false;
      page++;
    }
    console.log("Fetching finished");
    console.log(allStargazers);
    console.log(`Fetched ${allStargazers.size} stargazers for ${repo}`,allStargazers);

    // Filter the provided list to see who matches
    const starredList = users.filter(username => 
      allStargazers.has(username.trim().toLowerCase())
    );

    res.status(200).json({ 
      found: starredList,
      totalChecked: users.length,
      starCount: allStargazers.size
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}