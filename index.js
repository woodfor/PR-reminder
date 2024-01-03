import { parse } from "marked";
import _ from "lodash";
import dotenv from "dotenv";

import { promptPRInfoQuestions } from "./inquirer/pr.js";
import { promptTriggerBuildQuestions } from "./inquirer/build.js";
import { promptGenerateTestDocQuestions } from "./inquirer/test-doc.js";
import { triggerBuild } from "./bitrise/build.js";
import {
  getTestPurposeFromPRBodyHTML,
  getTestStepsFromPRBodyHTML,
} from "./git/pr.js";
import {
  authorize,
  generateTestDocWithTemplate,
  getSubSheet,
} from "./google/sheet.js";

dotenv.config();

const GIT_TOKEN = process.env.GITHUB_OAUTH_TOKEN || "";

const BITRISE_TOKEN = process.env.BITRISE_TOKEN;
const BITRISE_APP_SLUG = process.env.BITRISE_APP_SLUG;

const main = async () => {
  const pr = await promptPRInfoQuestions(GIT_TOKEN);
  if (!pr) {
    console.error("No PR found");
    return;
  }

  console.log(pr);

  const willTriggerBuild = await promptTriggerBuildQuestions();
  if (willTriggerBuild) {
    const androidBuildTriggeredRespMessage = await triggerBuild(
      BITRISE_TOKEN,
      pr.branch,
      BITRISE_APP_SLUG,
      "android-staging-app-standalone"
    );
    const iosBuildTriggeredRespMessage = await triggerBuild(
      BITRISE_TOKEN,
      pr.branch,
      BITRISE_APP_SLUG,
      "ios-staging-app-testflight"
    );
    console.log(androidBuildTriggeredRespMessage);
    console.log(iosBuildTriggeredRespMessage);
  }

  const testDoc = await promptGenerateTestDocQuestions();
  if (testDoc.generate) {
    const motherSheetId = testDoc.sheetId;
    const markdownToHTML = parse(pr.body);
    const prTitle = pr.title;
    console.log(markdownToHTML);

    const testPurpose = getTestPurposeFromPRBodyHTML(markdownToHTML);
    const testScopes = getTestStepsFromPRBodyHTML(markdownToHTML);

    authorize()
      .then(async (auth) => {
        const testInstructionSheet = await getSubSheet(
          auth,
          motherSheetId,
          "Testing Instructions"
        );
        const res = generateTestDocWithTemplate(
          auth,
          motherSheetId,
          testInstructionSheet.sheetId,
          prTitle,
          testPurpose,
          testScopes
        );
        console.log("generateSuccessfully");
      })
      .catch(console.error);
  }
};

main();
