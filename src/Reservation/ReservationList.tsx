import {
  faBed,
  faBookReader,
  faBriefcase,
  faCheckCircle,
  faCheckDouble,
  faClock,
  faEdit,
  faExclamationCircle,
  faQuestionCircle,
  IconDefinition,
} from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { Button, List, Popconfirm, Tag } from "antd"
import { useContext, useState } from "react"
import { useCollectionData } from "react-firebase-hooks/firestore"
import db from "src/core/db"
import myloglevel from "src/core/myloglevel"
import PaxContext from "src/core/paxContext"
import {
  TReservationRequest,
  TReservationRequestConverter,
  TReservationRequestKind,
  TReservationRequestState,
} from "src/models/ReservationRequest"
import { useHistory } from "react-router-dom"
import { TDay, TDayConverter, TDayState } from "../models/Day"

const log = myloglevel.getLogger("ReservationList")


export default function ReservationList({ isSupervisorMode = false }: { isSupervisorMode?: boolean }) {
  const pc = useContext(PaxContext)
  const pax = pc.doc!
  const history = useHistory()

  const [listRequests, listRequestsLoading, listRequestsError] = useCollectionData<TReservationRequest>(
    (isSupervisorMode ?
        db.collectionGroup("requests")
          .where("state", "==", "PENDING_REVIEW")
          .orderBy("created", "asc")
        :
        db.collection(`pax/${pax.sub}/requests`)
          .orderBy("arrival_date", "asc")
    )
      .withConverter(TReservationRequestConverter),
    { idField: "id" },
  )



  const state2fields: Record<TReservationRequestState, [string, string, IconDefinition]> = {
    "CONFIRMED": ["Confirmée", "green", faCheckCircle],
    "PENDING_REVIEW": ["En attente", "orange", faClock],
  }

  const kind2fields: Record<TReservationRequestKind, [string, string, IconDefinition]> = {
    "COLIVING": ["Coliving", "#606dbc", faBed],
    "COWORKING": ["Coworking", "#6dbc6d", faBriefcase],
  }


  const ListItem = ({item, children}: {item:TReservationRequest, children: any}) => {
    const [isConfirmationSubmitting, setIsConfirmationSubmitting] = useState(false)

    const confirmReservation = async () => {
      setIsConfirmationSubmitting(true)

      const batch = db.batch()
      const request_ref = db.doc(`pax/${item.paxId}/requests/${item.id!}`)
        .withConverter(TReservationRequestConverter)

      const request_data: Partial<TReservationRequest> = {
        state: TReservationRequestState.CONFIRMED,
      }
      batch.set(request_ref, request_data, { merge: true })

      const daysQuerySnap = await db
        .collection(`pax/${item.paxId}/days`)
        .withConverter(TDayConverter)
        .where("request", "==", request_ref)
        .get()

      daysQuerySnap.forEach((docSnap) => {
        const data_update: Partial<TDay> = {
          state: TDayState.CONFIRMED,
        }
        batch.set(docSnap.ref, data_update, { merge: true })
      })

      //await batch.commit()

      // When all done, reset the UI
      setIsConfirmationSubmitting(false)
    }

    const [isCancelingSubmitting, setIsCancelingSubmitting] = useState(false)

    const cancelConfirmation = async () => {
      setIsCancelingSubmitting(true)

      const batch = db.batch()
      const request_ref = db.doc(`pax/${item.paxId}/requests/${item.id}`)
      batch.delete(request_ref)

      const daysQuerySnap = await db.collection(`pax/${item.paxId}/days`)
        .where("request", "==", request_ref)
        .get()

      daysQuerySnap.forEach((docSnap) => {
        batch.delete(docSnap.ref)
      })

      //await batch.commit()

      // When all done, reset the UI
      setIsCancelingSubmitting(false)
    }


    const actions = (item: TReservationRequest) => {
      const actions = [
        <Button size="small"
                icon={<FontAwesomeIcon icon={faEdit} />}
                onClick={() => history.push(`/reservation/${item.id}`)}>Modifier</Button>,
        <Popconfirm
          arrowPointAtCenter
          onConfirm={cancelConfirmation}
          title="Est-ce que tu veux annuler cette réservation ?"
          okText="Oui"
          cancelText="Non">
          <Button
            danger
            size="small"
            loading={isCancelingSubmitting}
            icon={<FontAwesomeIcon icon={faExclamationCircle} />}>Annuler</Button>
        </Popconfirm>,
      ]
      if (isSupervisorMode) {
        const confirm = <Popconfirm
          placement="topLeft"
          onConfirm={confirmReservation}
          title="Est-ce que tu veux confirmer cette réservation ?"
          okText="Oui"
          cancelText="Non"
        ><Button size="small"
                 loading={isConfirmationSubmitting}
                 type="primary"
                 icon={<FontAwesomeIcon icon={faCheckDouble} />}>Confirmer</Button>
        </Popconfirm>
        actions.push(confirm)
      }
      return actions
    }

    return <List.Item actions={actions(item)} extra={[]}>{children}</List.Item>
  }

  return (
    <>
      <h2>
        {isSupervisorMode ?
          <><FontAwesomeIcon icon={faCheckDouble} /> Réservations en attente</>
          :
          <><FontAwesomeIcon icon={faBookReader} /> Mes réservations</>
        }
      </h2>
      <List
        itemLayout="horizontal"
        bordered={true}
        dataSource={listRequests}
        loading={listRequestsLoading}
        renderItem={(item) => {
          const stateFields = state2fields[item.state] || ["?", "pink", faQuestionCircle]
          const kindFields = kind2fields[item.kind] || ["?", "pink", faQuestionCircle]
          return <ListItem item={item}>
            <Tag color={kindFields[1]}><FontAwesomeIcon icon={kindFields[2]} /> {kindFields[0]}
            </Tag> {item.arrivalDate.toLocaleString()}{item.departureDate && <> au {item.departureDate.toLocaleString()} ({item.numberOfNights} nuits)</>}
            <Tag color={stateFields[1]}><FontAwesomeIcon icon={stateFields[2]} /> {stateFields[0]}</Tag>
          </ListItem>
        }}
      />
    </>
  )
}
