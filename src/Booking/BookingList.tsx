import { faBed, faBookReader, faBriefcase, faCheckCircle, faClock, faEdit, faExclamationCircle, faQuestionCircle, IconDefinition } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { Button, List, Tag } from "antd"
import { DateTime } from "luxon"
import { useContext } from "react"
import { useCollectionData } from "react-firebase-hooks/firestore"
import db from "src/core/db"
import PaxContext from "src/core/paxContext"
import { TRequestConverter, TRequest, TRequestKind, TRequestStatus } from "src/models/Request"
import myloglevel from "src/core/myloglevel"
import WorkInProgress from "src/core/WorkInProgress"

const log = myloglevel.getLogger("BookingList")

export default function BookingList() {
  const pc = useContext(PaxContext)
  const pax = pc.doc!

  const [listRequests, listRequestsLoading, listRequestsError] = useCollectionData<TRequest>(
    db.collection(`pax/${pax.sub}/requests`).orderBy("arrivalDate", "asc").withConverter(TRequestConverter) ,
    { idField: "id" }
  )

  const status2fields:Record<TRequestStatus, [string, string, IconDefinition]> = {
    "CONFIRMED": ["Confirmée", "green", faCheckCircle],
    "PENDING_REVIEW": ["En attente", "orange", faClock]
  }

  const kind2fields:Record<TRequestKind, [string, string, IconDefinition]> = {
    "COLIVING": ["Coliving", "#606dbc", faBed],
    "COWORKING": ["Coworking", "#6dbc6d", faBriefcase]
  }

  return (
    <>
      <h2>
        <FontAwesomeIcon icon={faBookReader} /> Mes réservations
      </h2>
      <List
        itemLayout="horizontal"
        bordered={true}
        dataSource={listRequests}
        loading={listRequestsLoading}
        renderItem={(item) => {
          const statusFields = status2fields[item.status] || ["?", "pink", faQuestionCircle]
          const kindFields = kind2fields[item.kind] || ["?", "pink", faQuestionCircle]
          return <List.Item actions={[
            <WorkInProgress><Button size="small" icon={<FontAwesomeIcon icon={faEdit}/>}>Modifier</Button></WorkInProgress>,
            <WorkInProgress><Button danger size="small" icon={<FontAwesomeIcon icon={faExclamationCircle}/>}>Annuler</Button></WorkInProgress>
            ]} extra={[]}>
            <Tag color={kindFields[1]}><FontAwesomeIcon icon={kindFields[2]}/> {kindFields[0]}</Tag> {item.arrivalDate.toLocaleString()}{item.departureDate && <> au {item.departureDate.toLocaleString()} ({item.numberOfNights} nuits)</>} <Tag color={statusFields[1]}><FontAwesomeIcon icon={statusFields[2]}/> {statusFields[0]}</Tag>
          </List.Item>
        }}
      ></List>
    </>
  )
}
