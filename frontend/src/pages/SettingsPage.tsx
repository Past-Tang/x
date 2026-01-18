import { useState, useEffect } from 'react'
import {
  Card,
  CardBody,
  Input,
  Button,
  Chip,
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
      alert('设置保存成功！')
    } catch (error) {
      console.error('Failed to save settings:', error)
      alert('保存设置失败')
    } finally {
      setSaving(false)
    }
  }

  const groupedSettings = {
    'API 配置': {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      ),
      color: 'from-blue-500 to-indigo-500',
      settings: settings.filter(s => 
        s.key.includes('api') || s.key.includes('url') || s.key.includes('key')
      ),
    },
    '频率限制': {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'from-emerald-500 to-teal-500',
      settings: settings.filter(s => 
        s.key.includes('limit') || s.key.includes('delay')
      ),
    },
    '账号设置': {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      color: 'from-amber-500 to-orange-500',
      settings: settings.filter(s => 
        s.key.includes('account') && !s.key.includes('limit')
      ),
    },
    '选择策略': {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      ),
      color: 'from-violet-500 to-purple-500',
      settings: settings.filter(s => 
        s.key.includes('strategy') || s.key.includes('selection')
      ),
    },
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Chip color="success" variant="flat" size="sm">
            {settings.length} 项设置
          </Chip>
        </div>
        <Button 
          color="primary" 
          onPress={handleSave} 
          isLoading={saving}
          className="bg-gradient-to-r from-blue-500 to-indigo-500 shadow-lg shadow-blue-500/30"
          startContent={
            !saving && (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
            )
          }
        >
          保存所有设置
        </Button>
      </div>

      {/* Settings Groups */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Object.entries(groupedSettings).map(([group, config]) => (
          config.settings.length > 0 && (
            <Card key={group} className="shadow-lg overflow-hidden">
              <CardBody className="p-0">
                {/* Card Header with Gradient */}
                <div className={`bg-gradient-to-r ${config.color} p-4`}>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg text-white">
                      {config.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{group}</h3>
                      <p className="text-white/70 text-sm">{config.settings.length} 项设置</p>
                    </div>
                  </div>
                </div>
                
                {/* Settings Form */}
                <div className="p-6 space-y-4">
                  {config.settings.map((setting) => (
                    <div key={setting.key} className="group">
                      <Input
                        label={setting.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        description={setting.description}
                        value={formData[setting.key] || ''}
                        type={setting.value_type === 'int' ? 'number' : 'text'}
                        variant="bordered"
                        labelPlacement="outside"
                        classNames={{
                          label: "text-gray-600 font-medium",
                          description: "text-gray-400",
                        }}
                        onChange={(e) => setFormData({
                          ...formData,
                          [setting.key]: e.target.value
                        })}
                      />
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )
        ))}
      </div>

      {/* All Settings Card */}
      <Card className="shadow-xl">
        <CardBody className="p-0">
          <div className="bg-gradient-to-r from-gray-700 to-gray-800 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">所有设置</h3>
                <p className="text-white/70 text-sm">完整配置选项列表</p>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {settings.map((setting) => (
                <Input
                  key={setting.key}
                  label={setting.key}
                  description={setting.description}
                  value={formData[setting.key] || ''}
                  type={setting.value_type === 'int' ? 'number' : 'text'}
                  variant="bordered"
                  labelPlacement="outside"
                  classNames={{
                    label: "text-gray-600 font-medium text-sm",
                    description: "text-gray-400",
                  }}
                  onChange={(e) => setFormData({
                    ...formData,
                    [setting.key]: e.target.value
                  })}
                />
              ))}
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
