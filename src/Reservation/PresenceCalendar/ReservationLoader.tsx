import { faEdit, faExclamationCircle, faUserEdit } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { Button, Space, Spin } from "antd"
import myfirebase from "src/core/myfirebase"
import { DateTime } from "luxon"
import React, { useContext, useEffect, useState } from "react"
import { useDocument, useDocumentData } from "react-firebase-hooks/firestore"
import PaxContext from "src/core/paxContext"
import { TPax } from "src/models/Pax"
import {
  cancelReservation,
  confirmReservation,
  TReservation,
  TReservationRequestConverter,
  TReservationState,
} from "../../models/ReservationRequest"
import { TDay, TDayConverter } from "src/models/Day"
import WorkInProgress from "src/core/WorkInProgress"
import firebase from "firebase"
import admin from "firebase"

type QueryDocumentSnapshot<T> = firebase.firestore.QueryDocumentSnapshot<T>

export function useTypedDocumentData<C, T = firebase.firestore.DocumentData>(tx: admin.firestore.FirestoreDataConverter<C>, docRef?: firebase.firestore.DocumentReference<T>): [C | undefined, boolean, Error | undefined] {
  const [docSnap, loading, error] = useDocument(
    docRef,
  )
  const [typedDoc, setTypedList] = useState<C | undefined>()
  useEffect(() => {
    if (!docSnap || !docSnap.data())
      return
    const t = docSnap as QueryDocumentSnapshot<T>
    setTypedList(tx.fromFirestore(t, {}))
  }, [docSnap])
  return [typedDoc, loading, error]
}

export default function ReservationLoader({
                                            calendarPax,
                                            calValue,
                                            onSubmit,
                                          }: { calendarPax: TPax; calValue: Date; onSubmit: () => void }) {
  const docDayRef = myfirebase.firestore()
    .doc(`pax/${calendarPax.sub}/days/${DateTime.fromJSDate(calValue).toISODate()}`)
    .withConverter(TDayConverter)
  const [dayDoc, ] = useDocumentData<TDay>(docDayRef)
  const [reservation, ] = useTypedDocumentData<TReservation>(TReservationRequestConverter, dayDoc?.request)
  const pc = useContext(PaxContext)
  const [isCancellationSubmitting, setIsCancellationSubmitting] = useState(false)
  const [isConfirmationSubmitting, setIsConfirmationSubmitting] = useState(false)

  if (!reservation) {
    return <Spin />
  }
  return <>
    <p>Que veux-tu faire ?</p>
    <Space direction="vertical">
      <WorkInProgress>
      <Button block icon={<FontAwesomeIcon icon={faEdit} />}>
        Modifier ma réservation
      </Button></WorkInProgress>
      <Button
        danger
        block
        loading={isCancellationSubmitting}
        onClick={async () => {
          setIsCancellationSubmitting(true)
          await cancelReservation(reservation)
          onSubmit()
        }}
        icon={<FontAwesomeIcon icon={faExclamationCircle} />}
      >
        Annuler ma réservation
      </Button>
      {pc.doc!.isSupervisor && (
        <Button block
                type="primary"
          disabled={reservation.state === TReservationState.CONFIRMED}
          loading={isConfirmationSubmitting}
          onClick={async () => {
            setIsConfirmationSubmitting(true)
            await confirmReservation(reservation)
            onSubmit()
          }}
          icon={<FontAwesomeIcon icon={faUserEdit} />}
        >
          Confirmer la réservation
        </Button>
      )}
    </Space>
  </>
}
