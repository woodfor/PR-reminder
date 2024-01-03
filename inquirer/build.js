import inquirer from "inquirer";

const promptTriggerBuildQuestions = async () => {
  const question = [
    {
      type: "confirm",
      name: "triggerBuild",
      message: "Do you want to trigger a build?",
      default: false,
    },
  ];

  const answer = await inquirer.prompt(question);
  return answer.triggerBuild;
};

export { promptTriggerBuildQuestions };
