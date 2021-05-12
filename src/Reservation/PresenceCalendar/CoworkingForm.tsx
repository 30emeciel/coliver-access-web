import { faCheckCircle } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { Alert, Button, Col, Row, Space } from "antd"
import { DateTime } from "luxon"
import React, { useState } from "react"
import { createReservation, TCoworkingReservation } from "src/models/Reservation"
import { TCalendarContext } from "./MyPresenceCalendarTypes"
import TheCalendar from "./TheCalendar"
import { Collapse } from "react-collapse"
import BackButton from "../../Buttons/BackButton"

const CoworkingForm = ({
  calendarContext,
  firstCalValue,
  onSubmit,
  onCancel,
}: {
  calendarContext: TCalendarContext
  firstCalValue: Date
  onSubmit: () => void
  onCancel: () => void
}) => {
  const currentUser = calendarContext.pax

  const [isFormSubmitting, setIsFormSubmitting] = useState(false)
  const [calValue, setCalValue] = useState<Date>(firstCalValue)

  const submitForm = async () => {
    if (!calValue) {
      return
    }

    setIsFormSubmitting(true)

    const start = DateTime.fromJSDate(calValue)
    const request_data = new TCoworkingReservation(
        currentUser.sub,
        start
      )

    await createReservation(request_data)

    onSubmit()
  }

  const Form = () => {
    return <>
      <h3>Coworking</h3>
      <p>Tu veux coworker avec nous le {DateTime.fromJSDate(calValue).toLocaleString(DateTime.DATE_FULL)}</p>
      <Space>
        <Button disabled={!calValue} type="primary" onClick={submitForm} loading={isFormSubmitting}>
          <FontAwesomeIcon icon={faCheckCircle} /> Okay
        </Button>
        <BackButton onClick={onCancel}/>
      </Space>
    </>
  }

  return (
    <>
      <Row gutter={[8, 8]} justify="center">
        <Col flex="350px">
          <Collapse isOpened={true} initialStyle={{height: 0, overflow: 'hidden'}}>
            <Alert message={<Form/>}/>
          </Collapse>
        </Col>
      </Row>
      <TheCalendar
          calendarContext={calendarContext}
          isRangeMode={false}
          calValue={calValue}
          onChange={(d) => {
            if (d instanceof Date) {
              setCalValue(d)
            }
          }}
        />
    </>
  )
}

export default CoworkingForm
