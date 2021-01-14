import { faCheckCircle } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { Drawer, Space } from "antd"
import admin from "firebase"
import { DateTime, Duration, Interval } from "luxon"
import { useEffect, useState } from "react"
import db from "src/core/db"
import LoadingButton from "src/core/LoadingButton"
import { TCalendarContext } from "./MyPresenceCalendarTypes"
import TheCalendar from "./TheCalendar"

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
  const [calValue, setCalValue] = useState<Date | Date[] | null>(firstCalValue ? firstCalValue : null)

  useEffect(() => {
    const twoDays = calValue as Date[]

    const arrivalDate = twoDays ? twoDays[0] : null
    const departureDate = twoDays ? twoDays[1] : null
    setInterval(!arrivalDate || !departureDate ? null : Interval.fromDateTimes(arrivalDate, departureDate))
  }, [calValue])

  const submitColivingRequest = async () => {
    if (!interval) {
      return
    }
    const arrivalDate = interval.start
    const departureDate = interval.end

    setIsFormSubmitting(true)
    const oneDay = Duration.fromObject({ days: 1 })

    // Get all the days that contains the selected range
    var res: DateTime[] = []
    var i = arrivalDate.plus({}) // clone
    while (i <= departureDate) {
      if (calendarContext.isDisabledDay(i)) {
        continue
      }
      res.push(i)
      i = i.plus(oneDay)
    }

    // Submit the list of days to firestore
    const FieldValue = admin.firestore.FieldValue

    const request_data = {
      created: FieldValue.serverTimestamp(),
      status: "PENDING_REVIEW",
    }
    const request_doc = await db.collection(`pax/${currentUser.sub}/requests`).add(request_data)

    var batch = db.batch()

    res.forEach((r) => {
      batch.set(db.collection(`pax/${currentUser.sub}/days`).doc(r.toISODate()), {
        on: r.toJSDate(),
        request: request_doc,
        status: "PENDING_REVIEW",
        kind: "COLIVING",
      })
    })

    await batch.commit()

    onSubmit()
  }

  const onChangeFct = (d: Date | Date[]) => {
    setCalValue(d as Date[])
  }

  const numberOfNights = interval ? interval.count("days") - 1 : null
  return (
    <>
          <TheCalendar
            calendarContext={calendarContext}
            isRangeMode={true}
            calValue={calValue}
            onChange={onChangeFct}
          />
        <Drawer visible={true}
        mask={false}
          onClose={onCancel}>
            <p>
              {numberOfNights ? <>Tu vas rester {numberOfNights} nuits</> : <>Choisis ton jour de départ</>}
            </p>
            <Space>
              <LoadingButton
                disabled={!numberOfNights || numberOfNights <= 0}
                type="primary"
                onClick={submitColivingRequest}
                isLoading={isFormSubmitting}
              >
                <FontAwesomeIcon icon={faCheckCircle} /> Okay
              </LoadingButton>
            </Space>
          </Drawer>

    </>
  )
}

export default ColivingForm
