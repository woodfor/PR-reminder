import { google } from "googleapis";
import _ from "lodash";

const getDocInfo = async (auth, docId) => {
  const service = google.docs({ version: "v1", auth });
  const request = {
    documentId: docId,
  };
  try {
    const response = await service.documents.get(request);
    return response.data;
  } catch (err) {
    console.error(err);
    return [];
  }
};

export { getDocInfo };
