import React, { useEffect, useRef, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { CContainer, CHeader, CHeaderNav, CHeaderToggler } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilBell,
  cilContrast,
  cilEnvelopeOpen,
  cilList,
  cilMenu,
  cilMoon,
  cilSun,
} from '@coreui/icons'

import AppHeaderDropdown from './AppHeaderDropdown'

const AppHeader = () => {
  const headerRef = useRef()
  const dispatch = useDispatch()
  const sidebarShow = useSelector((state) => state.sidebarShow)
  const unfoldable = useSelector((state) => state.sidebarUnfoldable)

  const toggleSidebar = () => {
    if (sidebarShow) {
      // If sidebar is visible, toggle between full and icon-only
      dispatch({ type: 'set', sidebarUnfoldable: !unfoldable })
    } else {
      // If sidebar is hidden, show it in full mode
      dispatch({ type: 'set', sidebarShow: true, sidebarUnfoldable: false })
    }
  }

  return (
    <CHeader position="sticky" className="mb-4 p-0" ref={headerRef}>
      <CContainer className="border-bottom px-4 d-flex justify-content-between" fluid>
        <CHeaderToggler
          onClick={toggleSidebar} // Use the new toggle function
          style={{ marginInlineStart: '-14px' }}
        >
          <CIcon icon={cilMenu} size="lg" />
        </CHeaderToggler>

        <CHeaderNav>
          <AppHeaderDropdown />
        </CHeaderNav>
      </CContainer>
    </CHeader>
  )
}

export default AppHeader
