import { useState, useEffect } from 'react'
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Textarea,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Chip,
  Select,
  SelectItem,
} from '@heroui/react'
import { replyTemplatesApi, targetsApi } from '../services/api'

interface ReplyTemplate {
  id: number
  content: string
  status: string
  scope: string
  target_id: number | null
  sort_order: number
  usage_count: number
  last_used_at: string | null
}

interface Target {
  id: number
  target_username: string
  name: string
}

export default function ReplyTemplatesPage() {
  const [templates, setTemplates] = useState<ReplyTemplate[]>([])
  const [targets, setTargets] = useState<Target[]>([])
  const [loading, setLoading] = useState(true)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [editingTemplate, setEditingTemplate] = useState<ReplyTemplate | null>(null)
  const [formData, setFormData] = useState({
    content: '',
    scope: 'global',
    target_id: '',
  })

  const fetchData = async () => {
    try {
      const [templatesRes, targetsRes] = await Promise.all([
        replyTemplatesApi.list(),
        targetsApi.list(),
      ])
      setTemplates(templatesRes.data.data)
      setTargets(targetsRes.data.data)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleOpenCreate = () => {
    setEditingTemplate(null)
    setFormData({
      content: '',
      scope: 'global',
      target_id: '',
    })
    onOpen()
  }

  const handleOpenEdit = (template: ReplyTemplate) => {
    setEditingTemplate(template)
    setFormData({
      content: template.content,
      scope: template.scope,
      target_id: template.target_id ? String(template.target_id) : '',
    })
    onOpen()
  }

  const handleSubmit = async () => {
    try {
      const data = {
        content: formData.content,
        scope: formData.scope,
        target_id: formData.scope === 'target' && formData.target_id 
          ? parseInt(formData.target_id) 
          : null,
      }

      if (editingTemplate) {
        await replyTemplatesApi.update(editingTemplate.id, data)
      } else {
        await replyTemplatesApi.create(data)
      }
      
      onClose()
      fetchData()
    } catch (error) {
      console.error('Failed to save template:', error)
    }
  }

  const handleToggleStatus = async (id: number) => {
    try {
      await replyTemplatesApi.toggleStatus(id)
      fetchData()
    } catch (error) {
      console.error('Failed to toggle status:', error)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除此模板吗？')) return
    try {
      await replyTemplatesApi.delete(id)
      fetchData()
    } catch (error) {
      console.error('Failed to delete template:', error)
    }
  }

  const getTargetName = (targetId: number | null) => {
    if (!targetId) return '-'
    const target = targets.find(t => t.id === targetId)
    return target?.target_username || target?.name || `ID: ${targetId}`
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">回复模板</h1>
        <Button color="primary" onPress={handleOpenCreate}>
          添加模板
        </Button>
      </div>

      <Table aria-label="回复模板表格">
        <TableHeader>
          <TableColumn>排序</TableColumn>
          <TableColumn>内容</TableColumn>
          <TableColumn>适用范围</TableColumn>
          <TableColumn>状态</TableColumn>
          <TableColumn>使用情况</TableColumn>
          <TableColumn>操作</TableColumn>
        </TableHeader>
        <TableBody isLoading={loading} emptyContent="暂无模板">
          {templates.map((template) => (
            <TableRow key={template.id}>
              <TableCell>{template.sort_order}</TableCell>
              <TableCell>
                <div className="max-w-md truncate">{template.content}</div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <Chip 
                    color={template.scope === 'global' ? 'primary' : 'secondary'} 
                    size="sm"
                  >
                    {template.scope === 'global' ? '全局' : '指定目标'}
                  </Chip>
                  {template.scope === 'target' && (
                    <span className="text-xs mt-1">{getTargetName(template.target_id)}</span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Chip 
                  color={template.status === 'active' ? 'success' : 'default'} 
                  size="sm"
                >
                  {template.status === 'active' ? '启用' : '停用'}
                </Chip>
              </TableCell>
              <TableCell>
                <div className="text-xs">
                  <div>次数: {template.usage_count}</div>
                  {template.last_used_at && (
                    <div>最后: {new Date(template.last_used_at).toLocaleString()}</div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button size="sm" variant="flat" onPress={() => handleOpenEdit(template)}>
                    编辑
                  </Button>
                  <Button 
                    size="sm" 
                    variant="flat"
                    color={template.status === 'active' ? 'warning' : 'success'}
                    onPress={() => handleToggleStatus(template.id)}
                  >
                    {template.status === 'active' ? '停用' : '启用'}
                  </Button>
                  <Button size="sm" variant="flat" color="danger" onPress={() => handleDelete(template.id)}>
                    删除
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalContent>
          <ModalHeader>
            {editingTemplate ? '编辑模板' : '添加模板'}
          </ModalHeader>
          <ModalBody>
            <div className="flex flex-col gap-4">
              <Textarea
                label="回复内容"
                placeholder="输入回复文本..."
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                minRows={3}
                isRequired
              />
              <Select
                label="适用范围"
                selectedKeys={[formData.scope]}
                onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
              >
                <SelectItem key="global">全局（所有目标）</SelectItem>
                <SelectItem key="target">指定目标</SelectItem>
              </Select>
              {formData.scope === 'target' && (
                <Select
                  label="目标"
                  selectedKeys={formData.target_id ? [formData.target_id] : []}
                  onChange={(e) => setFormData({ ...formData, target_id: e.target.value })}
                >
                  {targets.map((target) => (
                    <SelectItem key={String(target.id)}>
                      {target.target_username || target.name || `ID: ${target.id}`}
                    </SelectItem>
                  ))}
                </Select>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={onClose}>
              取消
            </Button>
            <Button color="primary" onPress={handleSubmit}>
              {editingTemplate ? '更新' : '创建'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  )
}
