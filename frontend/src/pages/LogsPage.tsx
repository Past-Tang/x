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
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/20">
          <CardBody className="py-5">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-white/80 text-sm">Last 24 Hours</p>
                <p className="text-2xl font-bold text-white">{stats?.recent_24h || 0}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/20">
          <CardBody className="py-5">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-white/80 text-sm">Success</p>
                <p className="text-2xl font-bold text-white">{stats?.by_result.success || 0}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-br from-rose-500 to-red-600 shadow-lg shadow-rose-500/20">
          <CardBody className="py-5">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-white/80 text-sm">Failed</p>
                <p className="text-2xl font-bold text-white">{stats?.by_result.failed || 0}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/20">
          <CardBody className="py-5">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
              </div>
              <div>
                <p className="text-white/80 text-sm">By Type</p>
                <div className="flex gap-1 mt-1 flex-wrap">
                  {stats && Object.entries(stats.by_type).map(([type, count]) => (
                    <Chip key={type} size="sm" className="bg-white/20 text-white text-xs">
                      {type}: {count}
                    </Chip>
                  ))}
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Filters Card */}
      <Card className="shadow-lg">
        <CardBody className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-800">Filters</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <Select
              label="Log Type"
              variant="bordered"
              size="sm"
              selectedKeys={filters.log_type ? [filters.log_type] : []}
              onChange={(e) => setFilters({ ...filters, log_type: e.target.value })}
            >
              <SelectItem key="monitor">Monitor</SelectItem>
              <SelectItem key="reply">Reply</SelectItem>
              <SelectItem key="post">Post</SelectItem>
            </Select>
            <Select
              label="Result"
              variant="bordered"
              size="sm"
              selectedKeys={filters.result ? [filters.result] : []}
              onChange={(e) => setFilters({ ...filters, result: e.target.value })}
            >
              <SelectItem key="success">Success</SelectItem>
              <SelectItem key="failed">Failed</SelectItem>
            </Select>
            <Select
              label="Account"
              variant="bordered"
              size="sm"
              selectedKeys={filters.account_id ? [filters.account_id] : []}
              onChange={(e) => setFilters({ ...filters, account_id: e.target.value })}
            >
              {accounts.map((acc) => (
                <SelectItem key={String(acc.id)}>{acc.name}</SelectItem>
              ))}
            </Select>
            <Select
              label="Target"
              variant="bordered"
              size="sm"
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
              variant="bordered"
              size="sm"
              value={filters.tweet_id}
              onChange={(e) => setFilters({ ...filters, tweet_id: e.target.value })}
            />
            <div className="flex items-end gap-2">
              <Button 
                color="primary" 
                onPress={handleFilter}
                className="bg-gradient-to-r from-blue-500 to-indigo-500"
                startContent={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                }
              >
                Filter
              </Button>
              <Button variant="flat" onPress={handleClearFilters}>
                Clear
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Logs Table Card */}
      <Card className="shadow-xl">
        <CardBody className="p-0">
          <div className="flex justify-between items-center p-6 border-b border-gray-100">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Log Entries</h2>
              <p className="text-sm text-gray-500">Total: {pagination.total} entries</p>
            </div>
          </div>

          <Table aria-label="Logs table" removeWrapper className="min-h-[200px]">
            <TableHeader>
              <TableColumn className="bg-gray-50/50">TIME</TableColumn>
              <TableColumn className="bg-gray-50/50">TYPE</TableColumn>
              <TableColumn className="bg-gray-50/50">ACCOUNT</TableColumn>
              <TableColumn className="bg-gray-50/50">TARGET/JOB</TableColumn>
              <TableColumn className="bg-gray-50/50">TWEET ID</TableColumn>
              <TableColumn className="bg-gray-50/50">RESULT</TableColumn>
              <TableColumn className="bg-gray-50/50">DETAILS</TableColumn>
            </TableHeader>
            <TableBody isLoading={loading} emptyContent={
              <div className="py-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-gray-500 font-medium">No logs found</p>
                <p className="text-gray-400 text-sm">Logs will appear here when actions are performed</p>
              </div>
            }>
              {logs.map((log) => (
                <TableRow key={log.id} className="hover:bg-gray-50/50 transition-colors">
                  <TableCell>
                    <span className="text-xs text-gray-600">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Chip color={getLogTypeColor(log.log_type)} size="sm" variant="flat" className="capitalize">
                      {log.log_type}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <span className="text-gray-600">{log.account_name || '-'}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-gray-600">{log.target_username || log.job_name || '-'}</span>
                  </TableCell>
                  <TableCell>
                    {log.tweet_id ? (
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">{log.tweet_id}</code>
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      color={log.result === 'success' ? 'success' : 'danger'} 
                      size="sm"
                      variant="flat"
                      className="capitalize"
                    >
                      {log.result}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {log.error_message && (
                        <span className="text-xs text-red-500 truncate max-w-[200px]">
                          {log.error_message}
                        </span>
                      )}
                      {log.execution_time_ms && (
                        <span className="text-xs text-gray-400">
                          {log.execution_time_ms}ms
                        </span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-center p-4 border-t border-gray-100">
              <Pagination
                total={pagination.pages}
                page={pagination.page}
                onChange={(page) => fetchLogs(page)}
                showControls
                classNames={{
                  cursor: "bg-gradient-to-r from-blue-500 to-indigo-500",
                }}
              />
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
