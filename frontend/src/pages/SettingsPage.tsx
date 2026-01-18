import { useState, useEffect } from 'react'
import {
  Card,
  CardBody,
  CardHeader,
  Input,
  Button,
  Divider,
} from '@heroui/react'
import { settingsApi } from '../services/api'

interface Setting {
  key: string
  value: string | number | boolean
  value_type: string
  description: string
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<Record<string, string>>({})

  const fetchSettings = async () => {
    try {
      // Initialize settings first
      await settingsApi.init()
      
      const response = await settingsApi.list()
      setSettings(response.data.data)
      
      // Initialize form data
      const data: Record<string, string> = {}
      response.data.data.forEach((s: Setting) => {
        data[s.key] = String(s.value)
      })
      setFormData(data)
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  const handleSave = async () => {
    try {
      setSaving(true)
      
      // Convert form data to proper types
      const settingsData: Record<string, unknown> = {}
      settings.forEach((s) => {
        const value = formData[s.key]
        if (s.value_type === 'int') {
          settingsData[s.key] = parseInt(value) || 0
        } else if (s.value_type === 'bool') {
          settingsData[s.key] = value === 'true'
        } else {
          settingsData[s.key] = value
        }
      })
      
      await settingsApi.updateBatch(settingsData)
      alert('Settings saved successfully!')
    } catch (error) {
      console.error('Failed to save settings:', error)
      alert('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const groupedSettings = {
    'API Configuration': settings.filter(s => 
      s.key.includes('api') || s.key.includes('url') || s.key.includes('key')
    ),
    'Rate Limiting': settings.filter(s => 
      s.key.includes('limit') || s.key.includes('delay')
    ),
    'Account Settings': settings.filter(s => 
      s.key.includes('account') && !s.key.includes('limit')
    ),
    'Selection Strategies': settings.filter(s => 
      s.key.includes('strategy') || s.key.includes('selection')
    ),
  }

  if (loading) {
    return <div>Loading settings...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">System Settings</h1>
        <Button color="primary" onPress={handleSave} isLoading={saving}>
          Save Settings
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(groupedSettings).map(([group, groupSettings]) => (
          groupSettings.length > 0 && (
            <Card key={group}>
              <CardHeader>
                <h3 className="text-lg font-semibold">{group}</h3>
              </CardHeader>
              <Divider />
              <CardBody>
                <div className="flex flex-col gap-4">
                  {groupSettings.map((setting) => (
                    <Input
                      key={setting.key}
                      label={setting.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      description={setting.description}
                      value={formData[setting.key] || ''}
                      type={setting.value_type === 'int' ? 'number' : 'text'}
                      onChange={(e) => setFormData({
                        ...formData,
                        [setting.key]: e.target.value
                      })}
                    />
                  ))}
                </div>
              </CardBody>
            </Card>
          )
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <h3 className="text-lg font-semibold">All Settings</h3>
        </CardHeader>
        <Divider />
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {settings.map((setting) => (
              <Input
                key={setting.key}
                label={setting.key}
                description={setting.description}
                value={formData[setting.key] || ''}
                type={setting.value_type === 'int' ? 'number' : 'text'}
                onChange={(e) => setFormData({
                  ...formData,
                  [setting.key]: e.target.value
                })}
              />
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
