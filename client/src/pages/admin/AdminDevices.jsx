import { useState } from 'react'
import {
  Smartphone,
  Search,
  RefreshCw,
  RotateCcw,
  Sliders,
  Ban,
  CheckCircle2,
  Trash2,
  Copy,
  Check,
  Mail,
  Globe,
  AlertTriangle,
  Monitor,
} from 'lucide-react'
import {
  useGetAdminDevicesQuery,
  useResetDeviceLimitMutation,
  useSetDeviceCustomLimitMutation,
  useToggleBlockDeviceMutation,
  useDeleteDeviceMutation,
  useGetAdminToolsQuery,
} from '../../services/apiSlice'
import ConfirmModal from '../../components/ConfirmModal'
import TablePagination from '../../components/TablePagination'

export default function AdminDevices() {
  const [search, setSearch] = useState('')
  const [selectedTool, setSelectedTool] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [copiedId, setCopiedId] = useState(null)
  const [editingDevice, setEditingDevice] = useState(null)
  const [deviceToDelete, setDeviceToDelete] = useState(null)
  const [customLimitInput, setCustomLimitInput] = useState('')
  const [toastMessage, setToastMessage] = useState(null)

  const { data, isLoading, refetch, isFetching } = useGetAdminDevicesQuery({
    search,
    tool: selectedTool,
    status: selectedStatus,
    page,
    limit: pageSize,
  })

  const { data: toolsData } = useGetAdminToolsQuery()

  const [resetDeviceLimit, { isLoading: isResetting }] = useResetDeviceLimitMutation()
  const [setDeviceCustomLimit, { isLoading: isSettingLimit }] = useSetDeviceCustomLimitMutation()
  const [toggleBlockDevice, { isLoading: isTogglingBlock }] = useToggleBlockDeviceMutation()
  const [deleteDevice, { isLoading: isDeleting }] = useDeleteDeviceMutation()

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleResetLimit = async (device) => {
    try {
      await resetDeviceLimit(device.id).unwrap()
      showToast(`Limit reset for device ${device.deviceId.substring(0, 8)}...`)
    } catch (err) {
      showToast(err?.data?.error || 'Failed to reset limit')
    }
  }

  const handleToggleBlock = async (device) => {
    try {
      const res = await toggleBlockDevice(device.id).unwrap()
      showToast(res.message || 'Device status updated')
    } catch (err) {
      showToast(err?.data?.error || 'Failed to update block status')
    }
  }

  const confirmDeleteDevice = async () => {
    if (!deviceToDelete) return
    try {
      await deleteDevice(deviceToDelete.id).unwrap()
      showToast('Device record deleted')
      setDeviceToDelete(null)
    } catch (err) {
      showToast(err?.data?.error || 'Failed to delete device')
    }
  }

  const openCustomLimitModal = (device) => {
    setEditingDevice(device)
    setCustomLimitInput(device.customLimit !== null && device.customLimit !== undefined ? String(device.customLimit) : '')
  }

  const handleSaveCustomLimit = async (e) => {
    e.preventDefault()
    if (!editingDevice) return
    try {
      const val = customLimitInput === '' ? null : parseInt(customLimitInput)
      await setDeviceCustomLimit({ id: editingDevice.id, customLimit: val }).unwrap()
      showToast(val === null ? 'Custom limit removed (using tool default)' : `Custom limit set to ${val} uses`)
      setEditingDevice(null)
    } catch (err) {
      showToast(err?.data?.error || 'Failed to set custom limit')
    }
  }

  const devices = data?.devices || []
  const stats = data?.stats || { totalDevices: 0, blockedDevices: 0, devicesWithEmail: 0 }
  const totalPages = data?.pagination?.totalPages || 1

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-gray-900 text-white rounded-xl shadow-xl text-sm animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <Smartphone className="w-6 h-6 text-[#0C81F3]" />
            Device Limits & Tracking
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Monitor device usage across tools, track linked emails, reset limits, and control device access.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-[#0C81F3]' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Tracked Devices</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalDevices}</p>
          <p className="text-xs text-gray-400 mt-1">Unique device/tool pairings</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Identified (With Email)</p>
          <p className="text-3xl font-bold text-emerald-600 mt-2">{stats.devicesWithEmail}</p>
          <p className="text-xs text-gray-400 mt-1">Linked via lead capture or form</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Limit Reached</p>
          <p className="text-3xl font-bold text-amber-600 mt-2">
            {devices.filter((d) => d.isLimitReached && !d.isBlocked).length}
          </p>
          <p className="text-xs text-gray-400 mt-1">Current page hitting ceiling</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Blocked Devices</p>
          <p className="text-3xl font-bold text-red-600 mt-2">{stats.blockedDevices}</p>
          <p className="text-xs text-gray-400 mt-1">Denied tool access</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by email, device ID, or IP..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-[#0C81F3] focus:outline-none transition-all"
            />
          </div>

          {/* Tool filter */}
          <select
            value={selectedTool}
            onChange={(e) => {
              setSelectedTool(e.target.value)
              setPage(1)
            }}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:bg-white focus:border-[#0C81F3] focus:outline-none"
          >
            <option value="all">All Tools</option>
            {(toolsData?.tools || []).map((t) => (
              <option key={t.slug} value={t.slug}>
                {t.name} (Default: {t.deviceLimit || 3} uses)
              </option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value)
              setPage(1)
            }}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:bg-white focus:border-[#0C81F3] focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active (Under Limit)</option>
            <option value="limit_reached">Limit Reached</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-3 border-gray-200 border-t-[#0C81F3] rounded-full animate-spin" />
          </div>
        ) : devices.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Smartphone className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-base font-semibold text-gray-700">No devices tracked yet</p>
            <p className="text-xs text-gray-400 mt-1">
              Devices will appear here automatically when users run tools from their browsers.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Device ID</th>
                  <th className="py-3.5 px-4">User / Email</th>
                  <th className="py-3.5 px-4">Tool</th>
                  <th className="py-3.5 px-4">Usage & Limit</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">IP & Info</th>
                  <th className="py-3.5 px-4">Last Active</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {devices.map((device) => {
                  const percent = Math.min(
                    100,
                    Math.round(
                      device.effectiveLimit > 0
                        ? (device.usageCount / device.effectiveLimit) * 100
                        : 0
                    )
                  )

                  return (
                    <tr key={device.id} className="hover:bg-gray-50/80 transition-colors">
                      {/* Device ID */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <code className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-mono">
                            {device.deviceId.substring(0, 10)}...
                          </code>
                          <button
                            onClick={() => copyToClipboard(device.deviceId, device.id)}
                            className="text-gray-400 hover:text-gray-600 p-1 rounded cursor-pointer"
                            title="Copy full Device ID"
                          >
                            {copiedId === device.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-3 px-4">
                        {device.email ? (
                          <div className="flex items-center gap-1.5 text-xs font-medium text-gray-900">
                            <Mail className="w-3.5 h-3.5 text-[#0C81F3] shrink-0" />
                            <span className="truncate max-w-[160px]">{device.email}</span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center text-xs text-gray-400 italic">
                            Anonymous
                          </span>
                        )}
                      </td>

                      {/* Tool */}
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                          {device.toolName}
                        </span>
                      </td>

                      {/* Usage & Limit */}
                      <td className="py-3 px-4 min-w-[150px]">
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-semibold text-gray-800">
                              {device.usageCount}{' '}
                              <span className="text-gray-400 font-normal">
                                / {device.effectiveLimit === 0 ? '∞' : device.effectiveLimit}
                              </span>
                            </span>
                            {device.customLimit !== null && device.customLimit !== undefined && (
                              <span className="text-[10px] text-purple-600 bg-purple-50 px-1.5 py-0.2 rounded font-medium">
                                Custom
                              </span>
                            )}
                          </div>
                          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                device.isLimitReached
                                  ? 'bg-red-500'
                                  : percent >= 70
                                    ? 'bg-amber-500'
                                    : 'bg-[#0C81F3]'
                              }`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {device.isBlocked ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                            <Ban className="w-3 h-3" />
                            Blocked
                          </span>
                        ) : device.isLimitReached ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                            <AlertTriangle className="w-3 h-3" />
                            Limit Reached
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                            <CheckCircle2 className="w-3 h-3" />
                            Active
                          </span>
                        )}
                      </td>

                      {/* IP & UA */}
                      <td className="py-3 px-4">
                        <div className="text-xs text-gray-500 space-y-0.5">
                          <div className="flex items-center gap-1">
                            <Globe className="w-3 h-3 text-gray-400" />
                            <span>{device.ip || 'Unknown'}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-gray-400 truncate max-w-[140px]" title={device.userAgent}>
                            <Monitor className="w-3 h-3" />
                            <span>{device.userAgent ? device.userAgent.substring(0, 30) : 'Browser'}</span>
                          </div>
                        </div>
                      </td>

                      {/* Last Active */}
                      <td className="py-3 px-4 text-xs text-gray-500 whitespace-nowrap">
                        {device.lastUsedAt
                          ? new Date(device.lastUsedAt).toLocaleDateString() +
                            ' ' +
                            new Date(device.lastUsedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : '—'}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          {/* Reset button */}
                          <button
                            onClick={() => handleResetLimit(device)}
                            disabled={isResetting}
                            title="Reset limit (usage = 0)"
                            className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>

                          {/* Set custom limit */}
                          <button
                            onClick={() => openCustomLimitModal(device)}
                            disabled={isSettingLimit}
                            title="Set custom limit for this device"
                            className="p-1.5 text-gray-500 hover:text-[#0C81F3] hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Sliders className="w-4 h-4" />
                          </button>

                          {/* Block/unblock */}
                          <button
                            onClick={() => handleToggleBlock(device)}
                            disabled={isTogglingBlock}
                            title={device.isBlocked ? 'Unblock device' : 'Block device'}
                            className={`p-1.5 rounded-lg transition-colors ${
                              device.isBlocked
                                ? 'text-red-600 hover:bg-red-50'
                                : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                            } cursor-pointer`}
                          >
                            <Ban className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => setDeviceToDelete(device)}
                            disabled={isDeleting}
                            title="Delete record"
                            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <TablePagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={data?.pagination?.total || 0}
          pageSize={pageSize}
          pageSizeOptions={[10, 25, 50, 100]}
          onPageChange={(newPage) => setPage(newPage)}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize)
            setPage(1)
          }}
          itemLabel="devices"
          isLoading={isLoading || isFetching}
        />
      </div>

      {/* Custom Limit Modal */}
      {editingDevice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 space-y-4">
            <h3 className="text-base font-bold text-gray-900">Set Custom Device Limit</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Set a specific limit for this device on <span className="font-semibold text-gray-800">{editingDevice.toolName}</span>. Leave blank to revert to tool default ({editingDevice.defaultLimit} uses).
            </p>
            <form onSubmit={handleSaveCustomLimit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Allowed Usage Count
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder={`Default: ${editingDevice.defaultLimit}`}
                  value={customLimitInput}
                  onChange={(e) => setCustomLimitInput(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:border-[#0C81F3] focus:outline-none"
                />
                <p className="text-[10px] text-gray-400 mt-1">Set 0 for unlimited uses.</p>
              </div>
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
                  disabled={isSettingLimit}
                  className="px-4 py-1.5 text-xs font-semibold bg-[#0C81F3] text-white rounded-lg hover:bg-[#0969c3] cursor-pointer"
                >
                  Save Limit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Device Modal */}
      <ConfirmModal
        isOpen={Boolean(deviceToDelete)}
        onClose={() => setDeviceToDelete(null)}
        onConfirm={confirmDeleteDevice}
        isLoading={isDeleting}
        title="Delete Device Record"
        message={
          deviceToDelete ? (
            <span>
              Are you sure you want to delete the record for device{' '}
              <strong className="font-mono text-gray-900">{deviceToDelete.deviceId.substring(0, 12)}...</strong>
              {deviceToDelete.email && (
                <span> ({deviceToDelete.email})</span>
              )}? This will reset all rate limits and usage counters for this device.
            </span>
          ) : (
            'Are you sure you want to delete this device record?'
          )
        }
        confirmText="Delete Device"
      />
    </div>
  )
}
