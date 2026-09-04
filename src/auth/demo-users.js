export const DEMO_USERS = Object.freeze([
  {id:"po-1", displayName:"Maya Chen", email:"maya.chen@fulcrum.demo", role:"PRODUCT_OWNER", jiraIdentity:{jiraAccountId:"712020:3f099c0f-52b9-4142-88ac-242621a4926c", jiraDisplayName:"Maya Chen"}, active:true},
  {id:"po-2", displayName:"Marcus Thompson", email:"marcus.thompson@fulcrum.demo", role:"PRODUCT_OWNER", jiraIdentity:{jiraAccountId:"712020:ee608ea8-f2ba-4325-8bce-dba7441cfb46", jiraDisplayName:"Marcus Thompson"}, active:true},
  {id:"analyst-7", displayName:"Daniel Reyes", email:"daniel.reyes@fulcrum.demo", role:"FCRM_ANALYST", jiraIdentity:{jiraAccountId:"712020:1516969c-9594-4d0e-939a-7be4509d9d95", jiraDisplayName:"Daniel Reyes"}, active:true},
  {id:"analyst-8", displayName:"Priya Shah", email:"priya.shah@fulcrum.demo", role:"FCRM_ANALYST", jiraIdentity:{jiraAccountId:"712020:51ca2eca-a0cf-4e6d-ad23-287c6ed8688f", jiraDisplayName:"Priya Shah"}, active:true},
  {id:"committee-1", displayName:"Helen Morgan", email:"helen.morgan@fulcrum.demo", role:"RISK_COMMITTEE", jiraIdentity:{jiraAccountId:"712020:733d8375-7e61-41ac-9c72-b7872c62b948", jiraDisplayName:"Helen Morgan"}, active:true},
  {id:"committee-2", displayName:"Robert Kim", email:"robert.kim@fulcrum.demo", role:"RISK_COMMITTEE", jiraIdentity:{jiraAccountId:"712020:23ef0cd3-7c71-4771-a299-c490e4d1d9f0", jiraDisplayName:"Robert Kim"}, active:true}
]);

export function findDemoUser(id) { return DEMO_USERS.find(user => user.id === id && user.active); }
