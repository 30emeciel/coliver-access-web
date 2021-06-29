import { Avatar, Button, Popconfirm, Space, Spin, Table, Tag } from "antd"
import {
  ActionButtons,
  cancelReservation,
  confirmReservation,
  TReservation,
  TReservationKind,
  TReservationRequestConverter,
  TReservationState,
} from "../models/Reservation"
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
import myloglevel from "../core/myloglevel"
import firebase from "firebase"
import WorkInProgress from "../core/WorkInProgress"
import { useTypedCollectionData } from "../core/UseTypedCollectionData"

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
  let q:CollectionReference|Query = db.collection(`pax/${pax.id}/requests`)

  const today = DateTime.utc().set({hour: 0, minute: 0, second: 0, millisecond: 0}).minus({days: 1}).toJSDate()

  if (mode == ReservationListMode.Current) {
    q = q.where("arrival_date", ">=", today)
  }
  else if (mode == ReservationListMode.Past) {
    q = q.where("arrival_date", "<", today)
  }
  q = q.orderBy("arrival_date", "asc")
  return q
}

export default function ReservationList({ pax: initialPax, mode = ReservationListMode.Current }: { pax?: TPax, mode?: ReservationListMode }) {
  const pc = useContext(PaxContext)
  const pax = initialPax ? initialPax : pc.doc!

  const [listRequests, listRequestsLoading, ] = useTypedCollectionData<TReservation>(
    getCollectionFromMode(mode, pax),
    TReservationRequestConverter
  )

  const state2fields: Record<TReservationState, [string, string, IconDefinition]> = {
    CONFIRMED: ["Confirmée", "green", faCheckCircle],
    PENDING_REVIEW: ["En attente", "orange", faClock],
    CANCELED: ["Annulée", "red", faExclamationCircle],
  }

  const kind2fields: Record<TReservationKind, [string, string, IconDefinition]> = {
    COLIVING: ["Coliving", "#606dbc", faBed],
    COWORKING: ["Coworking", "#6dbc6d", faBriefcase],
  }


  const [paxList] = useCollectionData<TPax>(mode == ReservationListMode.Supervisor ? db.collection("/pax").withConverter(TPaxConverter) : null)

  const [paxMap, setPaxMap] = useState(new Map<string, TPax>())
  useEffect(() => {
    if (!paxList)
      return
    const m = paxList.reduce((previousValue, currentValue) => {
      previousValue.set(currentValue.id, currentValue)
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
                  {record.toDescription()}
                </>
              }} />
      <Column title="Status" key="state" dataIndex="state" render={(state: TReservationState) => {
        const stateFields = state2fields[state] || ["?", "pink", faQuestionCircle]
        return <Tag color={stateFields[1]}><FontAwesomeIcon icon={stateFields[2]} /> {stateFields[0]}</Tag>
      }} />
      <Column key="actions" title="Actions" render={(text, record:TReservation) => <ActionButtons isSupervisor={mode == ReservationListMode.Supervisor} reservation={record} />} />
    </Table>
  </>
}
