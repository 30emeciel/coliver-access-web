import { faCheckCircle } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { Button, Drawer, Space } from "antd"
import { useState } from "react"
import db from "src/core/db"
import firebase from "src/core/myfirebase"
import { TPax } from "src/models/Pax"
import { TReservationRequest, TReservationRequestConverter, TReservationRequestState } from "../models/ReservationRequest"
import { TDay, TDayConverter, TDayState } from "../models/Day"

type DocumentSnapshot = firebase.firestore.DocumentSnapshot

export default function ConfirmationForm({
  pax,
  requestSnap,
  onSubmit,
  onCancel,
}: {
  pax: TPax
  requestSnap: DocumentSnapshot
  onSubmit: () => void
  onCancel: () => void
}) {

  const [isFormSubmitting, setIsFormSubmitting] = useState(false)

  const submitForm = async () => {
    setIsFormSubmitting(true)

    const batch = db.batch()
    const request_ref = db.doc(`pax/${pax.sub}/requests/${requestSnap.id}`).withConverter(TReservationRequestConverter)
    const request_data:Partial<TReservationRequest> = {
     state: TReservationRequestState.CONFIRMED,
    }
    batch.set(request_ref, request_data, {merge: true})

    const daysQuerySnap = await db
      .collection(`pax/${pax.sub}/days`)
      .withConverter(TDayConverter)
      .where("request", "==", requestSnap.ref)
      .get()

    daysQuerySnap.forEach((docSnap) => {
      const data_update:Partial<TDay> = {
        state: TDayState.CONFIRMED
      }
      batch.set(docSnap.ref, data_update, {merge: true})
    })

    await batch.commit()

    // When all done, reset the UI
    setIsFormSubmitting(false)
    onSubmit()
  }

  const Form = () => {
    return (
      <>
        <Drawer visible={true} onClose={onCancel}>
          <p>
            Veux-tu confirmer la réservation <strong>{requestSnap?.id}</strong>
          </p>
          <Space direction="vertical">
            <Button
              type="primary"
              onClick={submitForm}
              loading={isFormSubmitting}
              icon={<FontAwesomeIcon icon={faCheckCircle} />}
            >
              Okay
            </Button>
          </Space>
        </Drawer>
      </>
    )
  }

  return (
    <>
      <Form />
    </>
  )
}
