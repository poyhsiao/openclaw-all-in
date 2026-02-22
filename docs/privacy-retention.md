# Privacy and Data Retention Policy

## Overview

This document outlines the privacy and data retention practices for the OpenClaw platform, specifically addressing the Personal Identifiable Information (PII) stored in the audit log system.

## Audit Log PII

The audit log table stores the following PII fields:
- **ipAddress**: IP address of the user triggering the action
- **userAgent**: User agent string (browser, device, OS information)

### Legal Justification

These fields are stored for:
1. **Security audits**: Tracking suspicious activity and identifying potential security threats
2. **Compliance requirements**: Maintaining audit trails for regulatory compliance
3. **Forensic investigation**: Supporting investigations into security incidents

## Data Retention Policy

### Retention Period
- **Maximum retention**: 90 days
- **Default retention**: 30 days
- **Exceptions**: Records involved in ongoing security investigations may be retained longer with explicit authorization

### Automated Purge Mechanism

Implementation required:
1. **Scheduled job**: Run weekly to identify and purge expired records
2. **Archival**: Export records before deletion for compliance purposes
3. **Notification**: Alert administrators before purge execution

```typescript
// Example purge job (implement as needed)
export async function purgeOldAuditLogs(retentionDays: number = 30): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  return prisma.audit.deleteMany({
    where: {
      createdAt: {
        lt: cutoffDate,
      },
    },
  });
}
```

### Implementation Status
- [x] Schema includes PII fields (ipAddress, userAgent)
- [ ] Scheduled purge mechanism implemented
- [ ] Archival mechanism implemented
- [ ] Documentation maintained
- [ ] Access controls defined

## Data Access and Security

### Access Controls
1. **Role-based access**: Only admin users can view PII fields
2. **Logging**: All access to PII fields is logged
3. **Masking in UI**: Default views mask IP addresses and user agents

### Backup Procedures
1. **Encrypted backups**: All backups containing PII are encrypted
2. **Restricted access**: Backup files are stored in secure, access-controlled storage
3. **Retention period**: Backup files follow same retention policy as live data

## Compliance Notes

- Ensure this policy aligns with applicable data protection regulations (GDPR, CCPA, etc.)
- Document any legal requirements for extending retention periods
- Update this policy when regulatory requirements change

## References

- Prisma schema: `api-server/prisma/schema.prisma`
- Migration file: `api-server/prisma/migrations/20260218143831_init/migration.sql`
