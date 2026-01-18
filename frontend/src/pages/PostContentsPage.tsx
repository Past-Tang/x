import { useState, useEffect } from 'react'
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Input,
  Textarea,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Chip,
} from '@heroui/react'
import { postContentsApi } from '../services/api'

interface PostContent {
  id: number
  text: string
  link: string | null
  status: string
  sort_order: number
  usage_count: number
  last_used_at: string | null
}

export default function PostContentsPage() {
  const [contents, setContents] = useState<PostContent[]>([])
  const [loading, setLoading] = useState(true)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [editingContent, setEditingContent] = useState<PostContent | null>(null)
  const [formData, setFormData] = useState({
    text: '',
    link: '',
  })

  const fetchContents = async () => {
    try {
      const response = await postContentsApi.list()
      setContents(response.data.data)
    } catch (error) {
      console.error('Failed to fetch contents:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchContents()
  }, [])

  const handleOpenCreate = () => {
    setEditingContent(null)
    setFormData({
      text: '',
      link: '',
    })
    onOpen()
  }

  const handleOpenEdit = (content: PostContent) => {
    setEditingContent(content)
    setFormData({
      text: content.text,
      link: content.link || '',
    })
    onOpen()
  }

  const handleSubmit = async () => {
    try {
      const data = {
        text: formData.text,
        link: formData.link || null,
      }

      if (editingContent) {
        await postContentsApi.update(editingContent.id, data)
      } else {
        await postContentsApi.create(data)
      }
      
      onClose()
      fetchContents()
    } catch (error) {
      console.error('Failed to save content:', error)
    }
  }

  const handleToggleStatus = async (id: number) => {
    try {
      await postContentsApi.toggleStatus(id)
      fetchContents()
    } catch (error) {
      console.error('Failed to toggle status:', error)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除此内容吗？')) return
    try {
      await postContentsApi.delete(id)
      fetchContents()
    } catch (error) {
      console.error('Failed to delete content:', error)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">发推内容池</h1>
        <Button color="primary" onPress={handleOpenCreate}>
          添加内容
        </Button>
      </div>

      <Table aria-label="发推内容表格">
        <TableHeader>
          <TableColumn>排序</TableColumn>
          <TableColumn>文本</TableColumn>
          <TableColumn>链接</TableColumn>
          <TableColumn>状态</TableColumn>
          <TableColumn>使用情况</TableColumn>
          <TableColumn>操作</TableColumn>
        </TableHeader>
        <TableBody isLoading={loading} emptyContent="暂无内容">
          {contents.map((content) => (
            <TableRow key={content.id}>
              <TableCell>{content.sort_order}</TableCell>
              <TableCell>
                <div className="max-w-md truncate">{content.text}</div>
              </TableCell>
              <TableCell>
                {content.link ? (
                  <a 
                    href={content.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline truncate max-w-xs block"
                  >
                    {content.link}
                  </a>
                ) : '-'}
              </TableCell>
              <TableCell>
                <Chip 
                  color={content.status === 'active' ? 'success' : 'default'} 
                  size="sm"
                >
                  {content.status === 'active' ? '启用' : '停用'}
                </Chip>
              </TableCell>
              <TableCell>
                <div className="text-xs">
                  <div>次数: {content.usage_count}</div>
                  {content.last_used_at && (
                    <div>最后: {new Date(content.last_used_at).toLocaleString()}</div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button size="sm" variant="flat" onPress={() => handleOpenEdit(content)}>
                    编辑
                  </Button>
                  <Button 
                    size="sm" 
                    variant="flat"
                    color={content.status === 'active' ? 'warning' : 'success'}
                    onPress={() => handleToggleStatus(content.id)}
                  >
                    {content.status === 'active' ? '停用' : '启用'}
                  </Button>
                  <Button size="sm" variant="flat" color="danger" onPress={() => handleDelete(content.id)}>
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
            {editingContent ? '编辑内容' : '添加内容'}
          </ModalHeader>
          <ModalBody>
            <div className="flex flex-col gap-4">
              <Textarea
                label="推文文本"
                placeholder="输入推文文本..."
                value={formData.text}
                onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                minRows={3}
                isRequired
              />
              <Input
                label="链接（可选）"
                placeholder="https://..."
                value={formData.link}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
              />
              {formData.text && (
                <div className="p-3 bg-gray-100 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">预览：</p>
                  <p className="whitespace-pre-wrap">
                    {formData.text}
                    {formData.link && `\n${formData.link}`}
                  </p>
                </div>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={onClose}>
              取消
            </Button>
            <Button color="primary" onPress={handleSubmit}>
              {editingContent ? '更新' : '创建'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  )
}
