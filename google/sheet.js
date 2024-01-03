import fs from "fs";
import path from "path";
import process from "process";
import { authenticate } from "@google-cloud/local-auth";
import { google } from "googleapis";
import _ from "lodash";

// If modifying these scopes, delete token.json.
const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = path.join(process.cwd(), "google/token.json");
const CREDENTIALS_PATH = path.join(process.cwd(), "google/credentials.json");

/**
 * Reads previously authorized credentials from the save file.
 *
 * @return {Promise<OAuth2Client|null>}
 */
async function loadSavedCredentialsIfExist() {
  try {
    const content = await fs.readFileSync(TOKEN_PATH);
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
}

/**
 * Serializes credentials to a file comptible with GoogleAUth.fromJSON.
 *
 * @param {OAuth2Client} client
 * @return {Promise<void>}
 */
async function saveCredentials(client) {
  const content = await fs.readFileSync(CREDENTIALS_PATH);
  console.log("content", content);
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: "authorized_user",
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await fs.writeFileSync(TOKEN_PATH, payload);
}

/**
 * Load or request or authorization to call APIs.
 *
 */
async function authorize() {
  let client = await loadSavedCredentialsIfExist();
  if (client) {
    return client;
  }
  client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });
  if (client.credentials) {
    await saveCredentials(client);
  }
  return client;
}

/**
 * Prints the names and majors of students in a sample spreadsheet:
 * @see https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
 * @param {google.auth.OAuth2} auth The authenticated Google OAuth client.
 */
async function listMajors(auth) {
  const sheets = google.sheets({ version: "v4", auth });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: "11lASyc9ZKRX0bcohvR1ZU2vCDutDv6Qued4hLOAofwg",
    range: "Class Data!A2:E",
  });
  const rows = res.data.values;
  if (!rows || rows.length === 0) {
    console.log("No data found.");
    return;
  }
  console.log("Name, Major:");
  rows.forEach((row) => {
    // Print columns A and E, which correspond to indices 0 and 4.
    console.log(`${row[0]}, ${row[4]}`);
  });
}

// grab the spreadsheet info
const getSpreadsheetInfo = async (auth, spreadsheetId) => {
  const service = google.sheets({ version: "v4", auth });
  const request = {
    spreadsheetId,
    includeGridData: false,
  };
  try {
    const response = await service.spreadsheets.get(request);
    return response.data.sheets;
  } catch (err) {
    console.error(err);
    return [];
  }
};

const duplicateSheet = async (auth, spreadsheetId, sheetId, newSheetName) => {
  const service = google.sheets({ version: "v4", auth });
  const request = {
    spreadsheetId,
    resource: {
      requests: [
        {
          duplicateSheet: {
            sourceSheetId: sheetId,
            insertSheetIndex: 2,
            newSheetName,
          },
        },
      ],
    },
  };
  try {
    const response = await service.spreadsheets.batchUpdate(request);
    if (response.status !== 200) {
      throw new Error("Failed to duplicate sheet");
    }
    return response.data.replies[0].duplicateSheet.properties;
  } catch (err) {
    // check if err contains string "already exists"
    if (err.message.includes("already exists")) {
      return "Sheet already exists";
    }
    return "unknown error";
  }
};

const getSubSheet = async (auth, spreadsheetId, sheetName) => {
  const subSheets = await getSpreadsheetInfo(auth, spreadsheetId);
  return _.find(subSheets, (sheet) => sheet.properties.title === sheetName)
    ?.properties;
};

const generateTestDocWithTemplate = async (
  auth,
  spreadsheetId,
  instructionSheetID,
  title,
  testScopes
) => {
  const duplicateRes = await duplicateSheet(
    auth,
    spreadsheetId,
    instructionSheetID,
    title
  );
  let newSheetId;
  if (duplicateRes === "unknown error") {
    throw new Error("Failed to duplicate sheet");
  }
  if (duplicateRes === "Sheet already exists") {
    const existedSheet = await getSubSheet(auth, spreadsheetId, title);
    newSheetId = existedSheet.sheetId;
  } else {
    newSheetId = duplicateRes.sheetId;
  }

  const service = google.sheets({ version: "v4", auth });

  const updatedValues = testScopes.map((scope) => ({
    values: {
      userEnteredValue: {
        stringValue: scope,
      },
    },
  }));
  const valuesUpdateRequest = {
    requests: {
      updateCells: {
        fields: "*",
        range: {
          sheetId: newSheetId,
          startRowIndex: 7,
          endRowIndex: 7 + testScopes.length,
          startColumnIndex: 0,
          endColumnIndex: 1,
        },
        rows: [...updatedValues],
      },
    },
  };

  try {
    const valuesUpdateResponse = await service.spreadsheets.batchUpdate({
      spreadsheetId,
      resource: valuesUpdateRequest,
    });
    return valuesUpdateResponse;
  } catch (err) {
    // TODO (developer) - Handle exception
    throw err;
  }
};

// authorize().then(listMajors).catch(console.error);

export {
  authorize,
  listMajors,
  generateTestDocWithTemplate,
  getSpreadsheetInfo,
  duplicateSheet,
  getSubSheet,
};
