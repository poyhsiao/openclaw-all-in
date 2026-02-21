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
import { Plus, Trash2, Star, Cpu } from 'lucide-react'
import { Model } from '@/services/config-hooks'

interface ModelsSectionProps {
  models: Model[]
  onAddModel: () => void
  onDeleteModel: (id: string) => void
  onSetDefault: (id: string) => void
}

export function ModelsSection({ models, onAddModel, onDeleteModel, onSetDefault }: ModelsSectionProps) {
  const getProviderBadgeColor = (provider: Model['provider']) => {
    switch (provider) {
      case 'ollama':
        return 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20'
      case 'openai':
        return 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
      case 'anthropic':
        return 'bg-orange-500/10 text-orange-500 hover:bg-orange-500/20'
      case 'google':
        return 'bg-purple-500/10 text-purple-500 hover:bg-purple-500/20'
      default:
        return 'bg-gray-500/10 text-gray-500 hover:bg-gray-500/20'
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="h-5 w-5" />
              Models
            </CardTitle>
            <CardDescription>
              Manage AI models for inference
            </CardDescription>
          </div>
          <Button onClick={onAddModel} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Model
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {models.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Cpu className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No models configured</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add your first AI model to get started
            </p>
            <Button onClick={onAddModel} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Model
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Model ID</TableHead>
                <TableHead>Temperature</TableHead>
                <TableHead>Max Tokens</TableHead>
                <TableHead>Default</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {models.map((model) => (
                <TableRow key={model.id}>
                  <TableCell className="font-medium">{model.name}</TableCell>
                  <TableCell>
                    <Badge className={getProviderBadgeColor(model.provider)}>
                      {model.provider}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{model.modelId}</TableCell>
                  <TableCell>{model.temperature ?? '-'}</TableCell>
                  <TableCell>{model.maxTokens ?? '-'}</TableCell>
                  <TableCell>
                    {model.isDefault ? (
                      <Badge variant="secondary" className="gap-1">
                        <Star className="h-3 w-3 fill-current" />
                        Default
                      </Badge>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onSetDefault(model.id)}
                        aria-label={`Set ${model.name} as default`}
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteModel(model.id)}
                      disabled={model.isDefault}
                      aria-label={`Delete ${model.name}`}
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
