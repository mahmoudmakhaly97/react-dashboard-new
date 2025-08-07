import { Row } from 'reactstrap'
import RequestsContent from './requests-content/RequestsContent'
import { AppFooter, AppHeader, AppSidebar } from './sidebar'
import { useEffect, useState } from 'react'
import { BASE_URL } from '../../../api/base'
import axios from 'axios'
const Requests = () => {
  const [pendingRequests, setPendingRequests] = useState([])
  useEffect(() => {
    const fetchPendingRequests = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/Tasks/pending`)
        setPendingRequests(response.data)
        console.log('Pending Requests:', response.data)
      } catch (error) {
        console.error('Error fetching pending requests:', error)
      }
    }
    fetchPendingRequests()
  }, [])
  return (
    <div>
      <AppSidebar />
      <div className="wrapper d-flex flex-column min-vh-100">
        <AppHeader />
        <Row className="px-5">
          <div>
            <RequestsContent />
          </div>
        </Row>
        <AppFooter />
      </div>
    </div>
  )
}
export default Requests
