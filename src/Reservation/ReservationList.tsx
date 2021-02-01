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
import { Button, List, Tag } from "antd"
import { useContext } from "react"
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

const log = myloglevel.getLogger("ReservationList")


export default function ReservationList({isSupervisorMode = false}:{isSupervisorMode?: boolean}) {
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

  const actions = (item: TReservationRequest) => {
    const actions = [
      <Button size="small"
              icon={<FontAwesomeIcon icon={faEdit} />}
              onClick={() => history.push(`/reservation/${item.id}`)}>Modifier</Button>,
      <Button danger size="small" icon={<FontAwesomeIcon
        icon={faExclamationCircle} />}>Annuler</Button>,
    ]
    if (isSupervisorMode) {
      actions.push(<Button size="small"
                           icon={<FontAwesomeIcon icon={faCheckDouble} />}>Confirmer</Button>)
    }
    return actions
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
          return <List.Item actions={actions(item)} extra={[]}>
            <Tag color={kindFields[1]}><FontAwesomeIcon icon={kindFields[2]} /> {kindFields[0]}
            </Tag> {item.arrivalDate.toLocaleString()}{item.departureDate && <> au {item.departureDate.toLocaleString()} ({item.numberOfNights} nuits)</>}
            <Tag color={stateFields[1]}><FontAwesomeIcon icon={stateFields[2]} /> {stateFields[0]}</Tag>
          </List.Item>
        }}
      />
    </>
  )
}
