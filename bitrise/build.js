import axios from "axios";

const triggerBuild = async (token, branch, appSlug, workflowID) => {
  await axios
    .post(
      `https://api.bitrise.io/v0.1/apps/${appSlug}/builds`,
      {
        hook_info: {
          type: "bitrise",
        },
        build_params: {
          branch: branch,
          workflow_id: workflowID,
        },
      },
      {
        headers: {
          Authorization: token,
          "Content-Type": "application/json",
        },
      }
    )
    .then((response) => {
      if (response.status === "ok") {
        return `${workflowID} triggered successfully`;
      }
    })
    .catch((error) => {
      console.error("Error triggering build:", error);
      return "Error triggering build";
    });
};

export { triggerBuild };
