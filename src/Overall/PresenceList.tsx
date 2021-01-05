import { faUsers } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { DateTime, Duration, Interval } from "luxon"
import { Container, Spinner } from "react-bootstrap"
import { useCollection } from "react-firebase-hooks/firestore"
import { useHistory } from "react-router-dom"
import db from "src/core/db"
import firebase from "src/core/firebase_config"


const WithContent = ({coliversSnap}:{coliversSnap:firebase.firestore.QuerySnapshot}) => {
  let startPeriod = DateTime.local().minus({days: 1})
  const int = Interval.after(startPeriod, Duration.fromObject({days: 7}))
  const row = int.splitBy({days: 1}).map((i) => i.start)
  
  const history = useHistory()

  const grouped = coliversSnap.docs.reduce<Map<string, string>>((previousValue, currentValue) => previousValue, new Map<string, string>())

  return <div/>

}

const PresenceList = () => {

  const [coliversDocs, coliversDocLoading, coliverDocsError] = useCollection(db.collectionGroup("days").orderBy("on", "asc"))
  
  return <Container>
      <h2><FontAwesomeIcon icon={faUsers}/> Répertoire</h2>
      {!coliversDocs ? <Spinner animation="border"/>: <WithContent coliversSnap={coliversDocs}/>}
      </Container>  
  
}

export default PresenceList