import { Button, Row } from "antd"
import admin from "firebase"
import { DateTime, Duration, Interval } from "luxon"
import React, { useEffect, useState } from "react"
import db from "src/core/db"
import firebase from "src/core/firebase_config"
import "src/core/Switch.css"
import { TCalendarContext } from "./MyPresenceCalendarTypes"
import TheCalendar from "./TheCalendar"

enum EditActions {
  Add,
  Remove,
}

const EditForm = ({ calendarContext }: { calendarContext: TCalendarContext }) => {
  const [isFormSubmitting, setIsFormSubmitting] = useState(false)

  const [listEditDays, setListEditDays] = useState(new Map<number, EditActions>())

  const onClickDay = (d: Date) => {
    let dt = DateTime.fromJSDate(d)
    let action = listEditDays.get(dt.toMillis())
    if (action) {
      listEditDays.delete(dt.toMillis())
    } else {
      listEditDays.set(
        dt.toMillis(),
        calendarContext.userDays.has(dt.toMillis()) ? EditActions.Remove : EditActions.Add
      )
    }
  }

  const submitColivingRequest = async () => {}

  return (
    <>
      <Row>
        <TheCalendar calendarContext={calendarContext} isRangeMode={false} onClickDay={onClickDay} />
      </Row>
      <Row>
        <span>Click on the dates you want to add or remove</span>{" "}
        <Button loading={isFormSubmitting} type="primary" onClick={submitColivingRequest}>
          Submit
        </Button>
      </Row>
    </>
  )
}

export default EditForm
