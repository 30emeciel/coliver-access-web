import { faCheckCircle } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { Button, Drawer, Space } from "antd"
import { useState } from "react"
import db from "src/core/db"
import firebase from "src/core/firebase_config"
import { Pax } from "src/core/usePax"

type DocumentSnapshot = firebase.firestore.DocumentSnapshot

export default function ConfirmationForm({
  pax,
  requestSnap,
  onSubmit,
  onCancel,
}: {
  pax: Pax
  requestSnap: DocumentSnapshot
  onSubmit: () => void
  onCancel: () => void
}) {

  const [isFormSubmitting, setIsFormSubmitting] = useState(false)

  const submitForm = async () => {
    setIsFormSubmitting(true)

    var batch = db.batch()
    const request_ref = db.doc(`pax/${pax.sub}/requests/${requestSnap.id}`)
    batch.update(request_ref, { status: "CONFIRMED" })

    const daysQuerySnap = await db
      .collection(`pax/${pax.sub}/days`)
      .where("request", "==", requestSnap.ref)
      .get()

    daysQuerySnap.forEach((docSnap) => {
      batch.update(docSnap.ref, { status: "CONFIRMED" })
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
