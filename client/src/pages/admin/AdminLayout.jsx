import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom'
import { LayoutDashboard, Wrench, Users, Activity } from 'lucide-react'

const NAV = [
  {
    to: '/admin',
    icon: <LayoutDashboard className="w-[18px] h-[18px]" />,
    label: 'Dashboard',
    exact: true,
  },
  { to: '/admin/activity', icon: <Activity className="w-[18px] h-[18px]" />, label: 'Activity' },
  { to: '/admin/tools', icon: <Wrench className="w-[18px] h-[18px]" />, label: 'Tools' },
  { to: '/admin/leads', icon: <Users className="w-[18px] h-[18px]" />, label: 'Leads' },
]

export default function AdminLayout() {
  const [user, setUser] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    const userData = localStorage.getItem('admin_user')
    if (!token) {
      navigate('/admin/login')
      return
    }
    if (userData) setUser(JSON.parse(userData))
  }, [navigate])

  const logout = () => {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
    navigate('/admin/login')
  }

  if (!user) return null

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Sidebar — fixed, never scrolls */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 flex flex-col transform transition-transform duration-200 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-center justify-center px-6 h-16 border-b border-gray-100 shrink-0">
          <img src="/logo.png" alt="Logo" />
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {NAV.map((item) => {
            const active = item.exact
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to)
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  active
                    ? 'bg-gradient-to-r from-[#0C81F3]/10 to-[#EB8988]/10 text-[#0C81F3] border border-[#0C81F3]/20'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="shrink-0 p-4 border-t border-gray-100">
          <div className="flex gap-2">
            <Link
              to="/"
              className="flex-1 text-center text-xs text-gray-500 hover:text-gray-900 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              View Site
            </Link>
            <button
              onClick={logout}
              className="flex-1 text-xs text-red-500 hover:text-red-700 py-2 rounded-lg hover:bg-red-50 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content — scrollable, offset by sidebar width on desktop */}
      <div className="flex-1 min-w-0 h-screen flex flex-col overflow-hidden lg:ml-64">
        {/* Top bar */}
        <header className="shrink-0 sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-gray-200 h-16 flex items-center px-4 lg:px-8">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 -ml-2 text-gray-500 hover:text-gray-900"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              />
            </svg>
          </button>
          <h2 className="ml-3 text-lg font-semibold text-gray-900">
            {NAV.find((n) =>
              n.exact ? location.pathname === n.to : location.pathname.startsWith(n.to)
            )?.label || 'Admin'}
          </h2>
        </header>

        {/* Scrollable page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
