import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Search, Download, Trash2, RefreshCw, 
  HardDrive, Cpu, Clock, CheckCircle, XCircle 
} from 'lucide-react'

export const Route = createFileRoute('/config/models')({
  component: ConfigModelsPage,
})

interface Model {
  id: string
  name: string
  size: string
  status: 'ready' | 'downloading' | 'error'
  progress?: number
  lastUsed?: string
}

const mockModels: Model[] = [
  { id: '1', name: 'llama3.2:3b', size: '3.8GB', status: 'ready', lastUsed: '2 min ago' },
  { id: '2', name: 'qwen2.5:3b', size: '2.4GB', status: 'ready', lastUsed: '15 min ago' },
  { id: '3', name: 'codellama:7b', size: '3.8GB', status: 'ready' },
  { id: '4', name: 'mistral:7b', size: '4.1GB', status: 'downloading', progress: 65 },
  { id: '5', name: 'phi3:mini', size: '2.3GB', status: 'error' },
]

function ConfigModelsPage() {
  const [models] = useState<Model[]>(mockModels)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredModels = models.filter(model =>
    model.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const readyModels = filteredModels.filter(m => m.status === 'ready')
  const downloadingModels = filteredModels.filter(m => m.status === 'downloading')
  const errorModels = filteredModels.filter(m => m.status === 'error')

  return (
    <div className="p-6 h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Model Configuration</h1>
          <p className="text-muted-foreground">Manage Ollama models</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Pull Model
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-6">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search models..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">
            All ({filteredModels.length})
          </TabsTrigger>
          <TabsTrigger value="ready">
            Ready ({readyModels.length})
          </TabsTrigger>
          <TabsTrigger value="downloading">
            Downloading ({downloadingModels.length})
          </TabsTrigger>
          <TabsTrigger value="error">
            Error ({errorModels.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredModels.map(model => (
              <ModelCard key={model.id} model={model} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="ready" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {readyModels.map(model => (
              <ModelCard key={model.id} model={model} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="downloading" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {downloadingModels.map(model => (
              <ModelCard key={model.id} model={model} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="error" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {errorModels.map(model => (
              <ModelCard key={model.id} model={model} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ModelCard({ model }: { model: Model }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{model.name}</CardTitle>
          <Badge variant={model.status === 'ready' ? 'default' : model.status === 'downloading' ? 'secondary' : 'destructive'}>
            {model.status === 'ready' && <CheckCircle className="h-3 w-3 mr-1" />}
            {model.status === 'downloading' && <Clock className="h-3 w-3 mr-1" />}
            {model.status === 'error' && <XCircle className="h-3 w-3 mr-1" />}
            {model.status}
          </Badge>
        </div>
        <CardDescription>{model.size}</CardDescription>
      </CardHeader>
      <CardContent>
        {model.status === 'downloading' && model.progress !== undefined && (
          <div className="mb-4">
            <div className="flex justify-between text-xs mb-1">
              <span>Downloading...</span>
              <span>{model.progress}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all" 
                style={{ width: `${model.progress}%` }}
              />
            </div>
          </div>
        )}
        
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-1">
              <HardDrive className="h-3 w-3" />
              Size
            </span>
            <span>{model.size}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-1">
              <Cpu className="h-3 w-3" />
              Last Used
            </span>
            <span>{model.lastUsed || 'Never'}</span>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          {model.status === 'ready' ? (
            <Button variant="outline" size="sm" className="flex-1">
              Use Model
            </Button>
          ) : model.status === 'downloading' ? (
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => {
                // TODO: Implement download cancellation
                console.log('Cancel download for:', model.id)
              }}
            >
              Cancel
            </Button>
          ) : (
            <Button variant="outline" size="sm" className="flex-1">
              Retry
            </Button>
          )}
          <Button variant="ghost" size="sm" aria-label="Delete model">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
