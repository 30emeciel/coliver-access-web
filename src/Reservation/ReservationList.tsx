import { Avatar, Button, Popconfirm, Space, Spin, Table, Tag } from "antd"
import {
  cancelReservation,
  confirmReservation,
  TReservationRequest,
  TReservationRequestConverter,
  TReservationRequestKind,
  TReservationRequestState,
} from "../models/ReservationRequest"
import {
  faBed,
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
import React, { useContext, useEffect, useState } from "react"
import { useCollectionData } from "react-firebase-hooks/firestore"
import db from "../core/db"
import { TPax, TPaxConverter } from "../models/Pax"
import { DateTime } from "luxon"
import PaxContext from "../core/paxContext"
import { useHistory } from "react-router-dom"
import myloglevel from "../core/myloglevel"
import firebase from "firebase"

const { Column } = Table
type CollectionReference = firebase.firestore.CollectionReference
type DocumentData = firebase.firestore.DocumentData
type Query = firebase.firestore.Query

const log = myloglevel.getLogger("ReservationList")

export enum ReservationListMode {
  Supervisor,
  PendingReview,
  Current,
  Past
}

const getCollectionFromMode = (mode: ReservationListMode, pax: TPax) => {
  if (mode == ReservationListMode.Supervisor) {
    return db.collectionGroup("requests")
      .where("state", "==", "PENDING_REVIEW")
      .orderBy("created", "asc")
  }
  let q:CollectionReference|Query = db.collection(`pax/${pax.sub}/requests`)

  /*
  if (mode == ReservationListMode.PendingReviewMode) {
    q = q.where("state", "==", "PENDING_REVIEW")
  }
  else {
    // Current and Past modes
    q = q.where("state", "==", "CONFIRMED")
  }
  */
  const today = DateTime.utc().set({hour: 0, minute: 0, second: 0, millisecond: 0}).toJSDate()

  if (mode == ReservationListMode.Current) {
    q = q.where("arrival_date", ">=", today)
  }
  else if (mode == ReservationListMode.Past) {
    q = q.where("arrival_date", "<", today)
  }
  q = q.orderBy("arrival_date", "asc")
  return q
}

export default function ReservationList({ mode = ReservationListMode.Current }: { mode?: ReservationListMode }) {
  const pc = useContext(PaxContext)
  const pax = pc.doc!
  const history = useHistory()

  const [listRequests, listRequestsLoading, ] = useCollectionData<TReservationRequest>(
    getCollectionFromMode(mode, pax)
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

    const myConfirmReservation = async () => {
      setIsConfirmationSubmitting(true)
      await confirmReservation(item)
      // When all done, reset the UI
      setIsConfirmationSubmitting(false)
    }

    const [isCancelingSubmitting, setIsCancelingSubmitting] = useState(false)

    const myCancelReservation = async () => {
      setIsCancelingSubmitting(true)
      await cancelReservation(item)
      // When all done, reset the UI
      setIsCancelingSubmitting(false)
    }


    const actions = [
      <Button
        key="edit"
        size="small"
              icon={<FontAwesomeIcon icon={faEdit} />}
              onClick={() => history.push(`/reservation/${item.id}`)}>Modifier</Button>,
      <Popconfirm
        key="cancel"
        arrowPointAtCenter
        onConfirm={myCancelReservation}
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
    if (mode == ReservationListMode.Supervisor) {
      const confirm = <Popconfirm
        key="confirm"
        placement="topLeft"
        onConfirm={myConfirmReservation}
        title="Est-ce que tu veux confirmer cette réservation ?"
        okText="Oui"
        cancelText="Non"
      ><Button
        size="small"
        loading={isConfirmationSubmitting}
        type="primary"
        icon={<FontAwesomeIcon icon={faCheckDouble} />}>Confirmer</Button>
      </Popconfirm>
      actions.push(confirm)
    }
    return <Space>{actions}</Space>

  }

  const [paxList] = useCollectionData<TPax>(mode == ReservationListMode.Supervisor ? db.collection("/pax").withConverter(TPaxConverter) : null)

  const [paxMap, setPaxMap] = useState(new Map<string, TPax>())
  useEffect(() => {
    if (!paxList)
      return
    const m = paxList.reduce((previousValue, currentValue) => {
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

  return <>
    <h2>
      {mode == ReservationListMode.Supervisor &&
        <><FontAwesomeIcon icon={faCheckDouble} /> Réservations en attente de confirmation</>
      }
    </h2>

    <Table bordered={true} dataSource={listRequests} loading={listRequestsLoading} pagination={false}
           size="small"
           scroll={{ "x": 1000 }}
    >
      <Column title="Type" key="kind" dataIndex="kind" render={(kind: TReservationRequestKind) => {
        const kindFields = kind2fields[kind] || ["?", "pink", faQuestionCircle]
        return <Tag color={kindFields[1]}><FontAwesomeIcon icon={kindFields[2]} /> {kindFields[0]}</Tag>
      }} />
      {mode == ReservationListMode.Supervisor &&
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
}
