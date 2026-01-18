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
    if (!confirm('Are you sure you want to delete this job?')) return
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
        <h1 className="text-2xl font-bold">Auto Post Jobs</h1>
        <Button color="primary" onPress={handleOpenCreate}>
          Add Job
        </Button>
      </div>

      <Table aria-label="Post jobs table">
        <TableHeader>
          <TableColumn>NAME</TableColumn>
          <TableColumn>STATUS</TableColumn>
          <TableColumn>INTERVAL</TableColumn>
          <TableColumn>STRATEGY</TableColumn>
          <TableColumn>LAST RUN</TableColumn>
          <TableColumn>NEXT RUN</TableColumn>
          <TableColumn>STATS</TableColumn>
          <TableColumn>ACTIONS</TableColumn>
        </TableHeader>
        <TableBody isLoading={loading} emptyContent="No jobs found">
          {jobs.map((job) => (
            <TableRow key={job.id}>
              <TableCell>{job.name}</TableCell>
              <TableCell>
                <Chip 
                  color={job.status === 'active' ? 'success' : 'default'} 
                  size="sm"
                >
                  {job.status}
                </Chip>
              </TableCell>
              <TableCell>{job.interval_minutes}m</TableCell>
              <TableCell>
                <Chip size="sm" variant="flat">
                  {job.account_strategy}
                </Chip>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="text-xs">
                    {job.last_run_at 
                      ? new Date(job.last_run_at).toLocaleString()
                      : 'Never'}
                  </span>
                  {job.last_run_result && (
                    <Chip 
                      color={job.last_run_result === 'success' ? 'success' : 'danger'} 
                      size="sm"
                      className="mt-1"
                    >
                      {job.last_run_result}
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
                  <div>Posts: {job.total_posts}</div>
                  <div>Index: {job.current_content_index}</div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex gap-2 flex-wrap">
                  <Button size="sm" variant="flat" onPress={() => handleOpenEdit(job)}>
                    Edit
                  </Button>
                  <Button 
                    size="sm" 
                    variant="flat"
                    color="primary"
                    onPress={() => handleRunNow(job.id)}
                  >
                    Run Now
                  </Button>
                  <Button 
                    size="sm" 
                    variant="flat"
                    color={job.status === 'active' ? 'warning' : 'success'}
                    onPress={() => handleToggleStatus(job.id)}
                  >
                    {job.status === 'active' ? 'Disable' : 'Enable'}
                  </Button>
                  <Button size="sm" variant="flat" color="danger" onPress={() => handleDelete(job.id)}>
                    Delete
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
            {editingJob ? 'Edit Job' : 'Add Job'}
          </ModalHeader>
          <ModalBody>
            <div className="flex flex-col gap-4">
              <Input
                label="Job Name"
                placeholder="Enter job name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                isRequired
              />
              <Select
                label="Interval"
                selectedKeys={[String(formData.interval_minutes)]}
                onChange={(e) => setFormData({ ...formData, interval_minutes: parseInt(e.target.value) })}
              >
                <SelectItem key="15">15 minutes</SelectItem>
                <SelectItem key="30">30 minutes</SelectItem>
                <SelectItem key="60">60 minutes</SelectItem>
                <SelectItem key="120">2 hours</SelectItem>
              </Select>
              <Select
                label="Account Strategy"
                selectedKeys={[formData.account_strategy]}
                onChange={(e) => setFormData({ ...formData, account_strategy: e.target.value })}
              >
                <SelectItem key="round_robin">Round Robin</SelectItem>
                <SelectItem key="random">Random</SelectItem>
                <SelectItem key="weighted">Weighted</SelectItem>
              </Select>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={onClose}>
              Cancel
            </Button>
            <Button color="primary" onPress={handleSubmit}>
              {editingJob ? 'Update' : 'Create'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  )
}
