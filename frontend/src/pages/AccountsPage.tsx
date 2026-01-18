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

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Account Pool</h1>
        <Button color="primary" onPress={handleOpenCreate}>
          Add Account
        </Button>
      </div>

      <Table aria-label="Accounts table">
        <TableHeader>
          <TableColumn>NAME</TableColumn>
          <TableColumn>HANDLE</TableColumn>
          <TableColumn>TOKEN</TableColumn>
          <TableColumn>STATUS</TableColumn>
          <TableColumn>FAILURES</TableColumn>
          <TableColumn>LAST SUCCESS</TableColumn>
          <TableColumn>ACTIONS</TableColumn>
        </TableHeader>
        <TableBody isLoading={loading} emptyContent="No accounts found">
          {accounts.map((account) => (
            <TableRow key={account.id}>
              <TableCell>{account.name}</TableCell>
              <TableCell>{account.twitter_handle || '-'}</TableCell>
              <TableCell>
                <code className="text-xs">{account.token_masked}</code>
              </TableCell>
              <TableCell>
                <Chip color={getStatusColor(account.status)} size="sm">
                  {account.status}
                </Chip>
              </TableCell>
              <TableCell>
                {account.consecutive_failures > 0 ? (
                  <Tooltip content={account.last_failure_reason || 'Unknown error'}>
                    <Chip color="danger" size="sm">
                      {account.consecutive_failures}
                    </Chip>
                  </Tooltip>
                ) : (
                  <span className="text-gray-400">0</span>
                )}
              </TableCell>
              <TableCell>
                {account.last_success_at 
                  ? new Date(account.last_success_at).toLocaleString()
                  : '-'}
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button size="sm" variant="flat" onPress={() => handleOpenEdit(account)}>
                    Edit
                  </Button>
                  <Button 
                    size="sm" 
                    variant="flat"
                    color={account.status === 'active' ? 'warning' : 'success'}
                    onPress={() => handleToggleStatus(account.id)}
                  >
                    {account.status === 'active' ? 'Disable' : 'Enable'}
                  </Button>
                  <Button size="sm" variant="flat" color="danger" onPress={() => handleDelete(account.id)}>
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
            {editingAccount ? 'Edit Account' : 'Add Account'}
          </ModalHeader>
          <ModalBody>
            <div className="flex flex-col gap-4">
              <Input
                label="Name"
                placeholder="Account name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                isRequired
              />
              <Input
                label="Twitter Handle"
                placeholder="@handle"
                value={formData.twitter_handle}
                onChange={(e) => setFormData({ ...formData, twitter_handle: e.target.value })}
              />
              <Input
                label={editingAccount ? "New Auth Token (leave empty to keep current)" : "Auth Token"}
                placeholder="Auth token"
                type="password"
                value={formData.auth_token}
                onChange={(e) => setFormData({ ...formData, auth_token: e.target.value })}
                isRequired={!editingAccount}
              />
              <Input
                label="Weight"
                type="number"
                min={1}
                value={String(formData.weight)}
                onChange={(e) => setFormData({ ...formData, weight: parseInt(e.target.value) || 1 })}
              />
              <Input
                label="Max Concurrent Usage"
                type="number"
                min={1}
                value={String(formData.max_concurrent_usage)}
                onChange={(e) => setFormData({ ...formData, max_concurrent_usage: parseInt(e.target.value) || 3 })}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={onClose}>
              Cancel
            </Button>
            <Button color="primary" onPress={handleSubmit}>
              {editingAccount ? 'Update' : 'Create'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  )
}
