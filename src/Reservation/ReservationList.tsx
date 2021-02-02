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
import { Avatar, Button, Popconfirm, Space, Spin, Table, Tag } from "antd"
import { useContext, useEffect, useState } from "react"
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
import { DateTime } from "luxon"
import { TPax, TPaxConverter } from "../models/Pax"

const log = myloglevel.getLogger("ReservationList")
const { Column, ColumnGroup } = Table

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


  const ActionButtons = ({ item }: { item: TReservationRequest }) => {
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

      await batch.commit()

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

      await batch.commit()

      // When all done, reset the UI
      setIsCancelingSubmitting(false)
    }


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
    return <Space>{actions}</Space>

  }

  const [paxList] = useCollectionData<TPax>(isSupervisorMode ? db.collection("/pax").withConverter(TPaxConverter) : null)

  const [paxMap, setPaxMap] = useState(new Map<string, TPax>())
  useEffect(() => {
    if (!paxList)
      return
    const m = paxList.reduce((previousValue, currentValue, index, arr) => {
      previousValue.set(currentValue.sub, currentValue)
      return previousValue
    }, new Map<string, TPax>())
    setPaxMap(m)
  }, [paxList, setPaxMap])

  const PaxField = ({ pax }: { pax: TPax | undefined }) => {

    if (!pax)
      return <Spin />

    return <Space direction="horizontal">
      <Avatar src={pax.picture} />
      <span><strong>{pax.name}</strong></span>
    </Space>
  }

  const reservationText = (item: TReservationRequest) => {
    if (item.kind == TReservationRequestKind.COWORKING) {
      return `le ${item.arrivalDate.setLocale("fr-fr").toLocaleString(DateTime.DATE_MED)}`
    }
    else {
      return `du ${item.arrivalDate.setLocale("fr-fr").toLocaleString(DateTime.DATE_MED)} au ${item.departureDate!.setLocale("fr-fr").toLocaleString(DateTime.DATE_MED)} (${item.numberOfNights!} nuits)`
    }
  }

  return (
    <>
      <h2>
        {isSupervisorMode ?
          <><FontAwesomeIcon icon={faCheckDouble} /> Réservations en attente de confirmation</>
          :
          <><FontAwesomeIcon icon={faBookReader} /> Mes réservations</>
        }
      </h2>
      <Table bordered={true} dataSource={listRequests} loading={listRequestsLoading} pagination={false}>
        <Column title="Type" key="kind" dataIndex="kind" render={(kind: TReservationRequestKind) => {
          const kindFields = kind2fields[kind] || ["?", "pink", faQuestionCircle]
          return <Tag color={kindFields[1]}><FontAwesomeIcon icon={kindFields[2]} /> {kindFields[0]}</Tag>
        }} />
        {isSupervisorMode &&
        <Column title="Pax" key="paxId" dataIndex="paxId" render={paxId => <PaxField pax={paxMap?.get(paxId)} />} />}
        <Column key="text"
                title="Description"
                render={(text, record:TReservationRequest) => reservationText(record)} />
        <Column title="Status" key="state" dataIndex="state" render={(state: TReservationRequestState) => {
          const stateFields = state2fields[state] || ["?", "pink", faQuestionCircle]
          return <Tag color={stateFields[1]}><FontAwesomeIcon icon={stateFields[2]} /> {stateFields[0]}</Tag>
        }} />



        <Column key="actions" title="Actions" render={(text, record:TReservationRequest) => <ActionButtons item={record} />} />
      </Table>
    </>
  )
}
