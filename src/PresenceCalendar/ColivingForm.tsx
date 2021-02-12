import { faCheckCircle, faExclamationCircle } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { Alert, Button, Col, Drawer, message, Modal, Row, Space } from "antd"
import { DateTime, Duration, Interval } from "luxon"
import React, { useEffect, useState } from "react"
import db from "src/core/db"
import {
  TReservationRequest,
  TReservationRequestConverter,
  TReservationRequestKind,
  TReservationRequestState,
} from "src/models/ReservationRequest"
import { TCalendarContext } from "./MyPresenceCalendarTypes"
import TheCalendar from "./TheCalendar"
import { TDayConverter, TDayKind, TDayState } from "../models/Day"
import {Collapse} from 'react-collapse';
import { BackButton } from "../Buttons/BackButton"

const getIntervalFromDateArr = (dateArr:Date[] | null) => {
  if (!dateArr || dateArr.length < 2) {
    return null
  }
  const [arrivalDate, departureDate] = dateArr
  if (departureDate == arrivalDate) {
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
    const arrivalDate = interval.start
    const departureDate = interval.end

    setIsFormSubmitting(true)
    const oneDay = Duration.fromObject({ days: 1 })

    // Get all the days that contains the selected range
    const res: DateTime[] = []
    let i = arrivalDate.plus({}) // clone
    while (i <= departureDate) {
      if (calendarContext.isDisabledDay(i)) {
        continue
      }
      res.push(i)
      i = i.plus(oneDay)
    }

    const request_data: TReservationRequest = {
      paxId: currentUser.sub,
      state: TReservationRequestState.PENDING_REVIEW,
      arrivalDate: arrivalDate,
      departureDate: departureDate,
      kind: TReservationRequestKind.COLIVING,
      numberOfNights: numberOfNights,
    }
    const request_doc = await db
      .collection(`pax/${currentUser.sub}/requests`)
      .withConverter(TReservationRequestConverter)
      .add(request_data)

    const batch = db.batch()

    res.forEach((r) => {
      batch.set(db.collection(`pax/${currentUser.sub}/days`).doc(r.toISODate()).withConverter(TDayConverter), {
        on: r,
        request: request_doc,
        state: TDayState.PENDING_REVIEW,
        kind: TDayKind.COLIVING,
      })
    })

    await batch.commit()

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

  return (
    <>
      <Row gutter={[8, 8]}>
        <Col>
          <Collapse isOpened={true} initialStyle={{height: 0, overflow: 'hidden'}}>
            <Alert message={<Form/>}/>
          </Collapse>
        </Col>
      </Row>
      <Row>
        <Col>
          <TheCalendar calendarContext={calendarContext} isRangeMode={true} calValue={calValue} onClickDay={onChangeFct} />
        </Col>
      </Row>
    </>
  )
}

export default ColivingForm
