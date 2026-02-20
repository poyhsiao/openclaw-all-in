import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useUsers, useUserMutations, useAuditLogs, User } from '@/services/user-hooks';
import { UserList } from '@/components/users/user-list';
import { UserForm } from '@/components/users/user-form';
import { AuditLogViewer } from '@/components/users/audit-log';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { UserPlus, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export const Route = createFileRoute('/users')({
  component: Users,
});

export function Users() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('users');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { toast } = useToast();

  const { data: usersData, isLoading: usersLoading } = useUsers(page, 10, search);
  const { data: auditLogsData, isLoading: auditLogsLoading } = useAuditLogs();
  const { createUser, updateUser, deleteUser } = useUserMutations();

  const handleAddUser = async (data: any) => {
    try {
      await createUser.mutateAsync(data);
      setAddDialogOpen(false);
      toast({
        title: 'Success',
        description: 'User created successfully',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create user',
      });
    }
  };

  const handleEditUser = async (data: any) => {
    if (!selectedUser) return;
    try {
      await updateUser.mutateAsync({ id: selectedUser.id, data });
      setEditDialogOpen(false);
      setSelectedUser(null);
      toast({
        title: 'Success',
        description: 'User updated successfully',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update user',
      });
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    try {
      await deleteUser.mutateAsync(selectedUser.id);
      setDeleteDialogOpen(false);
      setSelectedUser(null);
      toast({
        title: 'Success',
        description: 'User deleted successfully',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete user',
      });
    }
  };

  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (user: User) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const totalPages = usersData ? Math.ceil(usersData.total / 10) : 1;
  const pageActive = usersData?.users.filter((u) => u.status === 'active').length || 0;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">User Management</h1>
        <p className="text-muted-foreground">
          Manage user accounts and permissions
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="audit-logs">Audit Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Users</CardTitle>
                  <CardDescription>
                    {usersData?.total || 0} total users,{' '}
                    {pageActive} active on this page
                  </CardDescription>
                </div>
                <Button onClick={() => setAddDialogOpen(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  className="max-w-sm"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
              <UserList
                users={usersData?.users || []}
                isLoading={usersLoading}
                onEdit={openEditDialog}
                onDelete={openDeleteDialog}
              />
              {totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit-logs">
          <Card>
            <CardHeader>
              <CardTitle>Audit Logs</CardTitle>
              <CardDescription>
                Track all user actions and system events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AuditLogViewer
                logs={auditLogsData?.logs || []}
                isLoading={auditLogsLoading}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account with appropriate permissions
            </DialogDescription>
          </DialogHeader>
          <UserForm
            onSubmit={handleAddUser}
            isSubmitting={createUser.isPending}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and permissions
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <UserForm
              defaultValues={{
                email: selectedUser.email,
                name: selectedUser.name,
                role: selectedUser.role,
                status: selectedUser.status,
              }}
              onSubmit={handleEditUser}
              isSubmitting={updateUser.isPending}
              isEdit
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedUser?.name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleDeleteUser()
              }}
              disabled={deleteUser.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteUser.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
