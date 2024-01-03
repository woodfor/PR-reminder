import { readPullRequest } from "./git/pr.js";
import { parse } from "marked";
import { load } from "cheerio";
import _ from "lodash";
import {
  authorize,
  duplicateSheet,
  generateTestDocWithTemplate,
  getSpreadsheetInfo,
  getSubSheet,
} from "./google/sheet.js";

const TOKEN =
  "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";

const OWNER = "woodfor";

const REPO = "PR-reminder";

const PULL_NUMBER = 3;

const SHEET_ID = "1CxlNWhaPouOzBZrM7XwiSuX_P9Q93kLXUm-99g8vLCE";

const main = async () => {
  //   authorize().then(listMajors).catch(console.error);
  const body = await readPullRequest(TOKEN, OWNER, REPO, PULL_NUMBER);
  const markdownToHTML = parse(body);
  console.log(markdownToHTML);
  const $ = load(markdownToHTML);
  const testingScopeHeader = $('h4:contains("Testing")');
  // Check if the header is found
  if (testingScopeHeader.length > 0) {
    // Find the next ol element after the header
    const olElement = testingScopeHeader.next("ol");
    // Check if an ol element is found
    if (olElement.length > 0) {
      const liElements = olElement.children("li");
      // Extract and display the ol content
      const testScopes = [];
      liElements.each((i, li) => {
        testScopes.push(`${i + 1}. ${$(li).text()}`);
      });

      authorize()
        .then(async (auth) => {
          const testInstructionSheet = await getSubSheet(
            auth,
            SHEET_ID,
            "Testing Instructions"
          );
          const res = generateTestDocWithTemplate(
            auth,
            SHEET_ID,
            testInstructionSheet.sheetId,
            "PR-reminder",
            testScopes
          );
        })
        .catch(console.error);
    } else {
      console.log('No ordered list found under "Testing Scope"');
    }
  } else {
    console.log('No "Testing Scope" section found');
  }
};

main();
