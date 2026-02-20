import { Badge } from '@/components/ui/badge';
import { Shield, User } from 'lucide-react';

interface RoleBadgeProps {
  role: 'admin' | 'user';
  className?: string;
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const isAdmin = role === 'admin';

  return (
    <Badge
      variant={isAdmin ? 'default' : 'secondary'}
      className={className}
    >
      {isAdmin ? (
        <>
          <Shield className="mr-1 h-3 w-3" />
          Admin
        </>
      ) : (
        <>
          <User className="mr-1 h-3 w-3" />
          User
        </>
      )}
    </Badge>
  );
}
