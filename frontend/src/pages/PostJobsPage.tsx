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
import { postJobsApi } from '../services/api'

interface PostJob {
  id: number
  name: string
  status: string
  interval_minutes: number
  current_content_index: number
  account_strategy: string
  last_run_at: string | null
  next_run_at: string | null
  last_run_result: string | null
  last_run_error: string | null
  last_tweet_id: string | null
  total_posts: number
}

export default function PostJobsPage() {
  const [jobs, setJobs] = useState<PostJob[]>([])
  const [loading, setLoading] = useState(true)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [editingJob, setEditingJob] = useState<PostJob | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    interval_minutes: 60,
    account_strategy: 'round_robin',
  })

  const fetchJobs = async () => {
    try {
      const response = await postJobsApi.list()
      setJobs(response.data.data)
    } catch (error) {
      console.error('Failed to fetch jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchJobs()
  }, [])

  const handleOpenCreate = () => {
    setEditingJob(null)
    setFormData({
      name: '',
      interval_minutes: 60,
      account_strategy: 'round_robin',
    })
    onOpen()
  }

  const handleOpenEdit = (job: PostJob) => {
    setEditingJob(job)
    setFormData({
      name: job.name,
      interval_minutes: job.interval_minutes,
      account_strategy: job.account_strategy,
    })
    onOpen()
  }

  const handleSubmit = async () => {
    try {
      const data = {
        name: formData.name,
        interval_minutes: formData.interval_minutes,
        account_strategy: formData.account_strategy,
      }

      if (editingJob) {
        await postJobsApi.update(editingJob.id, data)
      } else {
        await postJobsApi.create(data)
      }
      
      onClose()
      fetchJobs()
    } catch (error) {
      console.error('Failed to save job:', error)
    }
  }

  const handleToggleStatus = async (id: number) => {
    try {
      await postJobsApi.toggleStatus(id)
      fetchJobs()
    } catch (error) {
      console.error('Failed to toggle status:', error)
    }
  }

  const handleRunNow = async (id: number) => {
    try {
      await postJobsApi.runNow(id)
      fetchJobs()
    } catch (error) {
      console.error('Failed to run job:', error)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除此任务吗？')) return
    try {
      await postJobsApi.delete(id)
      fetchJobs()
    } catch (error) {
      console.error('Failed to delete job:', error)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">自动发推任务</h1>
        <Button color="primary" onPress={handleOpenCreate}>
          添加任务
        </Button>
      </div>

      <Table aria-label="发推任务表格">
        <TableHeader>
          <TableColumn>名称</TableColumn>
          <TableColumn>状态</TableColumn>
          <TableColumn>间隔</TableColumn>
          <TableColumn>策略</TableColumn>
          <TableColumn>最后运行</TableColumn>
          <TableColumn>下次运行</TableColumn>
          <TableColumn>统计</TableColumn>
          <TableColumn>操作</TableColumn>
        </TableHeader>
        <TableBody isLoading={loading} emptyContent="暂无任务">
          {jobs.map((job) => (
            <TableRow key={job.id}>
              <TableCell>{job.name}</TableCell>
              <TableCell>
                <Chip 
                  color={job.status === 'active' ? 'success' : 'default'} 
                  size="sm"
                >
                  {job.status === 'active' ? '启用' : '停用'}
                </Chip>
              </TableCell>
              <TableCell>{job.interval_minutes}分钟</TableCell>
              <TableCell>
                <Chip size="sm" variant="flat">
                  {job.account_strategy === 'round_robin' ? '轮换' : job.account_strategy === 'random' ? '随机' : job.account_strategy}
                </Chip>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="text-xs">
                    {job.last_run_at 
                      ? new Date(job.last_run_at).toLocaleString()
                      : '从未'}
                  </span>
                  {job.last_run_result && (
                    <Chip 
                      color={job.last_run_result === 'success' ? 'success' : 'danger'} 
                      size="sm"
                      className="mt-1"
                    >
                      {job.last_run_result === 'success' ? '成功' : '失败'}
                    </Chip>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <span className="text-xs">
                  {job.next_run_at 
                    ? new Date(job.next_run_at).toLocaleString()
                    : '-'}
                </span>
              </TableCell>
              <TableCell>
                <div className="text-xs">
                  <div>发推: {job.total_posts}</div>
                  <div>索引: {job.current_content_index}</div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex gap-2 flex-wrap">
                  <Button size="sm" variant="flat" onPress={() => handleOpenEdit(job)}>
                    编辑
                  </Button>
                  <Button 
                    size="sm" 
                    variant="flat"
                    color="primary"
                    onPress={() => handleRunNow(job.id)}
                  >
                    立即运行
                  </Button>
                  <Button 
                    size="sm" 
                    variant="flat"
                    color={job.status === 'active' ? 'warning' : 'success'}
                    onPress={() => handleToggleStatus(job.id)}
                  >
                    {job.status === 'active' ? '停用' : '启用'}
                  </Button>
                  <Button size="sm" variant="flat" color="danger" onPress={() => handleDelete(job.id)}>
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
            {editingJob ? '编辑任务' : '添加任务'}
          </ModalHeader>
          <ModalBody>
            <div className="flex flex-col gap-4">
              <Input
                label="任务名称"
                placeholder="输入任务名称"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                isRequired
              />
              <Select
                label="执行间隔"
                selectedKeys={[String(formData.interval_minutes)]}
                onChange={(e) => setFormData({ ...formData, interval_minutes: parseInt(e.target.value) })}
              >
                <SelectItem key="15">15 分钟</SelectItem>
                <SelectItem key="30">30 分钟</SelectItem>
                <SelectItem key="60">60 分钟</SelectItem>
                <SelectItem key="120">2 小时</SelectItem>
              </Select>
              <Select
                label="账号策略"
                selectedKeys={[formData.account_strategy]}
                onChange={(e) => setFormData({ ...formData, account_strategy: e.target.value })}
              >
                <SelectItem key="round_robin">轮换</SelectItem>
                <SelectItem key="random">随机</SelectItem>
                <SelectItem key="weighted">权重</SelectItem>
              </Select>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={onClose}>
              取消
            </Button>
            <Button color="primary" onPress={handleSubmit}>
              {editingJob ? '更新' : '创建'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  )
}
