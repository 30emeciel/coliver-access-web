import { faUsers } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { DateTime } from "luxon"
import { Container, Image, ListGroup, Row, Spinner } from "react-bootstrap"
import { useCollectionData } from "react-firebase-hooks/firestore"
import { useHistory } from "react-router-dom"
import db from "src/core/db"
import { User } from "src/core/useUser"

const WithContent = ({coliversDocs}:{coliversDocs:any[]}) => {
  
  const history = useHistory()

  const listItems = coliversDocs?.map((coliverDoc) => {    
    return <ListGroup.Item action onClick={() => history.push(`/colivers/${coliverDoc.sub}`)} key={coliverDoc.on}>{coliverDoc?.picture && <Image
      width="32"
      alt="selfie"
      thumbnail={false}
      roundedCircle
      src={coliverDoc?.picture}
    />}{" "}{coliverDoc.on && DateTime.fromMillis(coliverDoc.on?.seconds * 1000).toLocaleString()}</ListGroup.Item>
  })
  
  return <ListGroup>{listItems}</ListGroup>    
}

const PresenceList = () => {

  const [coliversDocs, coliversDocLoading, coliverDocsError] = useCollectionData(db.collectionGroup("days").orderBy("on", "asc"))
  
  return <Container>
      <h2><FontAwesomeIcon icon={faUsers}/> Répertoire</h2>
      {!coliversDocs ? <Spinner animation="border"/>: <WithContent coliversDocs={coliversDocs}/>}
      </Container>  
  
}

export default PresenceList