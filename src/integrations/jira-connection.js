import {getServiceAccountConnection} from "./jira-oauth.js";

export async function resolveJiraConnection({userId, connections, fetchImpl = fetch} = {}) {
  const serviceAccount = await getServiceAccountConnection({fetchImpl});
  if (serviceAccount) return serviceAccount;
  return connections?.get(userId) ?? null;
}
