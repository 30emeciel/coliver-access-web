import { faArrowCircleLeft, faCheckCircle, faExclamationCircle } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { Alert, Button, Col, Drawer, Row, Space } from "antd"
import { DateTime } from "luxon"
import React, { useState } from "react"
import db from "src/core/db"
import LoadingButton from "src/core/LoadingButton"
import {
  TReservationRequest,
  TReservationRequestConverter,
  TReservationRequestKind,
  TReservationRequestState,
} from "src/models/ReservationRequest"
import { TCalendarContext } from "./MyPresenceCalendarTypes"
import TheCalendar from "./TheCalendar"
import { TDayConverter, TDayKind, TDayState } from "../../models/Day"
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

    const request_data: TReservationRequest = {
      paxId: currentUser.sub,
      arrivalDate: start,
      kind: TReservationRequestKind.COWORKING,
      state: TReservationRequestState.PENDING_REVIEW,
    }
    const request_doc = await db
      .collection(`pax/${currentUser.sub}/requests`)
      .withConverter(TReservationRequestConverter)
      .add(request_data)
    await db.collection(`pax/${currentUser.sub}/days`).doc(start.toISODate()).withConverter(TDayConverter).set({
      on: start,
      request: request_doc,
      state: TDayState.PENDING_REVIEW,
      kind: TDayKind.COWORKING,
    })

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
