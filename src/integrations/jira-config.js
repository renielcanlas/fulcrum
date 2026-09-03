import config from "../../data/config/jira-integration.json" with {type: "json"};

export const jiraConfig = Object.freeze(config);
export const JIRA_PROJECT_KEY = jiraConfig.projectKey;
