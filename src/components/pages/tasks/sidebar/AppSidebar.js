import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import logo from '/assets/images/5d-logo.png'
import './index.css'
import {
  CCloseButton,
  CSidebar,
  CSidebarBrand,
  CSidebarFooter,
  CSidebarHeader,
  CSidebarToggler,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'

import { AppSidebarNav } from './AppSidebarNav'

import { sygnet } from 'src/assets/brand/sygnet'

// sidebar nav config
import { useNavItems } from './_nav'

const AppSidebar = () => {
  const dispatch = useDispatch()
  const unfoldable = useSelector((state) => state.sidebarUnfoldable)
  const sidebarShow = useSelector((state) => state.sidebarShow)
  const navItems = useNavItems()
  const [isHovered, setIsHovered] = useState(false)

  return (
    <CSidebar
      className={`border-end ${unfoldable ? 'unfoldable' : ''}`}
      position="fixed"
      unfoldable={unfoldable}
      visible={sidebarShow}
      onVisibleChange={(visible) => {
        dispatch({ type: 'set', sidebarShow: visible })
      }}
      onMouseEnter={() => unfoldable && setIsHovered(true)}
      onMouseLeave={() => unfoldable && setIsHovered(false)}
    >
      <CSidebarHeader className="border-bottom">
        <div className="d-flex align-items-center gap-2">
          <img src={logo} alt="logo" width="40" height="40" />
          {/* {(!unfoldable || isHovered) && <h6 className="sidebar-title">5d Dashboard</h6>} */}
          <h6 className="sidebar-title">5d Dashboard</h6>
        </div>
      </CSidebarHeader>
      <AppSidebarNav
        items={navItems}
        sidebarShow={sidebarShow && (!unfoldable || isHovered)}
        unfoldable={unfoldable}
      />
    </CSidebar>
  )
}

export default React.memo(AppSidebar)
