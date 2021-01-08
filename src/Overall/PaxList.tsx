import { faTimes, faUser, faUserClock, faUsers } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { Button, Col, Container, Image, ListGroup, Row, Spinner, Table } from "react-bootstrap"
import { useCollectionData } from "react-firebase-hooks/firestore"
import { useHistory } from "react-router-dom"
import db from "src/core/db"
import { Pax } from "src/core/usePax"

const WithContent = ({ paxDocs }: { paxDocs: Pax[] }) => {
  const history = useHistory()

  const listItems = paxDocs?.map((paxDoc) => {
    return (
      <tr>
        <td>
            {paxDoc?.picture && <Image width="32" alt="selfie" thumbnail={false} roundedCircle src={paxDoc?.picture} />}{" "}
            {paxDoc.name}
          </td>
          <td className="d-flex justify-content-end">
            <Button><FontAwesomeIcon icon={faUser}/> Compte</Button>
            <Button onClick={() => history.push(`/pax/${paxDoc.sub}`)} className="ml-2"><FontAwesomeIcon icon={faUserClock}/> Présence</Button>
          </td>
        </tr>
    )
  })

  return (<Table striped hover size="sm">
  <thead>
    <tr>
      <th>Pax</th>
      <th></th>
    </tr>
  </thead>
  <tbody>{listItems}
  </tbody>
  </Table>)
}

const PaxList = () => {
  const [paxDocs, paxDocLoading, paxDocsError] = useCollectionData<Pax>(db.collection("pax").orderBy("name", "asc"))

  return (
    <Container>
      <h2>
        <FontAwesomeIcon icon={faUsers} /> Répertoire des participantes
      </h2>
      {!paxDocs ? <Spinner animation="border" /> : <WithContent paxDocs={paxDocs} />}
    </Container>
  )
}

export default PaxList
