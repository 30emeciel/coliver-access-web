import { faUsers } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { Container, Image, ListGroup, Row, Spinner } from "react-bootstrap"
import { useCollectionData } from "react-firebase-hooks/firestore"
import { useHistory } from "react-router-dom"
import db from "src/core/db"
import { User } from "src/core/useUser"

const WithContent = ({coliversDocs}:{coliversDocs:User[]}) => {
  
  const history = useHistory()

  const listItems = coliversDocs?.map((coliverDoc) => {    
    return <ListGroup.Item action onClick={() => history.push(`/colivers/${coliverDoc.sub}`)} key={coliverDoc.sub}>{coliverDoc?.picture && <Image
      width="32"
      alt="selfie"
      thumbnail={false}
      roundedCircle
      src={coliverDoc?.picture}
    />}{" "}{coliverDoc.name}</ListGroup.Item>
  })
  
  return <ListGroup>{listItems}</ListGroup>    
}

const ColiversList = () => {

  const [coliversDocs, coliversDocLoading, coliverDocsError] = useCollectionData<User>(db.collection("users").orderBy("name", "asc"))
  
  return <Container>
      <h2><FontAwesomeIcon icon={faUsers}/> Répertoire</h2>
      {!coliversDocs ? <Spinner animation="border"/>: <WithContent coliversDocs={coliversDocs}/>}
      </Container>  
  
}

export default ColiversList