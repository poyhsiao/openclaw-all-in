import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ModelsSection } from '@/components/config/models-section'
import { ApiKeysSection } from '@/components/config/api-keys-section'
import { EnvVarsSection } from '@/components/config/env-vars-section'
import { AddModelDialog } from '@/components/config/add-model-dialog'
import { AddApiKeyDialog } from '@/components/config/add-api-key-dialog'
import { useModels, useApiKeys, useEnvVars, useConfigMutations } from '@/services/config-hooks'
import { ModelFormData, ApiKeyFormData } from '@/services/config-hooks'
import { toast } from 'sonner'

export const Route = createFileRoute('/config')({
  component: Config,
})

export function Config() {
  const [activeTab, setActiveTab] = useState('models')
  const [isAddModelDialogOpen, setIsAddModelDialogOpen] = useState(false)
  const [isAddApiKeyDialogOpen, setIsAddApiKeyDialogOpen] = useState(false)

  const { data: models } = useModels()
  const { data: apiKeys } = useApiKeys()
  const { data: envVars } = useEnvVars()

  const {
    createModel,
    deleteModel,
    setDefaultModel,
    createApiKey,
    deleteApiKey,
    toggleApiKey,
    deleteEnvVar,
  } = useConfigMutations()

  const handleAddModel = async (data: ModelFormData) => {
    try {
      await createModel.mutateAsync(data)
      setIsAddModelDialogOpen(false)
      toast.success('Model added successfully')
    } catch (error) {
      toast.error('Failed to add model')
    }
  }

  const handleDeleteModel = async (id: string) => {
    try {
      await deleteModel.mutateAsync(id)
      toast.success('Model deleted successfully')
    } catch (error) {
      toast.error('Failed to delete model')
    }
  }

  const handleSetDefaultModel = async (id: string) => {
    try {
      await setDefaultModel.mutateAsync(id)
      toast.success('Default model updated')
    } catch (error) {
      toast.error('Failed to set default model')
    }
  }

  const handleAddApiKey = async (data: ApiKeyFormData) => {
    try {
      await createApiKey.mutateAsync(data)
      setIsAddApiKeyDialogOpen(false)
      toast.success('API key added successfully')
    } catch (error) {
      toast.error('Failed to add API key')
    }
  }

  const handleDeleteApiKey = async (id: string) => {
    try {
      await deleteApiKey.mutateAsync(id)
      toast.success('API key deleted successfully')
    } catch (error) {
      toast.error('Failed to delete API key')
    }
  }

  const handleToggleApiKey = async (id: string, isActive: boolean) => {
    try {
      await toggleApiKey.mutateAsync({ id, isActive })
      toast.success(`API key ${isActive ? 'activated' : 'deactivated'}`)
    } catch (error) {
      toast.error('Failed to toggle API key')
    }
  }

  const handleDeleteEnvVar = async (id: string) => {
    try {
      await deleteEnvVar.mutateAsync(id)
      toast.success('Environment variable deleted successfully')
    } catch (error) {
      toast.error('Failed to delete environment variable')
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Configuration</h1>
        <p className="text-muted-foreground">
          Manage models, API keys, and system settings
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="models">Models</TabsTrigger>
          <TabsTrigger value="api-keys">API Keys</TabsTrigger>
          <TabsTrigger value="env-vars">Environment Variables</TabsTrigger>
        </TabsList>

        <TabsContent value="models" className="mt-6">
          <ModelsSection
            models={models || []}
            onAddModel={() => setIsAddModelDialogOpen(true)}
            onDeleteModel={handleDeleteModel}
            onSetDefault={handleSetDefaultModel}
          />
        </TabsContent>

        <TabsContent value="api-keys" className="mt-6">
          <ApiKeysSection
            apiKeys={apiKeys || []}
            onAddApiKey={() => setIsAddApiKeyDialogOpen(true)}
            onDeleteApiKey={handleDeleteApiKey}
            onToggleApiKey={handleToggleApiKey}
          />
        </TabsContent>

        <TabsContent value="env-vars" className="mt-6">
          <EnvVarsSection
            envVars={envVars || []}
            onAddEnvVar={() => {}}
            onDeleteEnvVar={handleDeleteEnvVar}
          />
        </TabsContent>
      </Tabs>

      <AddModelDialog
        open={isAddModelDialogOpen}
        onOpenChange={setIsAddModelDialogOpen}
        onSubmit={handleAddModel}
        isSubmitting={createModel.isPending}
      />

      <AddApiKeyDialog
        open={isAddApiKeyDialogOpen}
        onOpenChange={setIsAddApiKeyDialogOpen}
        onSubmit={handleAddApiKey}
        isSubmitting={createApiKey.isPending}
      />
    </div>
  )
}
