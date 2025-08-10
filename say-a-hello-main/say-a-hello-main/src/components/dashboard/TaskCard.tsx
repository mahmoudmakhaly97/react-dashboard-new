import React, { useEffect, useState } from 'react'
import { Employee, Task } from '@/pages/Dashboard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { format } from 'date-fns'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MessageSquareX, User, X } from 'lucide-react'
import { BASE_URL } from './../../api/base'

const TaskCard: React.FC<{
  task: Task
  employee: any
  handleViewDetails?: (task: Task) => void
}> = ({ task, employee, handleViewDetails }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [taskDetails, setTaskDetails] = useState<Task | null>(null)
  const [client, setClient] = useState<any>(null)
  const authTasks = JSON.parse(localStorage.getItem('authData'))

  const getBgColor = () => {
    switch (task.color) {
      case 'red':
        return 'bg-red-100'
      case 'green':
        return 'bg-green-100'
      case 'blue':
        return 'bg-blue-100'
      default:
        return 'bg-gray-100'
    }
  }

  const handleClick = () => {
    if (handleViewDetails) {
      handleViewDetails(task)
    }
  }

  // Fetch task details
  useEffect(() => {
    const getTaskDetails = async () => {
      try {
        const response = await fetch(`${BASE_URL}/Tasks/GetTaskById/${task.id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjM3NSIsInN1YiI6IjM3NSIsImVtYWlsIjoibmloYWwua2FtYWxANWQtYWdlbmN5LmNvbSIsImp0aSI6IjhkYmNjMjgyLWI5OTUtNDAxOS05MGU5LWY0NTgzY2E4ZDNmZSIsImV4cCI6MTc1NTI1MDMzNCwiaXNzIjoiQXR0ZW5kYW5jZUFwcCIsImF1ZCI6IkF0dGVuZGFuY2VBcGlVc2VyIn0.WEezDMsZA5tXzKY75XCeIaGScMaTwZJhg4WWE-ufdT0`,
          },
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        setTaskDetails(data)
      } catch (error) {
        console.error('Error fetching task details:', error)
      }
    }

    if (task.id) {
      getTaskDetails()
    }
  }, [task.id])

  // Fetch client details
  useEffect(() => {
    const getClient = async () => {
      try {
        // Fixed URL: removed duplicate 'api' and added missing slash
        const response = await fetch(`${BASE_URL}/Clients/GetClientById${taskDetails?.clientId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjM3NSIsInN1YiI6IjM3NSIsImVtYWlsIjoibmloYWwua2FtYWxANWQtYWdlbmN5LmNvbSIsImp0aSI6IjhkYmNjMjgyLWI5OTUtNDAxOS05MGU5LWY0NTgzY2E4ZDNmZSIsImV4cCI6MTc1NTI1MDMzNCwiaXNzIjoiQXR0ZW5kYW5jZUFwcCIsImF1ZCI6IkF0dGVuZGFuY2VBcGlVc2VyIn0.WEezDMsZA5tXzKY75XCeIaGScMaTwZJhg4WWE-ufdT0`,
          },
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        setClient(data)
      } catch (error) {
        console.error('Error fetching client details:', error)
      }
    }

    // Only fetch client if we have taskDetails with clientId
    if (taskDetails?.clientId) {
      getClient()
    }
  }, [taskDetails?.clientId])

  return (
    <>
      <div>
        <div
          className={`rounded-md p-3 mb-3 cursor-pointer   border border-gray-300 TaskCard ${getBgColor()}`}
          onClick={handleClick}
          style={{ height: `${2.4 * (taskDetails?.slotCount || 1)}rem` }}
        >
          <div className="flex items-center gap-3">
            {/* Employee info section - commented out as in original */}
          </div>

          {/* Display client name */}
          <div className="leading-[6px] text-xs">
            <span>{client?.name || 'Loading client...'}</span> -<span>{client?.clientCode}</span>
          </div>
        </div>
      </div>
    </>
  )
}

export default TaskCard
