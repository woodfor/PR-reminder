import inquirer from "inquirer";

const promptTestSheetAndDocIDQuestions = async () => {
  const question = [
    {
      type: "input",
      name: "testSheetID",
      message: "Please enter the test sheet ID:",
      validate: (input) => {
        // Basic validation to check if input is not empty
        return input.length > 0 || "Please enter a valid sheet ID.";
      },
    },
    {
      type: "input",
      name: "testDocID",
      message: "Please enter the test doc ID:",
      validate: (input) => {
        // Basic validation to check if input is not empty
        return input.length > 0 || "Please enter a valid doc ID.";
      },
    },
  ];

  const answer = await inquirer.prompt(question);
  return { sheetId: answer.testSheetID, docId: answer.testDocID };
};

const promptGenerateTestDocQuestions = async () => {
  const question = [
    {
      type: "confirm",
      name: "generateTestSheet",
      message: "Do you want to generate a test sheet?",
      default: true,
    },
  ];

  const answer = await inquirer.prompt(question);
  const { generateTestSheet } = answer;
  if (generateTestSheet) {
    const { sheetId, docId } = await promptTestSheetAndDocIDQuestions();
    return { generate: generateTestSheet, sheetId, docId };
  }
  return { generate: generateTestSheet };
};

export { promptGenerateTestDocQuestions };
