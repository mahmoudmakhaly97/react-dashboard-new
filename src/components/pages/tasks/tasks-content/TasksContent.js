/* eslint-disable prettier/prettier */
import { useState, useEffect, useRef } from 'react'
import { Dashboard } from 'react-employee-calendar'
import { Card, CardHeader, CardTitle, UncontrolledTooltip } from 'reactstrap'

import 'react-employee-calendar/dist/index.css'
import { Button, Col, Input, Row, Form, FormGroup, Label } from 'reactstrap'
import { ModalMaker } from '../../../ui'
import { format, isSameDay } from 'date-fns'
import { Tooltip } from 'reactstrap'
import check from '/assets/images/check.png'
import warning from '/assets/images/warning.png'
import pending from '/assets/images/expired.png'
import './Tasks.scss'
import { useLocation, useNavigate } from 'react-router-dom'
import TimeSelector from './TimeSelector'
import { BASE_URL } from '../../../../api/base'
import { MessageSquareX } from 'lucide-react'
import HeadlessModal from '../../../ui/HeadlessModal'
// Modify your initial state to use location state
import { parse, isValid, differenceInMinutes } from 'date-fns'

const TasksContent = () => {
  const [modal, setModal] = useState(false)
  const [clients, setClients] = useState([])
  const [departments, setDepartments] = useState([])
  const [employees, setEmployees] = useState([])
  const [filteredEmployees, setFilteredEmployees] = useState([])
  const [selectedDate, setSelectedDate] = useState(null)
  const [taskCreated, setTaskCreated] = useState(false)
  const [tooltipOpen, setTooltipOpen] = useState(false)
  const [allowCreateTask, setAllowCreateTask] = useState(true)

  const [tooltipMessage, setTooltipMessage] = useState('')
  const [deleteModal, setDeleteModal] = useState(false)
  const [editModal, setEditModal] = useState(false)
  const [viewModal, setViewModal] = useState(false)
  const [taskToEdit, setTaskToEdit] = useState(null)
  const [taskToView, setTaskToView] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [managerTeam, setManagerTeam] = useState([])
  const [isManager, setIsManager] = useState(false)
  const [isLoadingTeam, setIsLoadingTeam] = useState(false)
  const [teamError, setTeamError] = useState(null)
  const authToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken')
  const authTasks = JSON.parse(localStorage.getItem('authData'))
  const Navigate = useNavigate()
  const location = useLocation()
  const [showOnlyMyTasks, setShowOnlyMyTasks] = useState(false)
  const [currentUserId, setCurrentUserId] = useState(null)
  const [selectedDepartment, setSelectedDepartment] = useState(null)

  // Add state to preserve selected employee
  const [lastSelectedEmployee, setLastSelectedEmployee] = useState(null)
  const [shouldMaintainSelection, setShouldMaintainSelection] = useState(false)

  // Tooltip states for past task warnings
  const [pastTaskTooltip, setPastTaskTooltip] = useState({
    show: false,
    message: '',
    target: null,
  })

  const [selectedEmployee, setSelectedEmployee] = useState(
    location.state?.employeeId
      ? {
          id: location.state.employeeId,
          name: location.state.employeeName,
        }
      : null,
  )
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedToEmployeeId: 0,
    assignedToEmployeeName: '',
    createdByEmployeeId: 0,
    createdByEmployeeName: '',
    updatedByEmployeeId: 0,
    departmentId: 0,
    departmentName: '',
    slotCount: 1,
    clientId: '',
    startTime: '',
    endTime: '',
    createdAt: new Date().toISOString(),
  })
  const [modalMessage, setModalMessage] = useState(null)
  const [errorEditModalMessage, setErrorEditModalMessage] = useState(null)
  const [modalEditVisible, setModalEditVisible] = useState(false)
  const [modalMessageVisible, setModalMessageVisible] = useState(false)
  const dashboardRef = useRef()
  const [taskToDelete, setTaskToDelete] = useState(null)
  const [persistentSelection, setPersistentSelection] = useState({
    employee: null,
    department: null,
  })

  useEffect(() => {
    const interval = setInterval(() => {
      if (dashboardRef.current) {
        const currentEmployee = dashboardRef.current.getSelectedEmployee?.()
        const currentDepartment = dashboardRef.current.getSelectedDepartment?.()

        if (
          currentEmployee &&
          (!persistentSelection.employee || currentEmployee.id !== persistentSelection.employee.id)
        ) {
          setPersistentSelection((prev) => ({
            ...prev,
            employee: { id: currentEmployee.id, name: currentEmployee.name },
          }))
        }

        if (
          currentDepartment &&
          (!persistentSelection.department ||
            currentDepartment.id !== persistentSelection.department.id)
        ) {
          setPersistentSelection((prev) => ({
            ...prev,
            department: { id: currentDepartment.id, name: currentDepartment.name },
          }))
        }
      }
    }, 500)

    return () => clearInterval(interval)
  }, [persistentSelection])
  // Function to show tooltip for past task operations
  const showPastTaskTooltip = (message, targetId) => {
    setPastTaskTooltip({
      show: true,
      message,
      target: targetId,
    })

    setTimeout(() => {
      setPastTaskTooltip((prev) => ({ ...prev, show: false }))
    }, 3000)
  }

  useEffect(() => {
    try {
      const authData = JSON.parse(localStorage.getItem('authData'))
      if (authData?.token) {
        const token = authData.token
        const base64Url = token.split('.')[1]
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
        const payload = JSON.parse(atob(base64))
        setCurrentUserId(payload.id)
      }
    } catch (error) {
      console.error('Failed to parse token:', error)
    }
  }, [])

  useEffect(() => {
    setShowOnlyMyTasks(location.pathname === '/my-tasks')
  }, [location])

  const toggle = () => {
    setModal(!modal)
    if (!modal) {
      resetFormData()
      setTaskToEdit(null)
    }
  }
  const toggleDeleteModal = () => setDeleteModal(!deleteModal)
  const toggleTooltip = () => setTooltipOpen(!tooltipOpen)

  useEffect(() => {
    const fetchManagerTeam = async () => {
      setIsLoadingTeam(true)
      setTeamError(null)
      try {
        const response = await fetch(`${BASE_URL}/Employee/GetManagerTeam`, {
          headers: {
            Authorization: `Bearer ${authTasks.token}`,
          },
        })

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`)
        }

        const data = await response.json()
        console.log('Manager Team Data:', data)

        const teamMembers = Array.isArray(data) ? data : data.employees || []
        console.log('Team Members:', teamMembers)
        setManagerTeam(teamMembers)
      } catch (error) {
        console.error('Error fetching manager team:', error)
      } finally {
        setIsLoadingTeam(false)
      }
    }

    fetchManagerTeam()
  }, [authTasks?.token])

  const fetchData = async () => {
    try {
      // Fetch clients
      const clientsResponse = await fetch(`${BASE_URL}/Clients/GetAllClients`, {
        headers: {
          Authorization: `Bearer  ${authTasks.token}`,
        },
      })
      const clientsData = await clientsResponse.json()
      setClients(clientsData)

      // Fetch departments
      const departmentsResponse = await fetch(`${BASE_URL}/Employee/GetDepartments`)
      const departmentsData = await departmentsResponse.json()
      setDepartments(departmentsData)

      // Fetch all employees without pagination
      const employeesResponse = await fetch(
        `${BASE_URL}/Employee/GetAllEmployees?pageNumber=1&pageSize=1000`,
      )
      const employeesData = await employeesResponse.json()
      setEmployees(employeesData.employees)
      setFilteredEmployees(employeesData.employees)
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }

  // Handle task deletion with employee selection preservation
  const handleDeleteTask = async (task) => {
    if (!task?.id) {
      console.error('Invalid task object received for deletion:', task)
      return
    }

    // Store current selection before deletion
    const currentSelection = {
      employee: dashboardRef.current?.getSelectedEmployee?.(),
      department: dashboardRef.current?.getSelectedDepartment?.(),
    }

    // Check if task is in past
    if (isTaskInPast(task.date)) {
      showPastTaskTooltip('Cannot delete tasks from previous days.', 'dashboard-container')
      setDeleteModal(false)
      setTaskToDelete(null)
      return
    }

    const taskId = Number(task.id)

    try {
      const response = await fetch(`${BASE_URL}/Tasks/DeleteTask/${taskId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          Authorization: `Bearer ${authTasks.token}`,
        },
        body: JSON.stringify(taskId),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! Status: ${response.status}`)
      }

      const data = await response.json()
      setModalMessage(data.message || 'Task deleted successfully')
      setModalMessageVisible(true)

      // Force refresh while maintaining selection
      dashboardRef.current.refresh()

      // Restore the previous selection after deletion
      setTimeout(() => {
        if (dashboardRef.current) {
          if (currentSelection.employee) {
            dashboardRef.current.setSelectedEmployee(currentSelection.employee)
          }
          if (currentSelection.department) {
            dashboardRef.current.setSelectedDepartment(currentSelection.department)
          }
          dashboardRef.current.refresh()
        }
      }, 100)
    } catch (error) {
      console.error('Failed to delete task:', error)
      setModalMessage(error.message || 'Failed to delete task. Please try again.')
      setModalMessageVisible(true)

      // Even on error, try to restore the previous view
      setTimeout(() => {
        if (dashboardRef.current && currentSelection.employee) {
          dashboardRef.current.setSelectedEmployee(currentSelection.employee)
        }
      }, 100)
    } finally {
      setDeleteModal(false)
      setTaskToDelete(null)
    }
  }

  // Updated handleTaskDeleted function
  const handleTaskDeleted = (task) => {
    console.log('Task object received:', task)

    if (!task || !task.id) {
      console.error('Invalid task object received:', task)
      setErrorEditModalMessage('Invalid task data')
      setModalEditVisible(true)
      return
    }

    if (!task.date) {
      console.error('Task missing date:', task)
      setErrorEditModalMessage('Task data is incomplete')
      setModalEditVisible(true)
      return
    }

    if (isTaskInPast(task.date)) {
      console.log('Attempt to delete past task detected')
      showPastTaskTooltip('Cannot delete tasks from previous days.', 'dashboard-container')
      return
    }

    setTaskToDelete(task)
    setDeleteModal(true)
  }

  // Fetch data when component mounts
  useEffect(() => {
    fetchData()
  }, [])

  // Enhanced selection maintenance effect - PRESERVE SELECTED EMPLOYEE
  useEffect(() => {
    const interval = setInterval(() => {
      if (dashboardRef.current) {
        const currentEmployee = dashboardRef.current.getSelectedEmployee?.()
        const currentDate = dashboardRef.current.getSelectedDate?.()

        // If we should maintain selection and have a stored employee
        if (
          shouldMaintainSelection &&
          lastSelectedEmployee &&
          (!currentEmployee || currentEmployee.id !== lastSelectedEmployee.id)
        ) {
          dashboardRef.current.setSelectedEmployee(lastSelectedEmployee)
          setSelectedEmployee(lastSelectedEmployee)
          return
        }

        // Normal selection tracking - but don't override with current user automatically
        if (currentEmployee && currentEmployee.id !== selectedEmployee?.id) {
          setSelectedEmployee(currentEmployee)
        }

        if (currentDate && currentDate !== selectedDate) {
          setSelectedDate(currentDate)
        }
      }
    }, 500)

    return () => clearInterval(interval)
  }, [selectedEmployee, selectedDate, shouldMaintainSelection, lastSelectedEmployee])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    // For client selection
    if (name === 'clientId') {
      setFormData((prev) => ({
        ...prev,
        clientId: value,
      }))
      return
    } else if (name === 'departmentId') {
      const selectedDept = departments.find((dept) => dept.id === Number(value))
      const filtered = selectedDept
        ? employees.filter((emp) => emp.department === selectedDept.name)
        : employees

      setFilteredEmployees(filtered)

      setFormData((prev) => ({
        ...prev,
        [name]: value,
        departmentName: selectedDept ? selectedDept.name : '',
        assignedToEmployeeId: 0,
        assignedToEmployeeName: '',
      }))
    } else if (name === 'assignedToEmployeeId') {
      const selectedEmployee = employees.find((emp) => emp.id === Number(value))
      setFormData((prev) => ({
        ...prev,
        assignedToEmployeeId: value,
        assignedToEmployeeName: selectedEmployee ? selectedEmployee.name : '',
      }))
    } else if (name === 'createdByEmployeeId') {
      const selectedEmployee = employees.find((emp) => emp.id === Number(value))
      setFormData((prev) => ({
        ...prev,
        createdByEmployeeId: value,
        createdByEmployeeName: selectedEmployee ? selectedEmployee.name : '',
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }))
    }
  }

  useEffect(() => {
    if (selectedEmployee) {
      setFormData((prev) => ({
        ...prev,
        assignedToEmployeeId: Number(selectedEmployee.id),
        assignedToEmployeeName: selectedEmployee.name,
        departmentId: selectedEmployee.departmentId || 0,
        departmentName: selectedEmployee.department || '',
        startTime: selectedDate ? format(selectedDate, "yyyy-MM-dd'T'HH:mm") : '',
      }))
    }
  }, [selectedEmployee, selectedDate])

  useEffect(() => {
    const handleSelectionChange = () => {
      if (dashboardRef.current) {
        const currentEmployee = dashboardRef.current.getSelectedEmployee?.()
        const currentDate = dashboardRef.current.getSelectedDate?.()

        if (currentEmployee && currentEmployee.id) {
          setSelectedEmployee(currentEmployee)
        }

        if (currentDate) {
          setSelectedDate(currentDate)
        }
      }
    }

    const interval = setInterval(handleSelectionChange, 100)
    return () => clearInterval(interval)
  }, [selectedEmployee, selectedDate])

  const resetFormData = () => {
    setFormData({
      title: '',
      description: '',
      assignedToEmployeeId: 0,
      assignedToEmployeeName: '',
      createdByEmployeeId: 0,
      createdByEmployeeName: '',
      updatedByEmployeeId: 0,
      departmentId: 0,
      departmentName: '',
      slotCount: 1,
      clientId: '',
      startTime: '',
      endTime: '',
      createdAt: new Date().toISOString(),
    })
  }

  const validateTaskDateTime = (selectedDate, startTime, isEdit = false) => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const taskDate = new Date(selectedDate)
    const taskDay = new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate())

    if (taskDay < today) {
      return {
        isValid: false,
        message: `Cannot ${isEdit ? 'edit' : 'create'} tasks for past dates`,
      }
    }

    if (!isEdit && taskDay.getTime() === today.getTime()) {
      const currentTime = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        now.getHours(),
        now.getMinutes(),
      )

      const taskDateTime = parseTimeStringToDateTime(startTime, taskDate)

      if (taskDateTime <= currentTime) {
        return {
          isValid: false,
          message: 'Cannot create tasks with start time in the past',
        }
      }
    }

    return {
      isValid: true,
    }
  }

  const parseTimeStringToDateTime = (timeStr, date) => {
    if (!timeStr || !date) return null

    const [timePart, period] = timeStr.includes(' ') ? timeStr.split(' ') : [timeStr, null]
    const [hoursStr, minutesStr = '0'] = timePart.split(':')
    let hours = parseInt(hoursStr, 10)
    const minutes = parseInt(minutesStr, 10)

    if (period === 'PM' && hours < 12) hours += 12
    if (period === 'AM' && hours === 12) hours = 0

    const taskTime = new Date(date)
    taskTime.setHours(hours, minutes, 0, 0)

    return taskTime
  }

  // Enhanced handleSubmit with employee selection preservation - KEEP SELECTED EMPLOYEE VIEW
  const handleSubmit = async (e) => {
    e.preventDefault()

    // Store current selection before submission - PRESERVE THE CURRENTLY SELECTED EMPLOYEE
    const currentEmployee = selectedEmployee
    setShouldMaintainSelection(true)
    setLastSelectedEmployee(currentEmployee)
    // Store current selection before operation
    const currentSelection = {
      employee: dashboardRef.current?.getSelectedEmployee?.(),
      department: dashboardRef.current?.getSelectedDepartment?.(),
    }
    try {
      const selectedDate = dashboardRef.current?.getSelectedDate?.() || new Date()
      const validation = validateTaskDateTime(selectedDate, formData.startTime, false)
      if (!validation.isValid) {
        setTooltipMessage(validation.message)
        setTooltipOpen(true)
        setTimeout(() => setTooltipOpen(false), 4000)
        setShouldMaintainSelection(false)
        return
      }

      const convertToEgyptISOTime = (timeStr, date = selectedDate) => {
        if (!timeStr || !date) return null

        const [timePart, period] = timeStr.includes(' ') ? timeStr.split(' ') : [timeStr, null]
        const [hoursStr, minutesStr = '0'] = timePart.split(':')
        let hours = parseInt(hoursStr, 10)
        const minutes = parseInt(minutesStr, 10)

        if (period === 'PM' && hours < 12) hours += 12
        if (period === 'AM' && hours === 12) hours = 0

        const dateObj = new Date(date)
        dateObj.setHours(hours, minutes, 0, 0)
        const tzOffset = dateObj.getTimezoneOffset() * 60000
        return new Date(dateObj.getTime() - tzOffset).toISOString()
      }

      if (!formData.startTime || !formData.slotCount || formData.slotCount <= 0) {
        setModalMessage('Start time and slot count are required and must be valid')
        setModalMessageVisible(true)
        setShouldMaintainSelection(false)
        return
      }

      const apiData = {
        id: 0,
        title: formData.title,
        description: formData.description,
        assignedToEmployeeId: Number(formData.assignedToEmployeeId || selectedEmployee?.id),
        createdByEmployeeId: Number(formData.createdByEmployeeId),
        updatedByEmployeeId: Number(formData.updatedByEmployeeId || formData.createdByEmployeeId),
        departmentId: Number(formData.departmentId || selectedEmployee?.departmentId || 0),
        slotCount: Math.max(1, Number(formData.slotCount)),
        startTime: convertToEgyptISOTime(formData.startTime, selectedDate),
        endTime: formData.endTime ? convertToEgyptISOTime(formData.endTime, selectedDate) : null,
        createdAt: new Date().toISOString(),
        clientId: formData.clientId,
        needsApproval: formData.needsApproval || false,
        status: formData.status || 'Approved',
      }

      const response = await fetch(`${BASE_URL}/Tasks/CreateTask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authTasks.token}`,
        },
        body: JSON.stringify(apiData),
      })

      if (!response.ok) {
        const errorText = await response.text()
        if (errorText.includes('Time slot conflict') || errorText.includes('overlaps')) {
          setTooltipMessage(
            'Oops! This time slot overlaps with an existing task. Please choose a different time.',
          )
          setTooltipOpen(true)
          setTimeout(() => setTooltipOpen(false), 4000)
          setShouldMaintainSelection(false)
          return
        }
        setModalMessage(`Error creating task: ${errorText || 'Unknown error'}`)
        setModalMessageVisible(true)
        setShouldMaintainSelection(false)
        return
      }

      // Success case
      setModalMessage('Task created successfully.')
      setModalMessageVisible(true)
      toggle()
      setTaskCreated(true)

      setTimeout(() => {
        if (dashboardRef.current && currentSelection.employee) {
          dashboardRef.current.setSelectedEmployee(currentSelection.employee)
          dashboardRef.current.refresh()
        }
      }, 100)

      resetFormData()
      await fetchData()
    } catch (error) {
      console.error('Error submitting task:', error)
      setTooltipMessage('Oops! Something went wrong. Please try again.')
      setTooltipOpen(true)
      setTimeout(() => setTooltipOpen(false), 4000)
      setShouldMaintainSelection(false)
    }
  }

  useEffect(() => {
    if (taskCreated) {
      fetchData()
      setTaskCreated(false)
    }
  }, [taskCreated])

  const handleEditTask = async (taskId) => {
    try {
      console.log('Fetching task with ID:', taskId)

      const response = await fetch(`${BASE_URL}/Tasks/GetTaskById/${taskId.id}`, {
        headers: {
          Authorization: `Bearer ${authTasks.token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('API Error Details:', errorData)
        throw new Error(
          errorData.message ||
            errorData.title ||
            `Failed to fetch task details (Status: ${response.status})`,
        )
      }

      const taskData = await response.json()
      console.log('Task Data Received:', taskData)

      if (taskData.status === 'Completed') {
        setModalMessage('This task is already completed and cannot be edited.')
        setModalMessageVisible(true)
        return
      }

      if (isTaskInPast(taskData.startTime)) {
        showPastTaskTooltip('Cannot edit tasks from previous days.', 'dashboard-container')
        return
      }

      const startTime = taskData.startTime ? format(new Date(taskData.startTime), 'HH:mm') : ''
      const endTime = taskData.endTime ? format(new Date(taskData.endTime), 'HH:mm') : ''
      const clientId = taskData.clientId ? String(taskData.clientId) : ''

      setTaskToEdit(taskData)
      setFormData({
        title: taskData.title || '',
        description: taskData.description || '',
        assignedToEmployeeId: taskData.assignedToEmployeeId || 0,
        assignedToEmployeeName: taskData.assignedToEmployeeName || '',
        createdByEmployeeId: taskData.createdByEmployeeId || 0,
        createdByEmployeeName: taskData.createdByEmployeeName || '',
        updatedByEmployeeId: taskData.updatedByEmployeeId || 0,
        departmentId: taskData.departmentId || 0,
        departmentName: taskData.departmentName || '',
        slotCount: taskData.slotCount || 1,
        clientId: clientId,
        startTime: startTime,
        endTime: endTime,
        createdAt: taskData.createdAt || new Date().toISOString(),
      })

      setEditModal(true)
    } catch (error) {
      console.error('Error in handleEditTask:', error)
      setModalMessage(`Error: ${error.message}`)
      setModalMessageVisible(true)
      setEditModal(false)
    }
  }

  const isTaskInPast = (isoString) => {
    if (!isoString) return false

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const taskDate = new Date(isoString)
    if (isNaN(taskDate.getTime())) {
      console.error('Invalid date string:', isoString)
      return false
    }

    const taskDay = new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate())

    console.log('Comparing dates - Today:', today, 'Task date:', taskDay)
    return taskDay < today
  }

  // Enhanced handleUpdateTask with employee selection preservation - KEEP SELECTED EMPLOYEE VIEW
  const handleUpdateTask = async (e) => {
    e.preventDefault()

    if (!taskToEdit) {
      console.error('No task selected for editing')
      return
    }

    // Store current selection before any operations
    const currentSelection = {
      employee: dashboardRef.current?.getSelectedEmployee?.(),
      department: dashboardRef.current?.getSelectedDepartment?.(),
    }

    try {
      const selectedDate = new Date(taskToEdit.startTime)

      // Validate task date/time
      const validation = validateTaskDateTime(selectedDate, formData.startTime, true)
      if (!validation.isValid) {
        setTooltipMessage(validation.message)
        setTooltipOpen(true)
        setTimeout(() => setTooltipOpen(false), 4000)
        return
      }

      // Convert time to Egypt timezone
      const convertToEgyptISOTime = (timeStr, date = selectedDate) => {
        if (!timeStr || !date) return null

        if (timeStr.includes(' ')) {
          const [timePart, period] = timeStr.split(' ')
          const [hoursStr, minutesStr] = timePart.split(':')

          let hours = parseInt(hoursStr, 10)
          const minutes = parseInt(minutesStr || '0', 10)

          if (period === 'PM' && hours < 12) hours += 12
          if (period === 'AM' && hours === 12) hours = 0

          const dateObj = new Date(date)
          dateObj.setHours(hours, minutes, 0, 0)

          const tzOffset = dateObj.getTimezoneOffset() * 60000
          return new Date(dateObj.getTime() - tzOffset).toISOString()
        }

        const [hoursStr, minutesStr] = timeStr.split(':')
        const hours = parseInt(hoursStr, 10)
        const minutes = parseInt(minutesStr || '0', 10)

        const dateObj = new Date(date)
        dateObj.setHours(hours, minutes, 0, 0)

        const tzOffset = dateObj.getTimezoneOffset() * 60000
        return new Date(dateObj.getTime() - tzOffset).toISOString()
      }

      // Validate required fields
      if (!formData.startTime || !formData.slotCount || formData.slotCount <= 0) {
        setModalMessage('Start time and slot count are required and must be valid')
        setModalMessageVisible(true)
        return
      }

      // Prepare API data
      const apiData = {
        id: taskToEdit.id,
        title: formData.title,
        description: formData.description,
        assignedToEmployeeId: Number(
          formData.assignedToEmployeeId || currentSelection.employee?.id,
        ),
        createdByEmployeeId: Number(formData.createdByEmployeeId),
        updatedByEmployeeId: Number(formData.updatedByEmployeeId || formData.createdByEmployeeId),
        departmentId: Number(formData.departmentId || currentSelection.employee?.departmentId || 0),
        slotCount: Number(formData.slotCount),
        clientId: formData.clientId,
        startTime: convertToEgyptISOTime(formData.startTime),
        endTime: formData.endTime ? convertToEgyptISOTime(formData.endTime) : null,
        createdAt: formData.createdAt,
      }

      // Send update request
      const response = await fetch(`${BASE_URL}/Tasks/UpdateTask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authTasks.token}`,
        },
        body: JSON.stringify(apiData),
      })

      const responseData = await response.json()

      if (!response.ok) {
        let errorMessage = 'Error updating task. Please try again.'

        if (
          responseData.message?.includes('Time slot conflict') ||
          responseData.error?.includes('Time slot conflict') ||
          responseData.message?.includes('overlaps') ||
          responseData.error?.includes('overlaps')
        ) {
          errorMessage =
            'This time slot overlaps with an existing task. Please choose a different time.'
        }

        throw new Error(errorMessage)
      }

      // Success case
      setModalMessage('Task updated successfully')
      setModalMessageVisible(true)
      setEditModal(false)
      setTaskToEdit(null)
      dashboardRef.current.refresh()
      resetFormData()

      // Restore previous selection after successful update
      setTimeout(() => {
        if (dashboardRef.current) {
          if (currentSelection.employee) {
            dashboardRef.current.setSelectedEmployee(currentSelection.employee)
          }
          if (currentSelection.department) {
            dashboardRef.current.setSelectedDepartment(currentSelection.department)
          }
          dashboardRef.current.refresh()
        }
      }, 100)
    } catch (error) {
      console.error('Error updating task:', error)

      // Show appropriate error message
      if (error.message.includes('time slot')) {
        setTooltipMessage(error.message)
        setTooltipOpen(true)
        setTimeout(() => setTooltipOpen(false), 4000)
      } else {
        setModalMessage(error.message)
        setModalMessageVisible(true)
      }

      // Attempt to restore previous view even on error
      setTimeout(() => {
        if (dashboardRef.current && currentSelection.employee) {
          dashboardRef.current.setSelectedEmployee(currentSelection.employee)
        }
      }, 100)
    }
  }
  function parseTimeToSelectorValue(timeStr) {
    if (!timeStr) return { hours: 12, minutes: 0, period: 'AM' }

    const date = new Date(timeStr)
    if (!isNaN(date.getTime())) {
      const hours24 = date.getHours()
      const minutes = date.getMinutes()
      const period = hours24 >= 12 ? 'PM' : 'AM'

      let hours12 = hours24 % 12
      if (hours12 === 0) hours12 = 12

      return {
        hours: hours12,
        minutes,
        period,
      }
    }

    const timeParts = timeStr.trim().split(' ')
    let time = timeParts[0]
    let modifier = timeParts[1]

    if (!modifier && time.includes(':')) {
      const [h, m] = time.split(':')
      const hours24 = parseInt(h, 10)
      const minutes = parseInt(m, 10)
      const period = hours24 >= 12 ? 'PM' : 'AM'

      let hours12 = hours24 % 12
      if (hours12 === 0) hours12 = 12

      return {
        hours: hours12,
        minutes,
        period,
      }
    }

    const [h, m] = time.split(':')
    return {
      hours: h === '00' ? 12 : Number(h) % 12 || 12,
      minutes: Number(m),
      period: modifier?.toUpperCase() === 'PM' ? 'PM' : 'AM',
    }
  }

  useEffect(() => {
    try {
      const authData = JSON.parse(localStorage.getItem('authData'))
      if (authData?.token) {
        const token = authData.token
        const base64Url = token.split('.')[1]
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
        const payload = JSON.parse(atob(base64))
        setCurrentUserId(payload.id)
      }
    } catch (error) {
      console.error('Failed to parse token:', error)
    }
  }, [])

  useEffect(() => {
    setShowOnlyMyTasks(location.pathname === '/my-tasks')
  }, [location])

  const isEmployeeInManagerTeam = (employeeId) => {
    if (authTasks?.role === 'Account Manager') {
      return true
    }

    const hasSubordinates = managerTeam.length > 0

    if (hasSubordinates) {
      if (currentUserId && String(employeeId) === String(currentUserId)) {
        return true
      }

      const isDirectTeamMember = managerTeam.some(
        (teamMember) => String(teamMember.id) === String(employeeId),
      )

      const isSubEmployee = employees.some((emp) => {
        const isManagedByTeamMember = managerTeam.some(
          (teamMember) => String(teamMember.id) === String(emp.managerId),
        )
        return isManagedByTeamMember && String(emp.id) === String(employeeId)
      })

      return isDirectTeamMember || isSubEmployee
    }

    return false
  }

  useEffect(() => {
    const interval = setInterval(() => {
      if (dashboardRef.current) {
        const currentDept = dashboardRef.current.getSelectedDepartment?.()
        const currentEmployee = dashboardRef.current.getSelectedEmployee?.()

        if (currentDept?.id !== selectedDepartment?.id) {
          setSelectedDepartment(currentDept)
        }

        if (currentEmployee?.id !== selectedEmployee?.id) {
          setSelectedEmployee(currentEmployee)
        }
      }
    }, 100)

    return () => clearInterval(interval)
  }, [selectedEmployee, selectedDepartment])

  const handleViewDetails = async (task) => {
    try {
      const response = await fetch(`${BASE_URL}/Tasks/GetTaskById/${task.id}`, {
        headers: {
          Authorization: `Bearer ${authTasks.token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch task details')
      }

      const taskDetails = await response.json()
      console.log('taskDetails', taskDetails)
      setTaskToView(taskDetails)
      setViewModal(true)
    } catch (error) {
      console.error('Error fetching task details:', error)
      setModalMessage('Failed to load task details')
      setModalMessageVisible(true)
    }
  }

  const padTime = (timeStr) => {
    if (!timeStr) return null

    if (timeStr.includes('T')) {
      const date = new Date(timeStr)
      return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
    }

    if (timeStr.includes(' ')) {
      const [time, period] = timeStr.split(' ')
      let [h, m] = time.split(':').map(Number)
      if (period === 'PM' && h < 12) h += 12
      if (period === 'AM' && h === 12) h = 0
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
    }

    const [h, m] = timeStr.split(':').map(Number)
    if (isNaN(h) || isNaN(m)) return null
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
  }

  const formatDuration = (startISO, endISO) => {
    try {
      const start = new Date(startISO)
      const end = new Date(endISO)

      if (!isValid(start) || !isValid(end)) return 'Invalid time'

      let minutes = differenceInMinutes(end, start)
      if (isNaN(minutes)) return 'Invalid duration'

      minutes = Math.abs(minutes)

      const hrs = Math.floor(minutes / 60)
      const mins = minutes % 60

      if (hrs && mins) return `${hrs} hr : ${mins} min`
      if (hrs) return `${hrs} hr`
      return `${mins} min`
    } catch (error) {
      console.error('Duration calculation error:', error)
      return 'Invalid time'
    }
  }

  return (
    <div className="tasks-container  ">
      {selectedEmployee?.id && selectedEmployee?.name ? (
        authTasks?.role === 'Account Manager' ? (
          <Button color="primary" onClick={toggle} className="add-task">
            Add Task for {selectedEmployee.name}
          </Button>
        ) : isEmployeeInManagerTeam(selectedEmployee.id) ? (
          <Button color="primary" onClick={toggle} className="add-task">
            {String(selectedEmployee.id) === String(currentUserId)
              ? 'Add Task for Myself'
              : `Add Task for ${selectedEmployee.name}`}
          </Button>
        ) : (
          <div className="d-flex justify-content-end align-items-center mb-4 pe-5">
            <span
              id="disabledButtonWrapper"
              style={{
                display: 'inline-block',
                cursor: 'not-allowed',
              }}
            >
              <Button color="primary" disabled style={{ pointerEvents: 'none', opacity: 0.5 }}>
                {String(selectedEmployee.id) === String(currentUserId)
                  ? 'Add Task for Myself'
                  : `Add Task for ${selectedEmployee?.name}`}
              </Button>
            </span>
            <UncontrolledTooltip
              target="disabledButtonWrapper"
              placement="top"
              delay={{ show: 0, hide: 0 }}
              fade={true}
            >
              {String(selectedEmployee.id) === String(currentUserId)
                ? managerTeam.length === 0
                  ? 'Regular employees cannot add tasks for themselves'
                  : "You don't have permission to add tasks"
                : 'You can only add tasks for members of your team or their subordinates'}
            </UncontrolledTooltip>
          </div>
        )
      ) : null}

      {pastTaskTooltip.show && pastTaskTooltip.target && (
        <UncontrolledTooltip
          target={pastTaskTooltip.target}
          placement="center"
          delay={{ show: 0, hide: 0 }}
          fade={true}
          isOpen={pastTaskTooltip.show}
          className="custom-tooltip"
        >
          <div className="text-warning fw-bold">⚠️ {pastTaskTooltip.message}</div>
        </UncontrolledTooltip>
      )}

      <ModalMaker modal={modal} toggle={toggle} centered size={'lg'}>
        <Row>
          <Col md={12}>
            <h1 className="my-4">Create New Task</h1>
            <Form onSubmit={handleSubmit}>
              <Row>
                <Col md={6}>
                  <FormGroup>
                    <Label for="title">Title</Label>
                    <Input
                      type="text"
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                    />
                  </FormGroup>
                </Col>
                <Col md={6}>
                  <FormGroup>
                    <Label for="clientId">Client</Label>
                    <Input
                      type="select"
                      id="clientId"
                      name="clientId"
                      value={formData.clientId}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select a client</option>
                      {clients.map((client) => (
                        <option
                          key={client.id}
                          value={client.id}
                          selected={client.id === formData.clientId}
                        >
                          {client.name} (Code: {client.clientCode})
                        </option>
                      ))}
                    </Input>
                  </FormGroup>
                </Col>
              </Row>

              <Row className="my-3">
                <Col>
                  <FormGroup>
                    <Label for="description">Description</Label>
                    <Input
                      type="textarea"
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                    />
                  </FormGroup>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <TimeSelector
                    label="Start Time"
                    name="startTime"
                    value={{
                      hours: parseInt(formData.startTime.split(':')[0], 10),
                      minutes: parseInt(formData.startTime.split(':')[1], 10),
                    }}
                    onChange={handleInputChange}
                  />
                </Col>
                <Col md={6}>
                  <FormGroup>
                    <Label for="slotCount">Slot Count</Label>
                    <Input
                      type="number"
                      id="slotCount"
                      name="slotCount"
                      min="1"
                      value={formData.slotCount}
                      onChange={handleInputChange}
                      required
                    />
                    <Tooltip
                      placement="top"
                      isOpen={tooltipOpen}
                      target="slotCount"
                      popperClassName="tooltip-style"
                    >
                      <p className="text-danger fw-bold">{tooltipMessage}</p>
                    </Tooltip>
                    <small className="text-muted">
                      Total time:{' '}
                      {formData.slotCount * 20 >= 60
                        ? `${Math.floor((formData.slotCount * 20) / 60)}h ${
                            (formData.slotCount * 20) % 60
                          }m`
                        : `${formData.slotCount * 20}m`}
                    </small>
                  </FormGroup>
                </Col>

                <Col md={6} className="d-none">
                  <FormGroup>
                    <Label for="endTime">End Time</Label>
                    <Input
                      type="datetime-local"
                      id="endTime"
                      name="endTime"
                      value={formData.endTime}
                      onChange={handleInputChange}
                    />
                  </FormGroup>
                </Col>
              </Row>

              <Row>
                <Col md={6} className="d-none">
                  <FormGroup>
                    <Label for="departmentId">Department</Label>
                    <Input
                      type="select"
                      id="departmentId"
                      name="departmentId"
                      value={formData.departmentId}
                      onChange={handleInputChange}
                    >
                      <option value="">Select a department</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </Input>
                  </FormGroup>
                </Col>
              </Row>

              <Row className="my-3 d-none">
                <Col md={6}>
                  <FormGroup>
                    <Label for="assignedToEmployeeId">Assigned To</Label>
                    <Input
                      type="select"
                      id="assignedToEmployeeId"
                      name="assignedToEmployeeId"
                      value={formData.assignedToEmployeeId}
                      onChange={handleInputChange}
                    >
                      <option value="">Select an employee</option>
                      {filteredEmployees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.name} ({emp.department})
                        </option>
                      ))}
                    </Input>
                  </FormGroup>
                </Col>
                <Col md={6}>
                  <FormGroup>
                    <Label for="createdByEmployeeId">Created By</Label>
                    <Input
                      type="select"
                      id="createdByEmployeeId"
                      name="createdByEmployeeId"
                      value={formData.createdByEmployeeId}
                      onChange={handleInputChange}
                    >
                      <option value="">Select an employee</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.name} ({emp.department})
                        </option>
                      ))}
                    </Input>
                  </FormGroup>
                </Col>
              </Row>

              <div>
                <Button
                  id="submitTaskBtn"
                  color="primary"
                  type="submit"
                  className="px-3 w-100 py-2 mt-4"
                >
                  Create Task
                </Button>
              </div>
            </Form>
          </Col>
        </Row>
      </ModalMaker>

      {modalMessageVisible && (
        <ModalMaker
          size="md"
          modal={modalMessageVisible}
          toggle={() => setModalMessageVisible(false)}
          centered
        >
          <div className="d-flex flex-column justify-content-center align-items-center gap-3 p-4">
            <img src={check} width={70} height={70} alt="success" />
            <h4 className="text-center">{modalMessage}</h4>
            <Button color="primary" onClick={() => setModalMessageVisible(false)}>
              OK{' '}
            </Button>
          </div>
        </ModalMaker>
      )}

      {modalEditVisible && (
        <UncontrolledTooltip
          target="disabledButtonWrapper"
          placement="top"
          delay={{ show: 0, hide: 0 }}
          fade={true}
        >
          {errorEditModalMessage}
        </UncontrolledTooltip>
      )}

      {modalMessageVisible &&
        modalMessage === 'Your request is pending and waiting for manager approval.' && (
          <ModalMaker
            size="md"
            modal={modalMessageVisible}
            toggle={() => setModalMessageVisible(false)}
            centered
          >
            <div className="d-flex flex-column justify-content-center align-items-center gap-3 p-4">
              <img src={pending} width={70} height={70} alt="success" />
              <h4 className="text-center">{modalMessage}</h4>
              <Button color="primary" onClick={() => setModalMessageVisible(false)}>
                OK{' '}
              </Button>
            </div>
          </ModalMaker>
        )}

      <ModalMaker modal={deleteModal} toggle={toggleDeleteModal} centered size="md">
        <div className="p-4 text-center">
          <h4>Are you sure you want to delete this task?</h4>
          <p className="text-muted mb-4">"{taskToDelete?.title}" will be permanently removed.</p>
          <div className="d-flex justify-content-center gap-3">
            <Button color="secondary" onClick={toggleDeleteModal}>
              Cancel
            </Button>
            <Button color="danger" onClick={() => handleDeleteTask(taskToDelete)}>
              Delete Task
            </Button>
          </div>
        </div>
      </ModalMaker>

      <ModalMaker modal={editModal} toggle={() => setEditModal(false)} centered size={'lg'}>
        <Row>
          <Col md={12}>
            <h1 className="my-4">Edit Task</h1>
            <Form onSubmit={handleUpdateTask}>
              <Row>
                <Col md={6}>
                  <FormGroup>
                    <Label for="title">Title</Label>
                    <Input
                      type="text"
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                    />
                  </FormGroup>
                </Col>
                <Col md={6}>
                  <FormGroup>
                    <Label for="clientId">Client</Label>
                    <Input
                      type="select"
                      id="clientId"
                      name="clientId"
                      value={formData.clientId}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select a client</option>
                      {clients.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.name} (Code: {client.clientCode})
                        </option>
                      ))}
                    </Input>
                  </FormGroup>
                </Col>
              </Row>

              <Row className="my-3">
                <Col>
                  <FormGroup>
                    <Label for="description">Description</Label>
                    <Input
                      type="textarea"
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                    />
                  </FormGroup>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <FormGroup>
                    <TimeSelector
                      name="startTime"
                      label="Start Time"
                      value={parseTimeToSelectorValue(formData.startTime)}
                      onChange={handleInputChange}
                      required
                    />
                  </FormGroup>
                </Col>
                <Col md={6}>
                  <FormGroup>
                    <Label for="slotCount"> Slot Count</Label>
                    <Input
                      type="number"
                      id="slotCount"
                      name="slotCount"
                      min="1"
                      value={formData.slotCount}
                      onChange={handleInputChange}
                      required
                    />
                    <Tooltip
                      placement="top"
                      isOpen={tooltipOpen}
                      target="slotCount"
                      popperClassName="tooltip-style"
                    >
                      <p className="text-danger fw-bold">{tooltipMessage}</p>
                    </Tooltip>
                    <small className="text-muted">
                      Total time:{' '}
                      {formData.slotCount * 20 >= 60
                        ? `${Math.floor((formData.slotCount * 20) / 60)}h ${
                            (formData.slotCount * 20) % 60
                          }m`
                        : `${formData.slotCount * 20}m`}
                    </small>
                  </FormGroup>
                </Col>
              </Row>

              <div>
                <Button
                  id="updateTaskBtn"
                  color="primary"
                  type="submit"
                  className="px-3 w-100 py-2 mt-4"
                >
                  Update Task
                </Button>
              </div>
            </Form>
          </Col>
        </Row>
      </ModalMaker>

      <ModalMaker
        modal={viewModal}
        toggle={() => setViewModal(false)}
        centered
        size={'md'}
        viewHeader={false}
      >
        <div className="py-3">
          <div className="d-flex justify-content-between pointer">
            <h1 className="text-2xl font-semibold"> {taskToView?.title}</h1>{' '}
            <MessageSquareX onClick={() => setViewModal(false)} />
          </div>
          <div className="d-flex justify-content-between text-muted">
            <span>
              <span className="font-semibold"> task duration </span>:
              {taskToView?.startTime && taskToView?.endTime
                ? formatDuration(taskToView.startTime, taskToView.endTime)
                : 'No duration'}
            </span>
          </div>
          <span>
            <span className="font-semibold">slot count : </span>:{taskToView?.slotCount}
          </span>{' '}
          <p>
            <span className="font-semibold"> Start time: </span>{' '}
            {taskToView?.startTime && new Date(taskToView.startTime).toLocaleString()}
          </p>
          <span>
            {' '}
            <span className="font-semibold"> Assigned To : </span>
            {taskToView?.assignedToEmployeeName}
          </span>{' '}
          <br />
          <span>
            {' '}
            <span className="font-semibold">updated by : </span>
            {taskToView?.updatedByEmployeeName}
          </span>{' '}
          <div>
            {' '}
            <span className="font-semibold">description: </span>
            {taskToView?.description}
          </div>
        </div>
      </ModalMaker>

      <div id="dashboard-container" className="dashboard-container">
        <Dashboard
          ref={dashboardRef}
          onEditTask={handleEditTask}
          onDeleteTask={handleTaskDeleted}
          key={refreshKey}
          onAllowCreateTaskChange={setAllowCreateTask}
          showOnlyMyTasks={showOnlyMyTasks}
          currentUserId={currentUserId}
          handleViewDetails={handleViewDetails}
        />
      </div>
    </div>
  )
}

export default TasksContent
