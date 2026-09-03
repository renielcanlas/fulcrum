const ROLE_PERMISSIONS = {
  PRODUCT_OWNER: new Set(["assessment:read:own", "evidence:read:own", "jira:read:linked"]),
  FCRM_ANALYST: new Set(["assessment:read", "risk:read", "evidence:read", "policy:read", "jira:read:linked", "override:read", "decision:read"]),
  RISK_COMMITTEE: new Set(["assessment:read", "risk:read", "evidence:read", "policy:read", "jira:read:linked", "override:read", "decision:read", "conditions:read"])
};

export function canRead(user, assessment, resource) {
  if (!user || !assessment || !ROLE_PERMISSIONS[user.role]) return false;
  if (user.role === "PRODUCT_OWNER" && assessment.ownerId !== user.id) return false;
  if (user.role === "PRODUCT_OWNER") return ["assessment:read", "evidence:read", "jira:read:linked"].includes(resource);
  return ROLE_PERMISSIONS[user.role].has(resource) || (user.role === "PRODUCT_OWNER" && resource.endsWith(":own"));
}

export function assertAssessmentAccess(user, assessment, resource = "assessment:read") {
  if (!canRead(user, assessment, resource)) throw new Error("FORBIDDEN");
}
