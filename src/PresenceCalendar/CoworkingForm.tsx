import { faCheckCircle } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { Drawer } from "antd"
import { DateTime } from "luxon"
import React, { useState } from "react"
import db from "src/core/db"
import LoadingButton from "src/core/LoadingButton"
import { TReservationRequest, TReservationRequestConverter } from "src/models/ReservationRequest"
import { TCalendarContext } from "./MyPresenceCalendarTypes"
import TheCalendar from "./TheCalendar"

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
      arrivalDate: start,
      kind: "COWORKING",
      state: "PENDING_REVIEW",
    }
    const request_doc = await db
      .collection(`pax/${currentUser.sub}/requests`)
      .withConverter(TReservationRequestConverter)
      .add(request_data)
    await db.collection(`pax/${currentUser.sub}/days`).doc(start.toISODate()).set({
      on: start.toJSDate(),
      request: request_doc,
      status: "PENDING_REVIEW",
      kind: "COWORKING",
    })

    onSubmit()
  }

  return (
    <>
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
      <Drawer visible={true} onClose={onCancel}>
        <p>Tu veux coworker avec nous le {DateTime.fromJSDate(calValue).toLocaleString(DateTime.DATE_FULL)}</p>
        <p className="mb-0">
          <LoadingButton disabled={!calValue} type="primary" onClick={submitForm} isLoading={isFormSubmitting}>
            <FontAwesomeIcon icon={faCheckCircle} /> Okay
          </LoadingButton>
        </p>
      </Drawer>
    </>
  )
}

export default CoworkingForm
