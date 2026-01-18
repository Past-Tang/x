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
import { targetsApi } from '../services/api'

interface Target {
  id: number
  target_user_id: string
  target_username: string | null
  name: string | null
  status: string
  check_interval_minutes: number
  fetch_tweet_count: number
  max_new_tweets_per_check: number
  last_seen_tweet_id: string | null
  last_check_at: string | null
  last_check_result: string | null
  last_check_error: string | null
  total_tweets_found: number
  total_replies_sent: number
  next_check_at: string | null
}

export default function TargetsPage() {
  const [targets, setTargets] = useState<Target[]>([])
  const [loading, setLoading] = useState(true)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [editingTarget, setEditingTarget] = useState<Target | null>(null)
  const [formData, setFormData] = useState({
    target_user_id: '',
    target_username: '',
    name: '',
    check_interval_minutes: 15,
    fetch_tweet_count: 10,
    max_new_tweets_per_check: 3,
  })

  const fetchTargets = async () => {
    try {
      const response = await targetsApi.list()
      setTargets(response.data.data)
    } catch (error) {
      console.error('Failed to fetch targets:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTargets()
  }, [])

  const handleOpenCreate = () => {
    setEditingTarget(null)
    setFormData({
      target_user_id: '',
      target_username: '',
      name: '',
      check_interval_minutes: 15,
      fetch_tweet_count: 10,
      max_new_tweets_per_check: 3,
    })
    onOpen()
  }

  const handleOpenEdit = (target: Target) => {
    setEditingTarget(target)
    setFormData({
      target_user_id: target.target_user_id,
      target_username: target.target_username || '',
      name: target.name || '',
      check_interval_minutes: target.check_interval_minutes,
      fetch_tweet_count: target.fetch_tweet_count,
      max_new_tweets_per_check: target.max_new_tweets_per_check,
    })
    onOpen()
  }

  const handleSubmit = async () => {
    try {
      const data = {
        target_user_id: formData.target_user_id,
        target_username: formData.target_username || null,
        name: formData.name || null,
        check_interval_minutes: formData.check_interval_minutes,
        fetch_tweet_count: formData.fetch_tweet_count,
        max_new_tweets_per_check: formData.max_new_tweets_per_check,
      }

      if (editingTarget) {
        await targetsApi.update(editingTarget.id, data)
      } else {
        await targetsApi.create(data)
      }
      
      onClose()
      fetchTargets()
    } catch (error) {
      console.error('Failed to save target:', error)
    }
  }

  const handleToggleStatus = async (id: number) => {
    try {
      await targetsApi.toggleStatus(id)
      fetchTargets()
    } catch (error) {
      console.error('Failed to toggle status:', error)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除此监控目标吗？')) return
    try {
      await targetsApi.delete(id)
      fetchTargets()
    } catch (error) {
      console.error('Failed to delete target:', error)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">监控目标</h1>
        <Button color="primary" onPress={handleOpenCreate}>
          添加目标
        </Button>
      </div>

      <Table aria-label="监控目标表格">
        <TableHeader>
          <TableColumn>用户ID</TableColumn>
          <TableColumn>用户名</TableColumn>
          <TableColumn>名称</TableColumn>
          <TableColumn>状态</TableColumn>
          <TableColumn>检查间隔</TableColumn>
          <TableColumn>最后检查</TableColumn>
          <TableColumn>统计</TableColumn>
          <TableColumn>操作</TableColumn>
        </TableHeader>
        <TableBody isLoading={loading} emptyContent="暂无监控目标">
          {targets.map((target) => (
            <TableRow key={target.id}>
              <TableCell>
                <code className="text-xs">{target.target_user_id}</code>
              </TableCell>
              <TableCell>{target.target_username || '-'}</TableCell>
              <TableCell>{target.name || '-'}</TableCell>
              <TableCell>
                <Chip 
                  color={target.status === 'active' ? 'success' : 'default'} 
                  size="sm"
                >
                  {target.status === 'active' ? '启用' : '停用'}
                </Chip>
              </TableCell>
              <TableCell>{target.check_interval_minutes}分钟</TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="text-xs">
                    {target.last_check_at 
                      ? new Date(target.last_check_at).toLocaleString()
                      : '从未'}
                  </span>
                  {target.last_check_result && (
                    <Chip 
                      color={target.last_check_result === 'success' ? 'success' : 'danger'} 
                      size="sm"
                      className="mt-1"
                    >
                      {target.last_check_result === 'success' ? '成功' : '失败'}
                    </Chip>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="text-xs">
                  <div>推文: {target.total_tweets_found}</div>
                  <div>回复: {target.total_replies_sent}</div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button size="sm" variant="flat" onPress={() => handleOpenEdit(target)}>
                    编辑
                  </Button>
                  <Button 
                    size="sm" 
                    variant="flat"
                    color={target.status === 'active' ? 'warning' : 'success'}
                    onPress={() => handleToggleStatus(target.id)}
                  >
                    {target.status === 'active' ? '停用' : '启用'}
                  </Button>
                  <Button size="sm" variant="flat" color="danger" onPress={() => handleDelete(target.id)}>
                    删除
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <ModalHeader>
            {editingTarget ? '编辑目标' : '添加目标'}
          </ModalHeader>
          <ModalBody>
            <div className="flex flex-col gap-4">
              <Input
                label="目标用户ID"
                placeholder="推特用户ID"
                value={formData.target_user_id}
                onChange={(e) => setFormData({ ...formData, target_user_id: e.target.value })}
                isRequired
                isDisabled={!!editingTarget}
              />
              <Input
                label="用户名"
                placeholder="@用户名"
                value={formData.target_username}
                onChange={(e) => setFormData({ ...formData, target_username: e.target.value })}
              />
              <Input
                label="显示名称"
                placeholder="显示名称"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <Select
                label="检查间隔"
                selectedKeys={[String(formData.check_interval_minutes)]}
                onChange={(e) => setFormData({ ...formData, check_interval_minutes: parseInt(e.target.value) })}
              >
                <SelectItem key="15">15 分钟</SelectItem>
                <SelectItem key="30">30 分钟</SelectItem>
                <SelectItem key="60">60 分钟</SelectItem>
              </Select>
              <Input
                label="拉取推文数量"
                type="number"
                min={1}
                max={100}
                value={String(formData.fetch_tweet_count)}
                onChange={(e) => setFormData({ ...formData, fetch_tweet_count: parseInt(e.target.value) || 10 })}
              />
              <Input
                label="每次检查最大新推文数"
                type="number"
                min={1}
                max={10}
                value={String(formData.max_new_tweets_per_check)}
                onChange={(e) => setFormData({ ...formData, max_new_tweets_per_check: parseInt(e.target.value) || 3 })}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={onClose}>
              取消
            </Button>
            <Button color="primary" onPress={handleSubmit}>
              {editingTarget ? '更新' : '创建'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  )
}
