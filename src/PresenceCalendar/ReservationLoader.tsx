import { faExclamationCircle, faUserEdit } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { Button, Space, Spin } from "antd"
import myfirebase from "src/core/myfirebase"
import { DateTime } from "luxon"
import React, { useContext, useState } from "react"
import { useDocumentDataOnce, useDocumentOnce } from "react-firebase-hooks/firestore"
import PaxContext from "src/core/paxContext"
import { TPax } from "src/models/Pax"
import CancelationForm from "./CancelationForm"
import ConfirmationForm from "./ConfirmationForm"

type DocumentData = myfirebase.firestore.DocumentData

 export default function ReservationLoader({ calendarPax, calValue, onSubmit }: { calendarPax: TPax; calValue: Date; onSubmit: () => void} ) {
    const docDayRef = myfirebase.firestore().doc(`pax/${calendarPax.sub}/days/${DateTime.fromJSDate(calValue).toISODate()}`)
    const [dayDoc, dayDocLoading, dayDocError] = useDocumentDataOnce<DocumentData>(docDayRef)
    const [requestSnap, requestSnapLoading, requestSnapError] = useDocumentOnce(dayDoc?.request)
    const [compState, setCompState] = useState<"IDLE" | "CANCEL" | "CONFIRM">("IDLE")
    const pc = useContext(PaxContext)
    if (!requestSnap) {
      return <Spin />
    }
    const onCancel = () => setCompState("IDLE")
    return (
      <>
        {compState === "IDLE" && (
          <>
            <p>Que veux-tu faire avec la réservation {requestSnap.id} ?</p>
            <Space direction="vertical">
              <Button
                danger
                onClick={() => setCompState("CANCEL")}
                icon={<FontAwesomeIcon icon={faExclamationCircle} />}
              >
                Annuler ma réservation
              </Button>
              {pc.doc!.isSupervisor && (
                <Button
                  type="primary"
                  disabled={requestSnap.data()?.status === "CONFIRMED"}
                  onClick={() => setCompState("CONFIRM")}
                  icon={<FontAwesomeIcon icon={faUserEdit} />}
                >
                  Confirmer la réservation
                </Button>
              )}
            </Space>
          </>
        )}
        {compState === "CONFIRM" && (
          <ConfirmationForm pax={calendarPax} requestSnap={requestSnap} onSubmit={onSubmit} onCancel={onCancel} />
        )}
        {compState === "CANCEL" && (
          <CancelationForm pax={calendarPax} requestSnap={requestSnap} onSubmit={onSubmit} onCancel={onCancel} />
        )}
      </>
    )
  }
