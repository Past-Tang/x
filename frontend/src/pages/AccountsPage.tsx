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
  Tooltip,
  Card,
  CardBody,
} from '@heroui/react'
import { accountsApi } from '../services/api'

interface Account {
  id: number
  name: string
  twitter_handle: string | null
  status: string
  token_masked: string
  last_success_at: string | null
  last_failure_reason: string | null
  consecutive_failures: number
  hourly_action_count: number
  created_at: string
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    twitter_handle: '',
    auth_token: '',
    weight: 1,
    max_concurrent_usage: 3,
  })

  const fetchAccounts = async () => {
    try {
      const response = await accountsApi.list()
      setAccounts(response.data.data)
    } catch (error) {
      console.error('Failed to fetch accounts:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAccounts()
  }, [])

  const handleOpenCreate = () => {
    setEditingAccount(null)
    setFormData({
      name: '',
      twitter_handle: '',
      auth_token: '',
      weight: 1,
      max_concurrent_usage: 3,
    })
    onOpen()
  }

  const handleOpenEdit = (account: Account) => {
    setEditingAccount(account)
    setFormData({
      name: account.name,
      twitter_handle: account.twitter_handle || '',
      auth_token: '',
      weight: 1,
      max_concurrent_usage: 3,
    })
    onOpen()
  }

  const handleSubmit = async () => {
    try {
      const data: Record<string, unknown> = {
        name: formData.name,
        twitter_handle: formData.twitter_handle || null,
        weight: formData.weight,
        max_concurrent_usage: formData.max_concurrent_usage,
      }
      
      if (formData.auth_token) {
        data.auth_token = formData.auth_token
      }

      if (editingAccount) {
        await accountsApi.update(editingAccount.id, data)
      } else {
        await accountsApi.create(data)
      }
      
      onClose()
      fetchAccounts()
    } catch (error) {
      console.error('Failed to save account:', error)
    }
  }

  const handleToggleStatus = async (id: number) => {
    try {
      await accountsApi.toggleStatus(id)
      fetchAccounts()
    } catch (error) {
      console.error('Failed to toggle status:', error)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this account?')) return
    try {
      await accountsApi.delete(id)
      fetchAccounts()
    } catch (error) {
      console.error('Failed to delete account:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success'
      case 'disabled': return 'default'
      case 'suspect': return 'warning'
      default: return 'default'
    }
  }

  const activeCount = accounts.filter(a => a.status === 'active').length
  const suspectCount = accounts.filter(a => a.status === 'suspect').length

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/20">
          <CardBody className="py-5">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <p className="text-white/80 text-sm">Total Accounts</p>
                <p className="text-2xl font-bold text-white">{accounts.length}</p>
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
                <p className="text-white/80 text-sm">Active</p>
                <p className="text-2xl font-bold text-white">{activeCount}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/20">
          <CardBody className="py-5">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <p className="text-white/80 text-sm">Suspect</p>
                <p className="text-2xl font-bold text-white">{suspectCount}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/20">
          <CardBody className="py-5">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <p className="text-white/80 text-sm">Hourly Actions</p>
                <p className="text-2xl font-bold text-white">{accounts.reduce((sum, a) => sum + a.hourly_action_count, 0)}</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Main Content Card */}
      <Card className="shadow-xl">
        <CardBody className="p-0">
          <div className="flex justify-between items-center p-6 border-b border-gray-100">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Account List</h2>
              <p className="text-sm text-gray-500">Manage your Twitter account tokens</p>
            </div>
            <Button 
              color="primary" 
              onPress={handleOpenCreate}
              className="bg-gradient-to-r from-blue-500 to-indigo-500 shadow-lg shadow-blue-500/30"
              startContent={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              }
            >
              Add Account
            </Button>
          </div>

          <Table aria-label="Accounts table" removeWrapper className="min-h-[200px]">
            <TableHeader>
              <TableColumn className="bg-gray-50/50">NAME</TableColumn>
              <TableColumn className="bg-gray-50/50">HANDLE</TableColumn>
              <TableColumn className="bg-gray-50/50">TOKEN</TableColumn>
              <TableColumn className="bg-gray-50/50">STATUS</TableColumn>
              <TableColumn className="bg-gray-50/50">FAILURES</TableColumn>
              <TableColumn className="bg-gray-50/50">LAST SUCCESS</TableColumn>
              <TableColumn className="bg-gray-50/50">ACTIONS</TableColumn>
            </TableHeader>
            <TableBody isLoading={loading} emptyContent={
              <div className="py-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <p className="text-gray-500 font-medium">No accounts found</p>
                <p className="text-gray-400 text-sm">Get started by adding your first account</p>
              </div>
            }>
              {accounts.map((account) => (
                <TableRow key={account.id} className="hover:bg-gray-50/50 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {account.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-800">{account.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-gray-600">{account.twitter_handle || '-'}</span>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">{account.token_masked}</code>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      color={getStatusColor(account.status)} 
                      size="sm"
                      variant="flat"
                      className="capitalize"
                    >
                      {account.status}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    {account.consecutive_failures > 0 ? (
                      <Tooltip content={account.last_failure_reason || 'Unknown error'}>
                        <Chip color="danger" size="sm" variant="flat">
                          {account.consecutive_failures} failures
                        </Chip>
                      </Tooltip>
                    ) : (
                      <span className="text-gray-400">None</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-gray-600 text-sm">
                      {account.last_success_at 
                        ? new Date(account.last_success_at).toLocaleString()
                        : '-'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button 
                        size="sm" 
                        variant="light" 
                        isIconOnly
                        onPress={() => handleOpenEdit(account)}
                      >
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </Button>
                      <Button 
                        size="sm" 
                        variant="light"
                        isIconOnly
                        color={account.status === 'active' ? 'warning' : 'success'}
                        onPress={() => handleToggleStatus(account.id)}
                      >
                        {account.status === 'active' ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="light" 
                        isIconOnly
                        color="danger" 
                        onPress={() => handleDelete(account.id)}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      <Modal isOpen={isOpen} onClose={onClose} size="lg" className="bg-white">
        <ModalContent>
          <ModalHeader className="border-b border-gray-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold">{editingAccount ? 'Edit Account' : 'Add New Account'}</h3>
                <p className="text-sm text-gray-500">Enter the account details below</p>
              </div>
            </div>
          </ModalHeader>
          <ModalBody className="py-6">
            <div className="flex flex-col gap-4">
              <Input
                label="Name"
                placeholder="Account name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                isRequired
                variant="bordered"
                labelPlacement="outside"
              />
              <Input
                label="Twitter Handle"
                placeholder="@handle"
                value={formData.twitter_handle}
                onChange={(e) => setFormData({ ...formData, twitter_handle: e.target.value })}
                variant="bordered"
                labelPlacement="outside"
              />
              <Input
                label={editingAccount ? "New Auth Token (leave empty to keep current)" : "Auth Token"}
                placeholder="Auth token"
                type="password"
                value={formData.auth_token}
                onChange={(e) => setFormData({ ...formData, auth_token: e.target.value })}
                isRequired={!editingAccount}
                variant="bordered"
                labelPlacement="outside"
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Weight"
                  type="number"
                  min={1}
                  value={String(formData.weight)}
                  onChange={(e) => setFormData({ ...formData, weight: parseInt(e.target.value) || 1 })}
                  variant="bordered"
                  labelPlacement="outside"
                />
                <Input
                  label="Max Concurrent Usage"
                  type="number"
                  min={1}
                  value={String(formData.max_concurrent_usage)}
                  onChange={(e) => setFormData({ ...formData, max_concurrent_usage: parseInt(e.target.value) || 3 })}
                  variant="bordered"
                  labelPlacement="outside"
                />
              </div>
            </div>
          </ModalBody>
          <ModalFooter className="border-t border-gray-100 pt-4">
            <Button variant="flat" onPress={onClose}>
              Cancel
            </Button>
            <Button 
              color="primary" 
              onPress={handleSubmit}
              className="bg-gradient-to-r from-blue-500 to-indigo-500"
            >
              {editingAccount ? 'Update Account' : 'Create Account'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  )
}
