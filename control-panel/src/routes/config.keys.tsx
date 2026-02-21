import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Key, Plus, Copy, Trash2, Eye, EyeOff, 
  CheckCircle, XCircle, Clock, RefreshCw 
} from 'lucide-react'

export const Route = createFileRoute('/config/keys')({
  component: ConfigKeysPage,
})

interface ApiKey {
  id: string
  name: string
  key: string
  prefix: string
  status: 'active' | 'expired' | 'revoked'
  createdAt: string
  expiresAt: string
  lastUsed?: string
}

const mockKeys: ApiKey[] = [
  { 
    id: 'key-001', 
    name: 'Production API Key', 
    key: 'sk-live-xxxx-xxxx-xxxx-xxxx',
    prefix: 'sk-live-',
    status: 'active', 
    createdAt: '2026-01-15T10:30:00Z',
    expiresAt: '2027-01-15T10:30:00Z',
    lastUsed: '2 min ago'
  },
  { 
    id: 'key-002', 
    name: 'Development Key', 
    key: 'sk-test-xxxx-xxxx-xxxx-xxxx',
    prefix: 'sk-test-',
    status: 'active', 
    createdAt: '2026-02-01T14:20:00Z',
    expiresAt: '2026-08-01T14:20:00Z',
  },
  { 
    id: 'key-003', 
    name: 'Old Key', 
    key: 'sk-live-xxxx-xxxx-xxxx-xxxx',
    prefix: 'sk-live-',
    status: 'expired', 
    createdAt: '2025-06-01T09:00:00Z',
    expiresAt: '2026-06-01T09:00:00Z',
    lastUsed: '30 days ago'
  },
]

function ConfigKeysPage() {
  const [keys] = useState<ApiKey[]>(mockKeys)
  const [showKey, setShowKey] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const copyToClipboard = (key: string, id: string) => {
    navigator.clipboard.writeText(key)
      .then(() => {
        setCopiedKey(id)
        setTimeout(() => setCopiedKey(null), 2000)
      })
      .catch(err => {
        console.error('Failed to copy:', err)
        // Optionally show error to user
      })
  }

  return (
    <div className="p-6 h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">API Keys</h1>
          <p className="text-muted-foreground">Manage your API keys for external access</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Key
        </Button>
      </div>

      <div className="space-y-4">
        {keys.map(apiKey => (
          <Card key={apiKey.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Key className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <CardTitle className="text-lg">{apiKey.name}</CardTitle>
                    <CardDescription>
                      Created {new Date(apiKey.createdAt).toLocaleDateString()}
                    </CardDescription>
                  </div>
                </div>
                <Badge variant={apiKey.status === 'active' ? 'default' : apiKey.status === 'expired' ? 'secondary' : 'destructive'}>
                  {apiKey.status === 'active' && <CheckCircle className="h-3 w-3 mr-1" />}
                  {apiKey.status === 'expired' && <Clock className="h-3 w-3 mr-1" />}
                  {apiKey.status === 'revoked' && <XCircle className="h-3 w-3 mr-1" />}
                  {apiKey.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-2 bg-muted rounded text-sm font-mono">
                    {showKey === apiKey.id ? apiKey.key : apiKey.prefix + '••••••••••••••••'}
                  </code>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setShowKey(showKey === apiKey.id ? null : apiKey.id)}
                    aria-label={showKey === apiKey.id ? "Hide API key" : "Show API key"}
                  >
                    {showKey === apiKey.id ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => copyToClipboard(apiKey.key, apiKey.id)}
                    aria-label={copiedKey === apiKey.id ? "API key copied" : "Copy API key"}
                  >
                    {copiedKey === apiKey.id ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4 text-muted-foreground">
                    <span>Expires: {new Date(apiKey.expiresAt).toLocaleDateString()}</span>
                    {apiKey.lastUsed && <span>Last used: {apiKey.lastUsed}</span>}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" aria-label="Rotate API key">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Rotate
                    </Button>
                    <Button variant="ghost" size="sm" aria-label="Delete API key">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
