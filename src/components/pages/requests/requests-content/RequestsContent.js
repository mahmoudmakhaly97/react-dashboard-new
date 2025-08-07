import { Alert, Button, Card, CardText, CardTitle, Col, Row } from 'reactstrap'
import './requests.scss'
import { Check, EyeClosedIcon, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { BASE_URL } from '../../../../api/base'
import { Axios } from 'axios'
import { Loader } from '../../../ui'
import { EyeClosed } from 'lucide'
const RequestsContent = () => {
  const [requests, setRequests] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  useEffect(() => {
    const getAllRequests = async () => {
      try {
        setIsLoading(true)
        const res = await Axios.get(`${BASE_URL}/Request/GetAllRequests`)
        setRequests(res.data)
      } catch (error) {
        console.log(error)
      } finally {
        setIsLoading(false)
      }
    }
    getAllRequests()
  }, [])
  if (isLoading) return <Loader />
  return (
    <div className="requests">
      <h3 className="text-2xl font-medium mb-4">Requests</h3>

      <Row>
        <Col sm="6" lg="6">
          <Alert color="secondary" className="border-0 mb-0">
            <div className="d-flex justify-content-between align-items-center">
              <div>scsc</div>
              <div className="d-flex gap-2">
                <Check size={20} className="pointer" color="green" />
                <X size={20} className="pointer" color="red" />
              </div>
            </div>
          </Alert>
        </Col>
      </Row>
    </div>
  )
}
export default RequestsContent
