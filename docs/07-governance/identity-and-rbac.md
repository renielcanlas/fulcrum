# Identity and RBAC

The demo persona selector creates a server-side FULCRUM session for one of six synthetic users: Maya Chen and Marcus Thompson (`PRODUCT_OWNER`); Daniel Reyes and Priya Shah (`FCRM_ANALYST`); Helen Morgan and Robert Kim (`RISK_COMMITTEE`). Each user has ID, display name, synthetic email, role, active status, and optional `JiraIdentity` metadata (`jiraAccountId`, display name, cloud ID, connection status).

Production identity is an explicit future boundary: enterprise OIDC/SAML, MFA, centralized IAM, managed provisioning/deprovisioning, session policy, and access recertification. Do not use Jira OAuth to authenticate or authorize FCRM decisions.

RBAC is enforced server-side. Product Owners operate only on their own permitted drafts/evidence/conditions; Analysts review and mark readiness, manage authorized configuration, and verify conditions; Committee members review, vote, and decide. No frontend control is security-relevant.
