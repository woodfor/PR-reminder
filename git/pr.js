import { Octokit } from "@octokit/core";
import { exec } from "child_process";

const readPullRequest = async (token, repoOwner, repoName, branch) => {
  console.log("token", token);
  console.log("repoOwner", repoOwner);
  console.log("repoName", repoName);
  console.log("branch", branch);
  const octokit = new Octokit({
    auth: token,
  });

  const res = await octokit.request("GET /repos/{owner}/{repo}/pulls", {
    owner: repoOwner,
    repo: repoName,
    head: `${repoOwner}:${branch}`,
  });
  if (res.data.length === 0) return null;

  return res.data[0].body;
};

const runGitCommand = (command) => {
  return new Promise((resolve, reject) => {
    exec(command, (err, stdout, stderr) => {
      if (err) {
        reject(stderr);
        return;
      }

      resolve(stdout.trim());
    });
  });
};

const getGitInfo = async () => {
  try {
    const remoteUrl = await runGitCommand("git remote get-url origin");
    const currentBranch = await runGitCommand("git branch --show-current");

    // Extract repository name and owner from URL
    // Adjust parsing if you're using a non-GitHub URL
    const urlParts = remoteUrl.split("/");
    const repoName = urlParts[urlParts.length - 1].replace(".git", "");
    const repoOwner = urlParts[urlParts.length - 2];

    return {
      remoteUrl,
      repoName,
      repoOwner,
      currentBranch,
    };
  } catch (error) {
    console.error(`Error: ${error}`);
    return null;
  }
};

export { readPullRequest, getGitInfo };
