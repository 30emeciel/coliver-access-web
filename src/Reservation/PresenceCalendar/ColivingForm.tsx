import { faCheckCircle } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { Alert, Button, Col, Row, Space } from "antd"
import { Interval } from "luxon"
import React, { useEffect, useState } from "react"
import { createReservation, TColivingReservation } from "src/models/ReservationRequest"
import { TCalendarContext } from "./MyPresenceCalendarTypes"
import TheCalendar from "./TheCalendar"
import { Collapse } from "react-collapse"
import BackButton from "../../Buttons/BackButton"

const getIntervalFromDateArr = (dateArr:Date[] | null) => {
  if (!dateArr || dateArr.length < 2) {
    return null
  }
  const [arrivalDate, departureDate] = dateArr
  if (departureDate.getDate() === arrivalDate.getDate()) {
    return null
  }
  const interval = Interval.fromDateTimes(arrivalDate, departureDate)
  if (!interval.isValid) {
    throw Error("interval is not valid")
  }
  return interval
}
const ColivingForm = ({
  calendarContext,
  firstCalValue,
  onSubmit,
  onCancel,
}: {
  calendarContext: TCalendarContext
  firstCalValue: Date | null
  onSubmit: () => void
  onCancel: () => void
}) => {
  const currentUser = calendarContext.pax

  const [isFormSubmitting, setIsFormSubmitting] = useState(false)
  const [interval, setInterval] = useState<null | Interval>(null)
  const [calValue, setCalValue] = useState<Date[] | null>(firstCalValue ? [firstCalValue] : null)

  const numberOfNights = interval ? interval.count("days") - 1 : null

  useEffect(() => {
    setInterval(getIntervalFromDateArr(calValue))
  }, [calValue, setInterval])

  const submitColivingRequest = async () => {
    if (!interval || !numberOfNights) {
      return
    }

    setIsFormSubmitting(true)

    const arrivalDate = interval.start
    const departureDate = interval.end
    const request_data = new TColivingReservation(
      currentUser.sub,
      arrivalDate,
      departureDate,
    )
    await createReservation(request_data)
    onSubmit()
  }

  const onChangeFct = (d: Date) => {
    if (!calValue || calValue.length > 1) {
      setCalValue([d])
    }
    else {
      const t = [calValue[0], d].sort((a, b) => a.getTime() - b.getTime())
      setCalValue(t)
    }

  }

  const Form = () => {
    return <>
      <h3>Coliving</h3>
    <p>{interval ? <>Tu vas rester {numberOfNights} nuits</> : <>Choisis ton jour de départ</>}</p>
    <Space>
      <Button
        disabled={!interval}
        type="primary"
        onClick={submitColivingRequest}
        loading={isFormSubmitting}><FontAwesomeIcon icon={faCheckCircle} /> Okay</Button>
      <BackButton onClick={onCancel}/>
    </Space>
      </>
  }

  return <>
      <Row gutter={[8, 8]} justify="center">
        <Col flex="350px">
          <Collapse isOpened={true} initialStyle={{height: 0, overflow: 'hidden'}}>
            <Alert message={<Form/>}/>
          </Collapse>
        </Col>
      </Row>
      <TheCalendar calendarContext={calendarContext} isRangeMode={true} calValue={calValue} onClickDay={onChangeFct} />
    </>
}

export default ColivingForm
