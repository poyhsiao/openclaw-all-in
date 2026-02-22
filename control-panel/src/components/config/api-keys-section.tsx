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
import { Plus, Trash2, Copy, Key, ToggleLeft, ToggleRight } from 'lucide-react'
import { ApiKey } from '@/services/config-hooks'
import { toast } from 'sonner'

interface ApiKeysSectionProps {
  apiKeys: ApiKey[]
  onAddApiKey: () => void
  onDeleteApiKey: (id: string) => void
  onToggleApiKey: (id: string, isActive: boolean) => void
}

export function ApiKeysSection({ apiKeys, onAddApiKey, onDeleteApiKey, onToggleApiKey }: ApiKeysSectionProps) {
  const getProviderBadgeColor = (provider: ApiKey['provider']) => {
    switch (provider) {
      case 'openai':
        return 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
      case 'anthropic':
        return 'bg-orange-500/10 text-orange-500 hover:bg-orange-500/20'
      case 'google':
        return 'bg-purple-500/10 text-purple-500 hover:bg-purple-500/20'
      case 'custom':
        return 'bg-gray-500/10 text-gray-500 hover:bg-gray-500/20'
      default:
        return 'bg-gray-500/10 text-gray-500 hover:bg-gray-500/20'
    }
  }

  const handleCopyKey = async (key: string) => {
    try {
      await navigator.clipboard.writeText(key)
      toast.success('API key copied to clipboard')
    } catch (error) {
      console.error('Failed to copy API key:', error)
      toast.error('Failed to copy API key')
    }
  }

  const maskKey = (key: string) => {
    if (key.length <= 8) return '•'.repeat(key.length)
    return `${key.slice(0, 4)}${'•'.repeat(key.length - 8)}${key.slice(-4)}`
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              API Keys
            </CardTitle>
            <CardDescription>
              Manage external API keys for services
            </CardDescription>
          </div>
          <Button onClick={onAddApiKey} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add API Key
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {apiKeys.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Key className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No API keys configured</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add your first API key to enable external services
            </p>
            <Button onClick={onAddApiKey} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add API Key
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>API Key</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Used</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apiKeys.map((apiKey) => (
                <TableRow key={apiKey.id}>
                  <TableCell className="font-medium">{apiKey.name}</TableCell>
                  <TableCell>
                    <Badge className={getProviderBadgeColor(apiKey.provider)}>
                      {apiKey.provider}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="text-sm bg-muted px-2 py-1 rounded">
                        {apiKey.maskedKey || maskKey(apiKey.key)}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => handleCopyKey(apiKey.key)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onToggleApiKey(apiKey.id, !apiKey.isActive)}
                      className="gap-1"
                    >
                      {apiKey.isActive ? (
                        <>
                          <ToggleRight className="h-4 w-4 text-green-500" />
                          <span className="text-green-500">Active</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Inactive</span>
                        </>
                      )}
                    </Button>
                  </TableCell>
                  <TableCell>
                    {apiKey.lastUsed ? (
                      <span className="text-sm text-muted-foreground">
                        {new Date(apiKey.lastUsed).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Never</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteApiKey(apiKey.id)}
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
