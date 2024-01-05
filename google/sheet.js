import { google } from "googleapis";
import _ from "lodash";

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

const generateTestSheetWithTemplate = async (
  auth,
  spreadsheetId,
  instructionSheetID,
  title,
  testPurpose,
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
    requests: [
      {
        updateCells: {
          fields: "*",
          range: {
            sheetId: newSheetId,
            startRowIndex: 1,
            endRowIndex: 2,
            startColumnIndex: 0,
            endColumnIndex: 1,
          },
          rows: [
            {
              values: {
                userEnteredValue: {
                  stringValue: testPurpose,
                },
              },
            },
          ],
        },
      },
      {
        updateCells: {
          fields: "*",
          range: {
            sheetId: newSheetId,
            startRowIndex: 6,
            endRowIndex: 6 + testScopes.length,
            startColumnIndex: 0,
            endColumnIndex: 1,
          },
          rows: [...updatedValues],
        },
      },
    ],
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

export {
  generateTestSheetWithTemplate,
  getSpreadsheetInfo,
  duplicateSheet,
  getSubSheet,
};
