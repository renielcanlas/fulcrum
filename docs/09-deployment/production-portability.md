# Production portability

The core domain remains portable because deployment, database, AI, Jira, and secret-provider concerns are adapters. A bank-approved Azure mapping could use Static Web Apps/App Service/Functions, Azure Database for PostgreSQL, Key Vault, Application Insights/Azure Monitor, and Sentinel or the bank SIEM. An AWS mapping could use Amplify or CloudFront/Lambda, RDS/Aurora PostgreSQL, Secrets Manager, CloudWatch, and the bank SIEM. These are target examples, not a production platform claim.
