import inquirer from "inquirer";

const promptTestSheetIDQuestions = async () => {
  const question = [
    {
      type: "input",
      name: "testSheetID",
      message: "Please enter the test sheet ID:",
      validate: function (input) {
        // Basic validation to check if input is not empty
        return input.length > 0 || "Please enter a valid sheet ID.";
      },
    },
  ];

  const answer = await inquirer.prompt(question);
  return answer.testSheetID;
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
    const testSheetID = await promptTestSheetIDQuestions();
    return { generate: generateTestSheet, sheetId: testSheetID };
  }
  return { generate: generateTestSheet };
};

export { promptGenerateTestDocQuestions };
