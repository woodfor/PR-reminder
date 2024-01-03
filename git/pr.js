import { Octokit } from "@octokit/core";

const readPullRequest = async (token, owner, repo, pullNumber) => {
  const octokit = new Octokit({
    auth: token,
  });

  const res = await octokit.request(
    "GET /repos/{owner}/{repo}/pulls/{pull_number}",
    {
      owner: owner,
      repo: repo,
      pull_number: pullNumber,
      headers: {
        "X-GitHub-Api-Version": "2022-11-28",
      },
    }
  );

  return res.data.body;
};

export { readPullRequest };
