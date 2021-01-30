import { faCheckCircle } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { Drawer, Space, Spin } from "antd"
import { useState } from "react"
import db from "src/core/db"
import firebase from "src/core/myfirebase"
import Button from "src/core/LoadingButton"
import { TPax } from "src/models/Pax"

type DocumentData = firebase.firestore.DocumentData
type DocumentSnapshot = firebase.firestore.DocumentSnapshot

const CancelationForm = ({
  pax,
  requestSnap,
  onSubmit,
  onCancel,
}: {
  pax: TPax
  requestSnap: DocumentSnapshot
  onSubmit: () => void
  onCancel: () => void
}) => {
  const [isFormSubmitting, setIsFormSubmitting] = useState(false)

  const submitForm = async () => {
    setIsFormSubmitting(true)

    var batch = db.batch()
    const request_ref = db.doc(`pax/${pax.sub}/requests/${requestSnap.id}`)
    batch.delete(request_ref)

    const daysQuerySnap = await db.collection(`pax/${pax.sub}/days`).where("request", "==", requestSnap.ref).get()

    daysQuerySnap.forEach((docSnap) => {
      batch.delete(docSnap.ref)
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
          <p>Veux-tu annuler la réservation {!requestSnap ? <Spin /> : <strong>{requestSnap?.id}</strong>}?</p>
          <Space direction="vertical">
            <Button type="primary" onClick={submitForm} isLoading={isFormSubmitting}>
              <FontAwesomeIcon icon={faCheckCircle} />
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

export default CancelationForm
