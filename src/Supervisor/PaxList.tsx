import { faExclamationTriangle, faUser, faUserClock, faUsers } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { Badge, Button, Collapse, List, Spin, Table } from "antd"
import Avatar from "antd/lib/avatar/avatar"
import { useCollectionData } from "react-firebase-hooks/firestore"
import { useHistory } from "react-router-dom"
import db from "src/core/db"
import { TPax } from "src/models/Pax"
import React from "react"
import firebase from "firebase"

type DocumentData = firebase.firestore.DocumentData


const { Panel } = Collapse

const WithContent = ({ paxDocs }: { paxDocs: TPax[] }) => {
  const history = useHistory()

  const buttons = ({ paxDoc }: { paxDoc: TPax }) => [
    <Button type="primary" onClick={() => history.push(`/supervisor/pax/${paxDoc.sub}/account`)}>
      <FontAwesomeIcon icon={faUser} /> Compte
    </Button>,
    <Button onClick={() => history.push(`/supervisor/pax/${paxDoc.sub}/presence`)} className="ml-2">
      <FontAwesomeIcon icon={faUserClock} /> Présence
    </Button>,
  ]

  return (
    <List
      dataSource={paxDocs}
      renderItem={(paxDoc) => (
        <List.Item actions={buttons({ paxDoc: paxDoc })}>
            <List.Item.Meta avatar={<Avatar src={paxDoc.picture} />} title={paxDoc.name} />
        </List.Item>

      )}
    />
  )
}


const BadgeDocsCount = ({docs, isLoading}:{docs: DocumentData[] | undefined, isLoading: boolean}) => {
  if (isLoading) {
    return <Spin size="small" />
  }
  if (!docs) {
    return <FontAwesomeIcon icon={faExclamationTriangle} />
  }
  return <>
    <Badge count={docs?.length} showZero={true}/>
  </>
}
const PaxList = () => {
  const [authenticatedPaxDocs, authenticatedPaxDocLoading, authenticatedPaxDocsError] = useCollectionData<TPax>(
    db.collection("pax")
      .where("state", "not-in", ["CONFIRMED", "REGISTERED"])
//      .orderBy("name", "asc")
  )

  const [pendingReviewPaxDocs, pendingReviewPaxDocLoading, pendingReviewPaxDocsError] = useCollectionData<TPax>(
    db.collection("pax")
      .where("state", "==", "REGISTERED")
//      .orderBy("name", "asc")
  )

  const [paxDocs, paxDocLoading, paxDocsError] = useCollectionData<TPax>(
    db.collection("pax")
      .where("state", "==", "CONFIRMED")
//      .orderBy("name", "asc")
  )

  return (
    <>
      <h2>
        <FontAwesomeIcon icon={faUsers} /> Répertoire des pax
      </h2>


      <Collapse ghost={true} defaultActiveKey="confirmed-pax-list">

        <Panel key="authenticated-pax-list" header={<><strong>Pax en attente de préinscription</strong>{" "}<BadgeDocsCount docs={authenticatedPaxDocs} isLoading={authenticatedPaxDocLoading}/></>}>
          {!authenticatedPaxDocs ? <Spin /> : <WithContent paxDocs={authenticatedPaxDocs} />}
        </Panel>

        <Panel key="pending-review-pax-list" header={<><strong>Pax en attente de validation</strong>{" "}<BadgeDocsCount docs={pendingReviewPaxDocs} isLoading={pendingReviewPaxDocLoading} /></>}>
          {!pendingReviewPaxDocs ? <Spin /> : <WithContent paxDocs={pendingReviewPaxDocs} />}
        </Panel>

        <Panel key="confirmed-pax-list" header={<><strong>Pax confirmés</strong>{" "}<BadgeDocsCount docs={paxDocs} isLoading={paxDocLoading} /></>}>
          {!paxDocs ? <Spin /> : <WithContent paxDocs={paxDocs} />}
        </Panel>
      </Collapse>


    </>
  )
}

export default PaxList
