import { useState } from 'react'
import {
  Users,
  Mail,
  Building2,
  Phone,
  Settings2,
  X,
  RotateCcw,
  Sliders,
  Ban,
  CheckCircle2,
  History,
  Smartphone,
} from 'lucide-react'
import {
  useGetAdminClientsQuery,
  useGetAdminClientActivityQuery,
  useGetAdminDevicesQuery,
  useResetDeviceLimitMutation,
  useSetDeviceCustomLimitMutation,
  useToggleBlockDeviceMutation,
} from '../../services/apiSlice'
import TablePagination from '../../components/TablePagination'

function ManageClientModal({ client, onClose, showToast }) {
  const [tab, setTab] = useState('log')
  const [editingDevice, setEditingDevice] = useState(null)
  const [customLimitInput, setCustomLimitInput] = useState('')

  const { data: activityData, isLoading: activityLoading } = useGetAdminClientActivityQuery(
    client.email
  )
  const { data: devicesData, isLoading: devicesLoading, refetch: refetchDevices } =
    useGetAdminDevicesQuery({ search: client.email, page: 1, limit: 50 })

  const [resetDeviceLimit] = useResetDeviceLimitMutation()
  const [setDeviceCustomLimit] = useSetDeviceCustomLimitMutation()
  const [toggleBlockDevice] = useToggleBlockDeviceMutation()

  const activity = activityData?.activity || []
  const devices = devicesData?.devices || []

  const handleResetLimit = async (device) => {
    try {
      await resetDeviceLimit(device.id).unwrap()
      showToast(`Limit reset for ${device.toolName}`, 'success')
      refetchDevices()
    } catch (err) {
      showToast(err?.data?.error || 'Failed to reset limit', 'error')
    }
  }

  const handleToggleBlock = async (device) => {
    try {
      const res = await toggleBlockDevice(device.id).unwrap()
      showToast(res.message || 'Device status updated', 'success')
      refetchDevices()
    } catch (err) {
      showToast(err?.data?.error || 'Failed to update block status', 'error')
    }
  }

  const openCustomLimitModal = (device) => {
    setEditingDevice(device)
    setCustomLimitInput(
      device.customLimit !== null && device.customLimit !== undefined
        ? String(device.customLimit)
        : ''
    )
  }

  const handleSaveCustomLimit = async (e) => {
    e.preventDefault()
    if (!editingDevice) return
    try {
      const val = customLimitInput === '' ? null : parseInt(customLimitInput)
      await setDeviceCustomLimit({ id: editingDevice.id, customLimit: val }).unwrap()
      showToast(
        val === null ? 'Custom limit removed (using tool default)' : `Custom limit set to ${val} uses`,
        'success'
      )
      setEditingDevice(null)
      refetchDevices()
    } catch (err) {
      showToast(err?.data?.error || 'Failed to set custom limit', 'error')
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-2xl max-h-[85vh] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 p-5 border-b border-gray-100 shrink-0">
          <div className="min-w-0">
            <h3 className="text-base font-bold text-gray-900 truncate">{client.name}</h3>
            <p className="text-xs text-gray-500 truncate">{client.email}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-5 pt-3 border-b border-gray-100 shrink-0">
          {[
            { key: 'log', label: 'Activity Log', icon: History },
            { key: 'devices', label: 'Devices & Limits', icon: Smartphone },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 -mb-px transition-colors cursor-pointer ${
                tab === t.key
                  ? 'border-[#0C81F3] text-[#0C81F3]'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {tab === 'log' &&
            (activityLoading ? (
              <div className="flex justify-center py-10">
                <div className="w-6 h-6 border-3 border-gray-200 border-t-[#0C81F3] rounded-full animate-spin" />
              </div>
            ) : activity.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-10">No activity recorded.</p>
            ) : (
              <ul className="space-y-2">
                {activity.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-full text-[11px] font-medium capitalize shrink-0">
                        {(a.source || 'unknown').replace(/-/g, ' ')}
                      </span>
                      <span className="text-xs text-gray-400 truncate">
                        {new Date(a.createdAt).toLocaleDateString()}{' '}
                        {new Date(a.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    {a.pdfSendStatus && a.pdfSendStatus !== 'not_sent' && (
                      <span
                        className={`text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0 ${
                          a.pdfSendStatus === 'sent'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-red-50 text-red-700'
                        }`}
                      >
                        PDF {a.pdfSendStatus}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            ))}

          {tab === 'devices' &&
            (devicesLoading ? (
              <div className="flex justify-center py-10">
                <div className="w-6 h-6 border-3 border-gray-200 border-t-[#0C81F3] rounded-full animate-spin" />
              </div>
            ) : devices.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-10">
                No devices linked to this email yet.
              </p>
            ) : (
              <ul className="space-y-2">
                {devices.map((device) => (
                  <li
                    key={device.id}
                    className="flex items-center justify-between gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-full text-[11px] font-medium">
                          {device.toolName}
                        </span>
                        {device.isBlocked && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded-full text-[11px] font-semibold">
                            Blocked
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        {device.usageCount} / {device.effectiveLimit === 0 ? '∞' : device.effectiveLimit}{' '}
                        uses
                        {device.customLimit !== null && device.customLimit !== undefined && (
                          <span className="ml-1.5 text-[10px] text-purple-600 bg-purple-50 px-1.5 py-0.2 rounded font-medium">
                            Custom
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleResetLimit(device)}
                        title="Reset usage to 0"
                        className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg cursor-pointer"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openCustomLimitModal(device)}
                        title="Set custom limit"
                        className="p-1.5 text-gray-500 hover:text-[#0C81F3] hover:bg-blue-50 rounded-lg cursor-pointer"
                      >
                        <Sliders className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleBlock(device)}
                        title={device.isBlocked ? 'Unblock' : 'Block'}
                        className={`p-1.5 rounded-lg cursor-pointer ${
                          device.isBlocked
                            ? 'text-red-600 hover:bg-red-50'
                            : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                        }`}
                      >
                        <Ban className="w-4 h-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ))}
        </div>
      </div>

      {/* Set Custom Limit Sub-Modal */}
      {editingDevice && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setEditingDevice(null)}
        >
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 space-y-4">
            <h3 className="text-base font-bold text-gray-900">Set Custom Limit</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Set a specific usage limit for{' '}
              <span className="font-semibold text-gray-800">{editingDevice.toolName}</span>. Leave
              blank to use the tool default ({editingDevice.defaultLimit}).
            </p>
            <form onSubmit={handleSaveCustomLimit} className="space-y-4">
              <input
                type="number"
                min="0"
                placeholder={`Default: ${editingDevice.defaultLimit}`}
                value={customLimitInput}
                onChange={(e) => setCustomLimitInput(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:border-[#0C81F3] focus:outline-none"
              />
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setEditingDevice(null)}
                  className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white rounded-lg hover:opacity-90 cursor-pointer"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdminClients() {
  const [search, setSearch] = useState('')
  const [submittedSearch, setSubmittedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [managingClient, setManagingClient] = useState(null)
  const [toast, setToast] = useState(null)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const { data, isLoading } = useGetAdminClientsQuery({
    page,
    limit: pageSize,
    ...(submittedSearch ? { search: submittedSearch } : {}),
  })

  const clients = data?.clients || []
  const pagination = data?.pagination || { page: 1, pages: 1, total: 0 }

  const handleSearch = (e) => {
    e.preventDefault()
    setPage(1)
    setSubmittedSearch(search.trim())
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-sm animate-fade-in ${
            toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-gray-900 text-white'
          }`}
        >
          {toast.type === 'error' ? (
            <Ban className="w-4 h-4 text-white shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>{toast.msg}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-[#0C81F3]" />
            Clients
          </h2>
          <p className="text-sm text-gray-500">
            {pagination.total} unique client{pagination.total === 1 ? '' : 's'}, deduplicated by
            email across all tools
          </p>
        </div>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, email, company..."
          className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-[#0C81F3] focus:outline-none"
        />
        <button
          type="submit"
          className="px-4 py-2.5 bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white rounded-xl text-sm font-medium hover:opacity-90 transition-all cursor-pointer"
        >
          Search
        </button>
      </form>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-[#0C81F3] rounded-full animate-spin" />
          </div>
        ) : clients.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm">No clients found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-gray-500 font-medium whitespace-nowrap">
                    Name
                  </th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium whitespace-nowrap">
                    Email
                  </th>
                  <th className="hidden sm:table-cell text-left px-4 py-3 text-gray-500 font-medium whitespace-nowrap">
                    Company
                  </th>
                  <th className="hidden lg:table-cell text-left px-4 py-3 text-gray-500 font-medium whitespace-nowrap">
                    Phone
                  </th>
                  <th className="hidden md:table-cell text-left px-4 py-3 text-gray-500 font-medium whitespace-nowrap">
                    Tools Used
                  </th>
                  <th className="hidden md:table-cell text-left px-4 py-3 text-gray-500 font-medium whitespace-nowrap">
                    Submissions
                  </th>
                  <th className="hidden lg:table-cell text-left px-4 py-3 text-gray-500 font-medium whitespace-nowrap">
                    Last Seen
                  </th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr
                    key={client.email}
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#0C81F3]/20 to-[#EB8988]/20 flex items-center justify-center text-[11px] font-bold text-gray-600 shrink-0">
                          {client.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <span className="font-medium text-gray-900">{client.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        {client.email}
                      </div>
                    </td>
                    <td className="hidden sm:table-cell px-4 py-3 text-gray-500 whitespace-nowrap">
                      {client.company ? (
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          {client.company}
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="hidden lg:table-cell px-4 py-3 text-gray-500 whitespace-nowrap">
                      {client.phone ? (
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          {client.phone}
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="hidden md:table-cell px-4 py-3">
                      <div className="flex flex-wrap gap-1 max-w-[220px]">
                        {client.sources.slice(0, 3).map((s) => (
                          <span
                            key={s}
                            className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded-full text-[10px] capitalize whitespace-nowrap"
                          >
                            {s.replace(/-/g, ' ')}
                          </span>
                        ))}
                        {client.sources.length > 3 && (
                          <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-full text-[10px]">
                            +{client.sources.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="hidden md:table-cell px-4 py-3 text-gray-500 whitespace-nowrap">
                      {client.submissions}
                    </td>
                    <td className="hidden lg:table-cell px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                      {new Date(client.lastSeen).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => setManagingClient(client)}
                        className="inline-flex items-center gap-1 text-xs text-[#0C81F3] hover:text-[#0969C3] transition-colors cursor-pointer"
                      >
                        <Settings2 className="w-3.5 h-3.5" />
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <TablePagination
          currentPage={page}
          totalPages={pagination.pages || 1}
          totalItems={pagination.total || 0}
          pageSize={pageSize}
          pageSizeOptions={[10, 25, 50, 100]}
          onPageChange={(newPage) => setPage(newPage)}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize)
            setPage(1)
          }}
          itemLabel="clients"
          isLoading={isLoading}
        />
      </div>

      {managingClient && (
        <ManageClientModal
          client={managingClient}
          onClose={() => setManagingClient(null)}
          showToast={showToast}
        />
      )}
    </div>
  )
}
