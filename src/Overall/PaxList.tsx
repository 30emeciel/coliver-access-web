import { faUsers } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { Container, Image, ListGroup, Row, Spinner } from "react-bootstrap"
import { useCollectionData } from "react-firebase-hooks/firestore"
import { useHistory } from "react-router-dom"
import db from "src/core/db"
import { Pax } from "src/core/usePax"

const WithContent = ({ paxDocs }: { paxDocs: Pax[] }) => {
  const history = useHistory()

  const listItems = paxDocs?.map((paxDoc) => {
    return (
      <ListGroup.Item action onClick={() => history.push(`/pax/${paxDoc.sub}`)} key={paxDoc.sub}>
        {paxDoc?.picture && (
          <Image width="32" alt="selfie" thumbnail={false} roundedCircle src={paxDoc?.picture} />
        )}{" "}
        {paxDoc.name}
      </ListGroup.Item>
    )
  })

  return <ListGroup>{listItems}</ListGroup>
}

const PaxList = () => {
  const [paxDocs, paxDocLoading, paxDocsError] = useCollectionData<Pax>(
    db.collection("pax").orderBy("name", "asc")
  )

  return (
    <Container>
      <h2>
        <FontAwesomeIcon icon={faUsers} /> Répertoire
      </h2>
      {!paxDocs ? <Spinner animation="border" /> : <WithContent paxDocs={paxDocs} />}
    </Container>
  )
}

export default PaxList
