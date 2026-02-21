import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, Copy, Eye, EyeOff, Database } from 'lucide-react'
import { EnvVar } from '@/services/config-hooks'
import { toast } from 'sonner'
import { useState } from 'react'

interface EnvVarsSectionProps {
  envVars: EnvVar[]
  onAddEnvVar: () => void
  onDeleteEnvVar: (id: string) => void
}

export function EnvVarsSection({ envVars, onAddEnvVar, onDeleteEnvVar }: EnvVarsSectionProps) {
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set())

  const toggleVisibility = (id: string) => {
    setVisibleKeys((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleCopyValue = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      toast.success('Value copied to clipboard')
    } catch (error) {
      console.error('Failed to copy value:', error)
      toast.error('Failed to copy value')
    }
  }

  const maskValue = (value: string) => {
    if (value.length <= 4) return '•'.repeat(value.length)
    return `${value.slice(0, 2)}${'•'.repeat(Math.min(value.length - 4, 20))}${value.slice(-2)}`
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Environment Variables
            </CardTitle>
            <CardDescription>
              Manage system environment variables
            </CardDescription>
          </div>
          <Button onClick={onAddEnvVar} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Variable
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {envVars.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Database className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No environment variables configured</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add your first environment variable to configure the system
            </p>
            <Button onClick={onAddEnvVar} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Variable
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Key</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Sensitive</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {envVars.map((envVar) => (
                <TableRow key={envVar.id}>
                  <TableCell className="font-medium font-mono text-sm">
                    {envVar.key}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="text-sm bg-muted px-2 py-1 rounded max-w-[200px] truncate">
                        {envVar.isSensitive && !visibleKeys.has(envVar.id)
                          ? envVar.maskedValue || maskValue(envVar.value)
                          : envVar.value}
                      </code>
                      {envVar.isSensitive && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => toggleVisibility(envVar.id)}
                        >
                          {visibleKeys.has(envVar.id) ? (
                            <EyeOff className="h-3 w-3" />
                          ) : (
                            <Eye className="h-3 w-3" />
                          )}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => handleCopyValue(envVar.value)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    {envVar.isSensitive ? (
                      <Badge variant="destructive">Sensitive</Badge>
                    ) : (
                      <Badge variant="secondary">Public</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {envVar.description || '-'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {new Date(envVar.updatedAt).toLocaleDateString()}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteEnvVar(envVar.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
