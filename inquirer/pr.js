import inquirer from "inquirer";
import {
  readPullRequest,
  readPullRequestByPRNumber,
  getGitInfo,
} from "../git/pr.js";

const parseGitHubPRLink = (url) => {
  // Split the URL by '/'
  const parts = url.split("/");

  // Assuming the URL format is always like https://github.com/{owner}/{repo}/pull/{pr_number}
  if (parts.length >= 7 && parts[2] === "github.com" && parts[5] === "pull") {
    const owner = parts[3];
    const repo = parts[4];
    const prNumber = parts[6];

    return { owner, repo, prNumber };
  } else {
    throw new Error("Invalid GitHub PR URL");
  }
};

const promptPRLinkQuestionsAndGetPRInfo = async (token) => {
  const question = [
    {
      type: "input",
      name: "prLink",
      message: "Please enter the PR web link:",
      validate: function (input) {
        // Basic validation to check if input is not empty
        return input.length > 0 || "Please enter a valid web link.";
      },
    },
  ];

  const followUpAnswer = await inquirer.prompt(question);
  const prLink = followUpAnswer.prLink;
  const { owner, repo, prNumber } = parseGitHubPRLink(prLink);
  const pr = await readPullRequestByPRNumber(
    token,
    owner,
    repo,
    parseInt(prNumber)
  );
  if (!pr) {
    throw new Error("No pull request found");
  }
  return pr;
};

const promptPRInfoQuestions = async (token) => {
  const initialQuestion = [
    {
      type: "confirm",
      name: "readFromGit",
      message: "Do you want to read PR info from Git?",
      default: false,
    },
  ];
  try {
    const initialAnswer = await inquirer.prompt(initialQuestion);

    if (initialAnswer.readFromGit) {
      const gitInfo = await getGitInfo();
      if (!gitInfo) {
        console.error("No git info found");
        return null;
      }
      const { repoName, repoOwner, currentBranch } = gitInfo;
      const pr = await readPullRequest(
        token,
        repoOwner,
        repoName,
        currentBranch
      );
      if (pr) {
        return pr;
      }
    }
    return await promptPRLinkQuestionsAndGetPRInfo(token);
  } catch (error) {
    console.error("Error:", error);
    return null;
  }
};

export { promptPRInfoQuestions };
