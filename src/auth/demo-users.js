export const DEMO_USERS = Object.freeze([
  {id:"po-1", displayName:"Maya Chen", email:"maya.chen@fulcrum.demo", role:"PRODUCT_OWNER", jiraIdentity:{jiraAccountId:"jira-po-1", jiraDisplayName:"Maya Chen"}, active:true},
  {id:"po-2", displayName:"Marcus Thompson", email:"marcus.thompson@fulcrum.demo", role:"PRODUCT_OWNER", jiraIdentity:{jiraAccountId:"jira-po-2", jiraDisplayName:"Marcus Thompson"}, active:true},
  {id:"analyst-7", displayName:"Daniel Reyes", email:"daniel.reyes@fulcrum.demo", role:"FCRM_ANALYST", jiraIdentity:{jiraAccountId:"jira-analyst-7", jiraDisplayName:"Daniel Reyes"}, active:true},
  {id:"analyst-8", displayName:"Priya Shah", email:"priya.shah@fulcrum.demo", role:"FCRM_ANALYST", jiraIdentity:{jiraAccountId:"jira-analyst-8", jiraDisplayName:"Priya Shah"}, active:true},
  {id:"committee-1", displayName:"Helen Morgan", email:"helen.morgan@fulcrum.demo", role:"RISK_COMMITTEE", jiraIdentity:{jiraAccountId:"jira-committee-1", jiraDisplayName:"Helen Morgan"}, active:true},
  {id:"committee-2", displayName:"Robert Kim", email:"robert.kim@fulcrum.demo", role:"RISK_COMMITTEE", jiraIdentity:{jiraAccountId:"jira-committee-2", jiraDisplayName:"Robert Kim"}, active:true}
]);

export function findDemoUser(id) { return DEMO_USERS.find(user => user.id === id && user.active); }
