import { useEffect, useState } from 'react'
import axios from 'axios'
import { BASE_URL } from '../../../../api/base'
import { Alert, Col, Row } from 'reactstrap'
import './requests.scss'
import { Check, X } from 'lucide-react'
import { Loader } from '../../../ui'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

const Requests = () => {
  const [pendingRequests, setPendingRequests] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [employees, setEmployees] = useState({})
  const authTasks = JSON.parse(localStorage.getItem('authData'))

  const handleApproveTask = async (requestId, taskTitle) => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.post(
        `${BASE_URL}/Tasks/approvalAfterBusinessTimeByManager`,
        {
          id: 0, // This might need to be the task ID or request ID
          approvalRequestId: requestId,
          isApproved: true,
          rejectionReason: '',
        },
        {
          headers: {
            Authorization: `Bearer ${authTasks.token}`,
          },
        },
      )

      // Show success toast
      toast.success(`Task "${taskTitle}" approved successfully!`, {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      })

      // Remove the approved request from the list
      setPendingRequests((prev) => prev.filter((request) => request.id !== requestId))
    } catch (error) {
      console.error('Error approving task:', error)
      // Show error toast
      toast.error(`Failed to approve task: ${error.message}`, {
        position: 'top-right',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      })
    }
  }

  const handleDeclineTask = async (requestId, taskTitle) => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.post(
        `${BASE_URL}/Tasks/approvalAfterBusinessTimeByManager`,
        {
          id: 0, // This might need to be the task ID or request ID
          approvalRequestId: requestId,
          isApproved: false,
          rejectionReason: 'Manager declined the request',
        },
        {
          headers: {
            Authorization: `Bearer ${authTasks.token}`,
          },
        },
      )

      // Show success toast
      toast.warning(`Task "${taskTitle}" has been declined.`, {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      })

      // Remove the declined request from the list
      setPendingRequests((prev) => prev.filter((request) => request.id !== requestId))
    } catch (error) {
      console.error('Error declining task:', error)
      // Show error toast
      toast.error(`Failed to decline task: ${error.message}`, {
        position: 'top-right',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      })
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const token = localStorage.getItem('token')

        // Fetch pending tasks
        const tasksResponse = await axios.get(`${BASE_URL}/Tasks/pending`, {
          headers: { Authorization: `Bearer ${authTasks.token}` },
        })

        // Parse taskDetailsJson
        const parsedData = tasksResponse.data.map((item) => ({
          ...item,
          taskDetails: JSON.parse(item.taskDetailsJson),
        }))

        // Get unique employee IDs from tasks
        const employeeIds = [
          ...new Set(parsedData.map((task) => task.taskDetails.AssignedToEmployeeId)),
        ]

        // Fetch all employees data
        const employeesData = {}
        for (const id of employeeIds) {
          const response = await axios.get(
            `https://attendance-service.5d-dev.com/api/Employee/GetEmployeeWithId?id=${id}`,
            { headers: { Authorization: `Bearer ${authTasks.token}` } },
          )
          employeesData[id] = response.data
        }

        setPendingRequests(parsedData)
        setEmployees(employeesData)
      } catch (error) {
        console.error('Error:', error)
        toast.error('Failed to load pending requests', {
          position: 'top-right',
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  if (isLoading) {
    return <Loader />
  }

  return (
    <div className="requests">
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />

      <h3 className="text-2xl font-medium mb-4">Requests</h3>

      <Row>
        {pendingRequests.length > 0 ? (
          pendingRequests.map((request) => {
            const employeeId = request.taskDetails.AssignedToEmployeeId
            const employee = employees[employeeId]

            return (
              <Col sm="6" lg="6" key={request.id} className="mb-3">
                <Alert color="secondary" className="border-0 mb-0">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <p>{request.taskDetails.Title}</p>
                      <p className="font-semibold">
                        Assigned to: {employee ? employee.name : `Employee ${employeeId}`}
                      </p>
                      <p className="text-muted">
                        Start: {new Date(request.taskDetails.StartTime).toLocaleString()}
                      </p>
                    </div>
                    <div className="d-flex gap-2">
                      <Check
                        size={20}
                        className="pointer"
                        color="green"
                        onClick={() => handleApproveTask(request.id, request.taskDetails.Title)}
                      />
                      <X
                        size={20}
                        className="pointer"
                        color="red"
                        onClick={() => handleDeclineTask(request.id, request.taskDetails.Title)}
                      />
                    </div>
                  </div>
                </Alert>
              </Col>
            )
          })
        ) : (
          <p className="text-center">No pending requests.</p>
        )}
      </Row>
    </div>
  )
}

export default Requests
