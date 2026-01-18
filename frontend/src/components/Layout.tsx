import { Outlet, Link, useLocation } from 'react-router-dom'
import { 
  Navbar, 
  NavbarBrand, 
  NavbarContent, 
  NavbarItem,
} from '@heroui/react'

const navItems = [
  { path: '/accounts', label: 'Accounts' },
  { path: '/targets', label: 'Targets' },
  { path: '/reply-templates', label: 'Reply Templates' },
  { path: '/post-jobs', label: 'Post Jobs' },
  { path: '/post-contents', label: 'Post Contents' },
  { path: '/logs', label: 'Logs' },
  { path: '/settings', label: 'Settings' },
]

export default function Layout() {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar isBordered maxWidth="full">
        <NavbarBrand>
          <p className="font-bold text-inherit">Twitter Monitor</p>
        </NavbarBrand>
        <NavbarContent className="hidden sm:flex gap-4" justify="center">
          {navItems.map((item) => (
            <NavbarItem key={item.path} isActive={location.pathname === item.path}>
              <Link 
                to={item.path}
                className={`text-sm ${location.pathname === item.path ? 'text-primary font-semibold' : 'text-foreground'}`}
              >
                {item.label}
              </Link>
            </NavbarItem>
          ))}
        </NavbarContent>
      </Navbar>
      
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        <Outlet />
      </main>
    </div>
  )
}
