import { faTimes, faUser, faUserClock, faUsers } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { Button, Image, List, Row, Skeleton, Spin, Table } from "antd"
import Avatar from "antd/lib/avatar/avatar"
import { useCollectionData } from "react-firebase-hooks/firestore"
import { useHistory } from "react-router-dom"
import db from "src/core/db"
import { TPax } from "src/models/Pax"

const WithContent = ({ paxDocs }: { paxDocs: TPax[] }) => {
  const history = useHistory()

  const buttons = ({ paxDoc }: { paxDoc: TPax }) => [
    <Button type="primary" onClick={() => history.push(`/pax/${paxDoc.sub}/account`)}>
      <FontAwesomeIcon icon={faUser} /> Compte
    </Button>,
    <Button onClick={() => history.push(`/pax/${paxDoc.sub}`)} className="ml-2">
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

const PaxList = () => {
  const [paxDocs, paxDocLoading, paxDocsError] = useCollectionData<TPax>(db.collection("pax").orderBy("name", "asc"))

  return (
    <>
      <Row>
        <h2>
          <FontAwesomeIcon icon={faUsers} /> Répertoire des pax
        </h2>
      </Row>
      {!paxDocs ? <Spin /> : <WithContent paxDocs={paxDocs} />}
    </>
  )
}

export default PaxList
