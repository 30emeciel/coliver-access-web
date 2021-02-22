import { Avatar, Button, Popconfirm, Space, Spin, Table, Tag } from "antd"
import {
  cancelReservation,
  confirmReservation,
  TColivingReservation,
  TCoworkingReservation,
  TReservation, TReservationRequestConverter,
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
import { useCollection, useCollectionData } from "react-firebase-hooks/firestore"
import db from "../core/db"
import { TPax, TPaxConverter } from "../models/Pax"
import { DateTime } from "luxon"
import PaxContext from "../core/paxContext"
import myloglevel from "../core/myloglevel"
import firebase from "firebase"
import WorkInProgress from "../core/WorkInProgress"
import { dtFromFirestore } from "../models/utils"
import admin from "firebase"

const { Column } = Table
type CollectionReference = firebase.firestore.CollectionReference
type Query = firebase.firestore.Query

const log = myloglevel.getLogger("ReservationList")

export enum ReservationListMode {
  Supervisor,
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

function useTypedCollectionData<C, T=firebase.firestore.DocumentData>(query: firebase.firestore.Query<T>, tx: admin.firestore.FirestoreDataConverter<C>):[C[] | undefined, boolean, Error | undefined] {
  const [snapshot, loading, error]:[firebase.firestore.QuerySnapshot<T> | undefined, boolean, Error | undefined] = useCollection(
    query
  )
  const [typedList, setTypedList] = useState<C[] | undefined>()
  useEffect(() => {
    if (!snapshot)
      return
    setTypedList(snapshot.docs.map((i) => tx.fromFirestore(i, {})))
  }, [snapshot])
  return [typedList, loading, error]
}

export default function ReservationList({ mode = ReservationListMode.Current }: { mode?: ReservationListMode }) {
  const pc = useContext(PaxContext)
  const pax = pc.doc!

  const [listRequests, listRequestsLoading, ] = useTypedCollectionData<TReservation>(
    getCollectionFromMode(mode, pax),
    TReservationRequestConverter
  )

  const state2fields: Record<TReservationRequestState, [string, string, IconDefinition]> = {
    CONFIRMED: ["Confirmée", "green", faCheckCircle],
    PENDING_REVIEW: ["En attente", "orange", faClock],
    CANCELED: ["Annulée", "red", faExclamationCircle],
  }

  const kind2fields: Record<TReservationRequestKind, [string, string, IconDefinition]> = {
    COLIVING: ["Coliving", "#606dbc", faBed],
    COWORKING: ["Coworking", "#6dbc6d", faBriefcase],
  }


  const ActionButtons = ({ item }: { item: TReservation }) => {
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
      <WorkInProgress><Button
        key="edit"
        size="small"
        icon={<FontAwesomeIcon icon={faEdit} />}>Modifier</Button></WorkInProgress>,
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

  const reservationText = (item: TReservation) => {
    return item.toDescription()
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
      {mode == ReservationListMode.Supervisor &&
      <Column title="Pax" key="paxId" dataIndex="paxId" render={paxId => <PaxField pax={paxMap?.get(paxId)} />} />}
      <Column key="text"
              title="Description"
              render={(text, record:TReservation) => {
                const kind = record.kind
                const kindFields = kind2fields[kind] || ["?", "pink", faQuestionCircle]
                return <>
                  <Tag color={kindFields[1]}><FontAwesomeIcon icon={kindFields[2]} /> {kindFields[0]}</Tag>
                  {reservationText(record)}
                </>
              }} />
      <Column title="Status" key="state" dataIndex="state" render={(state: TReservationRequestState) => {
        const stateFields = state2fields[state] || ["?", "pink", faQuestionCircle]
        return <Tag color={stateFields[1]}><FontAwesomeIcon icon={stateFields[2]} /> {stateFields[0]}</Tag>
      }} />
      <Column key="actions" title="Actions" render={(text, record:TReservation) => <ActionButtons item={record} />} />
    </Table>
  </>
}
