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
import { generateTestSheetWithTemplate, getSubSheet } from "./google/sheet.js";
import { authorize } from "./google/auth.js";
import { getDocInfo } from "./google/doc.js";

dotenv.config();

const GIT_TOKEN = process.env.GITHUB_OAUTH_TOKEN || "";

const BITRISE_TOKEN = process.env.BITRISE_TOKEN;
const BITRISE_APP_SLUG = process.env.BITRISE_APP_SLUG;
const docId = "1w2zmR6outdVOZAO2qC2xjZ-qWTgr0vM-LlQy4EpiYNU";

const main = async () => {
  // Self check
  console.log("Env checking");
  [GIT_TOKEN, BITRISE_TOKEN, BITRISE_APP_SLUG].forEach((env) => {
    if (!env) {
      console.error(`Missing env ${env}`);
      return;
    }
  });
  console.log("Env checking passed, start running");

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
    const { sheetId: motherSheetId, docId: motherDocId } = testDoc;
    const markdownToHTML = parse(pr.body);
    const prTitle = pr.title;
    console.log(markdownToHTML);
    const testPurpose = getTestPurposeFromPRBodyHTML(markdownToHTML);
    const testScopes = getTestStepsFromPRBodyHTML(markdownToHTML);

    const auth = await authorize();
    if (!auth) {
      console.error("Google Auth failed");
      return;
    }

    // generate google sheet
    const testInstructionSheet = await getSubSheet(
      auth,
      motherSheetId,
      "Testing Instructions"
    );
    const res = generateTestSheetWithTemplate(
      auth,
      motherSheetId,
      testInstructionSheet.sheetId,
      prTitle,
      testPurpose,
      testScopes
    );
    console.log("Generate sheet successfully");

    // get google doc
    const docInfo = await getDocInfo(auth, docId);
    console.log(docInfo);
  }
};

main();
