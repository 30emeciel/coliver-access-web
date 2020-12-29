import { Container, Image, ListGroup, Row, Spinner } from "react-bootstrap"
import { useCollectionData } from "react-firebase-hooks/firestore"
import db from "src/core/db"
import { User } from "src/core/useUser"


const ColiversList = () => {

  const [coliversDocs, coliversDocLoading, coliverDocsError] = useCollectionData<User>(db.collection("users").orderBy("name", "asc"))

  if (coliversDocLoading) {
    return <Spinner animation="border"/>
  }
  const listItems = coliversDocs?.map((coliverDoc) => {    
    return <ListGroup.Item action key={coliverDoc.sub}>{coliverDoc?.picture && <Image
      width="32"
      alt="selfie"
      thumbnail={false}
      roundedCircle
      src={coliverDoc?.picture}
    />}{" "}{coliverDoc.name}</ListGroup.Item>
  })
  
  return <Container>
    <h2>Liste des colivers</h2>
    
    <ListGroup>
      {listItems}
    </ListGroup>
    </Container>
}

export default ColiversList