import { faExclamationTriangle, faUser, faUserClock, faUsers } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { Badge, Button, Card, Collapse, List, Spin } from "antd"
import Avatar from "antd/lib/avatar/avatar"
import { useCollectionData } from "react-firebase-hooks/firestore"
import { useHistory } from "react-router-dom"
import db from "src/core/db"
import { goToPaxAccountView, TPax, TPaxConverter } from "src/models/Pax"
import React from "react"
import firebase from "firebase"
import Meta from "antd/es/card/Meta"

type Query = firebase.firestore.Query
type DocumentData = firebase.firestore.DocumentData


const { Panel } = Collapse

const WithContent = ({ isLoading, paxDocs }: { isLoading: boolean, paxDocs: TPax[] | undefined }) => {
  const history = useHistory()

  const listItem = (paxDoc: TPax) => {
    const buttons = [
      <Button size="small" type="primary" onClick={() => goToPaxAccountView(history, paxDoc.id)}>
        <FontAwesomeIcon icon={faUser} /> Compte
      </Button>,
      <Button size="small" onClick={() => history.push(`/supervisor/pax/${paxDoc.id}/presence`)} className="ml-2">
        <FontAwesomeIcon icon={faUserClock} /> Présence
      </Button>,
    ]


    return <>
      <List.Item>
        <Card hoverable={false} actions={buttons}>
          <Meta  avatar={<Avatar src={paxDoc.picture} />} title={paxDoc.name} />
        </Card>
      </List.Item>
    </>
  }

  return (
    <List
      loading={isLoading}
      size="small"
      grid={{
        gutter: 4,
        xs: 1,
        sm: 2,
        md: 2,
        lg: 3,
        xl: 4,
        xxl: 5,
      }}
      dataSource={paxDocs}
      renderItem={listItem}
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

  const paxListPanel = (key: string, title: string, criteria: (query: Query) => Query) => {
    const [paxDocs, paxDocLoading, paxDocsError] = useCollectionData<TPax>(
      criteria(db.collection("pax"))
        .orderBy("name", "asc")
        .withConverter(TPaxConverter)
    )

    if (paxDocsError) {
      throw paxDocsError
    }

    return <>
      <Panel key={key} header={<><strong>{title}</strong>{" "}<BadgeDocsCount docs={paxDocs} isLoading={paxDocLoading}/></>}>
        <WithContent isLoading={paxDocLoading} paxDocs={paxDocs} />
      </Panel>
    </>
  }

  return (
    <>
      <h2>
        <FontAwesomeIcon icon={faUsers} /> Répertoire des pax
      </h2>


      <Collapse ghost={true} defaultActiveKey="confirmed-pax-list">
        {paxListPanel("authenticated-pax-list", "Pax en attente de préinscription", query => query.where("state", "==", "AUTHENTICATED"))}
        {paxListPanel("pending-review-pax-list", "Pax en attente de validation", query => query.where("state", "==", "REGISTERED"))}
        {paxListPanel("confirmed-pax-list", "Pax confirmés", query => query.where("state", "==", "CONFIRMED"))}
      </Collapse>


    </>
  )
}

export default PaxList
