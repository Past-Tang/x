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
  Select,
  SelectItem,
  Chip,
  Card,
  CardBody,
  Pagination,
} from '@heroui/react'
import { logsApi, accountsApi, targetsApi, postJobsApi } from '../services/api'

interface Log {
  id: number
  log_type: string
  account_id: number | null
  account_name: string | null
  target_id: number | null
  target_username: string | null
  job_id: number | null
  job_name: string | null
  tweet_id: string | null
  content_text: string | null
  result: string
  error_message: string | null
  execution_time_ms: number | null
  created_at: string
}

interface PaginationInfo {
  page: number
  per_page: number
  total: number
  pages: number
}

interface Stats {
  by_type: Record<string, number>
  by_result: Record<string, number>
  recent_24h: number
}

interface Account {
  id: number
  name: string
}

interface Target {
  id: number
  target_username: string
}

interface Job {
  id: number
  name: string
}

export default function LogsPage() {
  const [logs, setLogs] = useState<Log[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    per_page: 20,
    total: 0,
    pages: 0,
  })
  const [stats, setStats] = useState<Stats | null>(null)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [targets, setTargets] = useState<Target[]>([])
  const [jobs, setJobs] = useState<Job[]>([])
  
  const [filters, setFilters] = useState({
    log_type: '',
    result: '',
    account_id: '',
    target_id: '',
    job_id: '',
    tweet_id: '',
  })

  const fetchLogs = async (page = 1) => {
    try {
      setLoading(true)
      const params: Record<string, unknown> = { page, per_page: 20 }
      
      if (filters.log_type) params.log_type = filters.log_type
      if (filters.result) params.result = filters.result
      if (filters.account_id) params.account_id = parseInt(filters.account_id)
      if (filters.target_id) params.target_id = parseInt(filters.target_id)
      if (filters.job_id) params.job_id = parseInt(filters.job_id)
      if (filters.tweet_id) params.tweet_id = filters.tweet_id
      
      const response = await logsApi.list(params)
      setLogs(response.data.data)
      setPagination(response.data.pagination)
    } catch (error) {
      console.error('Failed to fetch logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await logsApi.stats()
      setStats(response.data.data)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const fetchFilterData = async () => {
    try {
      const [accountsRes, targetsRes, jobsRes] = await Promise.all([
        accountsApi.list(),
        targetsApi.list(),
        postJobsApi.list(),
      ])
      setAccounts(accountsRes.data.data)
      setTargets(targetsRes.data.data)
      setJobs(jobsRes.data.data)
    } catch (error) {
      console.error('Failed to fetch filter data:', error)
    }
  }

  useEffect(() => {
    fetchLogs()
    fetchStats()
    fetchFilterData()
  }, [])

  const handleFilter = () => {
    fetchLogs(1)
  }

  const handleClearFilters = () => {
    setFilters({
      log_type: '',
      result: '',
      account_id: '',
      target_id: '',
      job_id: '',
      tweet_id: '',
    })
  }

  const getLogTypeColor = (type: string) => {
    switch (type) {
      case 'monitor': return 'primary'
      case 'reply': return 'secondary'
      case 'post': return 'warning'
      default: return 'default'
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Execution Logs</h1>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardBody>
              <p className="text-sm text-gray-500">Last 24 Hours</p>
              <p className="text-2xl font-bold">{stats.recent_24h}</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <p className="text-sm text-gray-500">Success</p>
              <p className="text-2xl font-bold text-green-500">
                {stats.by_result.success || 0}
              </p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <p className="text-sm text-gray-500">Failed</p>
              <p className="text-2xl font-bold text-red-500">
                {stats.by_result.failed || 0}
              </p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <p className="text-sm text-gray-500">By Type</p>
              <div className="flex gap-2 mt-1">
                {Object.entries(stats.by_type).map(([type, count]) => (
                  <Chip key={type} size="sm" color={getLogTypeColor(type)}>
                    {type}: {count}
                  </Chip>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-4">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <Select
            label="Log Type"
            selectedKeys={filters.log_type ? [filters.log_type] : []}
            onChange={(e) => setFilters({ ...filters, log_type: e.target.value })}
          >
            <SelectItem key="monitor">Monitor</SelectItem>
            <SelectItem key="reply">Reply</SelectItem>
            <SelectItem key="post">Post</SelectItem>
          </Select>
          <Select
            label="Result"
            selectedKeys={filters.result ? [filters.result] : []}
            onChange={(e) => setFilters({ ...filters, result: e.target.value })}
          >
            <SelectItem key="success">Success</SelectItem>
            <SelectItem key="failed">Failed</SelectItem>
          </Select>
          <Select
            label="Account"
            selectedKeys={filters.account_id ? [filters.account_id] : []}
            onChange={(e) => setFilters({ ...filters, account_id: e.target.value })}
          >
            {accounts.map((acc) => (
              <SelectItem key={String(acc.id)}>{acc.name}</SelectItem>
            ))}
          </Select>
          <Select
            label="Target"
            selectedKeys={filters.target_id ? [filters.target_id] : []}
            onChange={(e) => setFilters({ ...filters, target_id: e.target.value })}
          >
            {targets.map((t) => (
              <SelectItem key={String(t.id)}>{t.target_username || `ID: ${t.id}`}</SelectItem>
            ))}
          </Select>
          <Input
            label="Tweet ID"
            placeholder="Tweet ID"
            value={filters.tweet_id}
            onChange={(e) => setFilters({ ...filters, tweet_id: e.target.value })}
          />
          <div className="flex items-end gap-2">
            <Button color="primary" onPress={handleFilter}>
              Filter
            </Button>
            <Button variant="flat" onPress={handleClearFilters}>
              Clear
            </Button>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <Table aria-label="Logs table">
        <TableHeader>
          <TableColumn>TIME</TableColumn>
          <TableColumn>TYPE</TableColumn>
          <TableColumn>ACCOUNT</TableColumn>
          <TableColumn>TARGET/JOB</TableColumn>
          <TableColumn>TWEET ID</TableColumn>
          <TableColumn>RESULT</TableColumn>
          <TableColumn>DETAILS</TableColumn>
        </TableHeader>
        <TableBody isLoading={loading} emptyContent="No logs found">
          {logs.map((log) => (
            <TableRow key={log.id}>
              <TableCell>
                <span className="text-xs">
                  {new Date(log.created_at).toLocaleString()}
                </span>
              </TableCell>
              <TableCell>
                <Chip color={getLogTypeColor(log.log_type)} size="sm">
                  {log.log_type}
                </Chip>
              </TableCell>
              <TableCell>{log.account_name || '-'}</TableCell>
              <TableCell>
                {log.target_username || log.job_name || '-'}
              </TableCell>
              <TableCell>
                {log.tweet_id ? (
                  <code className="text-xs">{log.tweet_id}</code>
                ) : '-'}
              </TableCell>
              <TableCell>
                <Chip 
                  color={log.result === 'success' ? 'success' : 'danger'} 
                  size="sm"
                >
                  {log.result}
                </Chip>
              </TableCell>
              <TableCell>
                {log.error_message && (
                  <span className="text-xs text-red-500 truncate max-w-xs block">
                    {log.error_message}
                  </span>
                )}
                {log.execution_time_ms && (
                  <span className="text-xs text-gray-400">
                    {log.execution_time_ms}ms
                  </span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center mt-4">
          <Pagination
            total={pagination.pages}
            page={pagination.page}
            onChange={(page) => fetchLogs(page)}
          />
        </div>
      )}
    </div>
  )
}
