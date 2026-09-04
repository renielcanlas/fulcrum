import {findDemoUser} from "../auth/demo-users.js";
import {assignJiraWorkItem, getJiraWorkItem} from "./jira.js";

export async function assignJiraPersona({issueKey, personaId, cloudId, accessToken, siteUrl, fetchImpl = fetch}) {
  const persona = findDemoUser(personaId);
  if (!persona?.jiraIdentity?.jiraAccountId || persona.jiraIdentity.jiraAccountId.startsWith("jira-")) throw new Error("invalid_persona_jira_mapping");
  await assignJiraWorkItem({issueKey, accountId: persona.jiraIdentity.jiraAccountId, cloudId, accessToken, fetchImpl});
  const verified = await getJiraWorkItem({issueKey, cloudId, accessToken, siteUrl, fetchImpl});
  if (verified.assigneeAccountId !== persona.jiraIdentity.jiraAccountId) throw new Error(`jira_assignment_not_verified: expected ${persona.displayName}, Jira returned ${verified.assignee ?? "Unassigned"}`);
  return {issueKey, personaId: persona.id, assignee: persona.displayName, verified: true};
}
