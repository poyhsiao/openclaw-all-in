import { AuditLog } from '@/services/user-hooks';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Clock, User as UserIcon, Activity } from 'lucide-react';

interface AuditLogProps {
  logs: AuditLog[];
  isLoading?: boolean;
}

export function AuditLogViewer({ logs, isLoading }: AuditLogProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Loading audit logs...</div>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Activity className="h-12 w-12 text-muted-foreground/50" />
        <p className="mt-4 text-sm text-muted-foreground">No audit logs found</p>
      </div>
    );
  }

  const getActionBadgeVariant = (action: string) => {
    const actionLower = action.toLowerCase();
    if (actionLower.includes('create') || actionLower.includes('add')) {
      return 'default';
    }
    if (actionLower.includes('update') || actionLower.includes('edit')) {
      return 'secondary';
    }
    if (actionLower.includes('delete') || actionLower.includes('remove')) {
      return 'destructive';
    }
    return 'outline';
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[180px]">Timestamp</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Details</TableHead>
            <TableHead className="w-[140px]">IP Address</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log.id}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  {new Date(log.timestamp).toLocaleString()}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4 text-muted-foreground" />
                  <span>{log.userName}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={getActionBadgeVariant(log.action)}>
                  {log.action}
                </Badge>
              </TableCell>
              <TableCell className="max-w-md truncate">{log.details}</TableCell>
              <TableCell className="text-muted-foreground">
                {log.ipAddress || '-'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
