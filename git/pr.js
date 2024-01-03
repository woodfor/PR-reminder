import { Octokit } from "@octokit/core";
import { exec } from "child_process";
import { load } from "cheerio";

const readPullRequest = async (token, repoOwner, repoName, branch) => {
  const octokit = new Octokit({
    auth: token,
  });

  const res = await octokit.request("GET /repos/{owner}/{repo}/pulls", {
    owner: repoOwner,
    repo: repoName,
    head: `${repoOwner}:${branch}`,
  });
  if (res.data.length === 0) return null;

  const data = res.data[0];

  return { body: data.body, title: data.title, branch };
};

const readPullRequestByPRNumber = async (
  token,
  repoOwner,
  repoName,
  prNumber
) => {
  const octokit = new Octokit({
    auth: token,
  });

  const res = await octokit.request(
    "GET /repos/{owner}/{repo}/pulls/{pull_number}",
    {
      owner: repoOwner,
      repo: repoName,
      pull_number: prNumber,
    }
  );

  const data = res.data;

  return { body: data.body, title: data.title, branch: data.head.ref };
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

const getTestStepsFromPRBodyHTML = (bodyHTML) => {
  const $ = load(bodyHTML);
  const testingScopeHeader = $('h5:contains("Steps")');
  // Check if the header is found
  if (testingScopeHeader.length === 0) {
    console.error('No "Testing Scope" section found');
    return [];
  }
  // Find the next ol element after the header
  const olElement = testingScopeHeader.next("ol");
  // Check if an ol element is found
  if (olElement.length === 0) {
    console.error('No ordered list found under "Testing Scope"');
    return [];
  }
  const liElements = olElement.children("li");
  // Extract and display the ol content
  const testScopes = [];
  liElements.each((i, li) => {
    testScopes.push(`${i + 1}. ${$(li).text()}`);
  });
  return testScopes;
};

const getTestPurposeFromPRBodyHTML = (bodyHTML) => {
  const $ = load(bodyHTML);
  const testingPurposeHeader = $('h5:contains("What we are testing")');
  if (testingPurposeHeader.length === 0) {
    console.error('No "What we are testing" section found');
    return [];
  }
  const pElement = testingPurposeHeader.next("p");
  if (pElement.length === 0) {
    console.error('No paragraph found under "What we are testing"');
    return [];
  }
  return pElement.text();
};

export {
  readPullRequest,
  getGitInfo,
  getTestStepsFromPRBodyHTML,
  getTestPurposeFromPRBodyHTML,
  readPullRequestByPRNumber,
};
