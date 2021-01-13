import { faCheckCircle, faExclamationCircle } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { Button, Col, Drawer, Row } from "antd"
import admin from "firebase"
import { DateTime } from "luxon"
import React, { useState } from "react"
import db from "src/core/db"
import firebase from "src/core/firebase_config"
import LoadingButton from "src/core/LoadingButton"
import "src/core/Switch.css"
import { TCalendarContext } from "./MyPresenceCalendarTypes"
import TheCalendar from "./TheCalendar"

type DocumentData = firebase.firestore.DocumentData

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

    // Submit the list of days to firestore
    const FieldValue = admin.firestore.FieldValue

    const request_data = {
      created: FieldValue.serverTimestamp(),
      status: "PENDING_REVIEW",
    }
    const request_doc = await db.collection(`pax/${currentUser.sub}/requests`).add(request_data)
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
