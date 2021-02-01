import { faEdit } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { Form, Row, Spin } from "antd"
import React, { useContext } from "react"
import { useDocumentData } from "react-firebase-hooks/firestore"
import db from "src/core/db"
import PaxContext from "src/core/paxContext"
import { TReservationRequest } from "src/models/ReservationRequest"


export default function EditReservation(requestId:string, impersonatedPaxId?: string) {

  const paxContext = useContext(PaxContext)
  const paxDocRef = impersonatedPaxId ? db.doc(`pax/${impersonatedPaxId}`) : paxContext.ref!
  const requestDocRef = db.doc(`pax/${paxDocRef.id}/requests/${requestId}`)
  const [requestDoc, requestDocIsLoading, requestDocError] = useDocumentData<TReservationRequest>(requestDocRef)

  if (!requestDoc) {
    return <Spin />
  }

  return <>
      <Row>
        <h2><FontAwesomeIcon icon={faEdit} /> Modifier la réservation <strong>{requestDoc.id}</strong></h2>
      </Row>
      <Form labelCol={{ span: 4 }} wrapperCol={{ span: 8 }}>
      </Form>
    </>
}
