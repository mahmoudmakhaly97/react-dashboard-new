import React from 'react'
import CIcon from '@coreui/icons-react'
import { cilUser, cilDescription } from '@coreui/icons'
import { CNavItem, CNavTitle } from '@coreui/react'
import { useAuth } from '../../../../context/AuthContext'
import { Inbox, LayoutListIcon, User, Users } from 'lucide-react'

export const useNavItems = () => {
  const { userType } = useAuth()

  const common = [
    {
      component: CNavTitle,
      name: 'GENERAL',
    },
  ]

  const employeeNav = [
    {
      component: CNavItem,
      name: 'Tasks',
      to: '/tasks',
      icon: <LayoutListIcon className="nav-icon" />,
    },
    {
      component: CNavItem,
      name: 'Clients',
      to: '/clients',
      icon: <Users className="nav-icon" />,
    },
    {
      component: CNavItem,
      name: 'Requests',
      to: '/requests',
      icon: <Inbox className="nav-icon" />,
    },
  ]

  return [...common, ...employeeNav]
}

export default useNavItems
