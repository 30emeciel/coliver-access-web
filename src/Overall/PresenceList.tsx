import { faUsers } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { DateTime, Duration, Interval } from "luxon"
import { Container, Image, Spinner, Table } from "react-bootstrap"
import { useCollection, useCollectionData, useDocumentData } from "react-firebase-hooks/firestore"
import { useHistory } from "react-router-dom"
import db from "src/core/db"
import firebase from "src/core/firebase_config"
import loglevel from 'loglevel';
import { User } from "src/core/useUser"
const log = loglevel.getLogger("PresenceList")

const UserField = ({coliverId}:{coliverId: string}) => {
  const coliverDocRef = db.doc(`users/${coliverId}`)
  const [coliverData, isLoading, error] = useDocumentData<User>(coliverDocRef)

  if (coliverData) {
  return (<>{coliverData.picture && <Image
    width="32"
    alt="selfie"
    thumbnail={false}
    roundedCircle
    src={coliverData.picture}
  />}{" "}{coliverData.name}</>)
  }
  else {
    return <Spinner animation="border" />
  }


}
const WithContent = ({coliversSnap}:{coliversSnap:firebase.firestore.QuerySnapshot}) => {
  const periodLength = 7
  let startPeriod = DateTime.local().minus({days: 1}).set({hour: 0, minute: 0, second: 0, millisecond: 0})
  const int = Interval.after(startPeriod, Duration.fromObject({days: periodLength}))
  const row = int.splitBy({days: 1}).map((i) => i.start.toMillis())
  
  const history = useHistory()

  const grouped = coliversSnap.docs.reduce<Map<string, boolean[]>>((previousValue, daySnap) => {
    const userId = daySnap.ref.parent!.parent!.id
    const data = daySnap.data()
    const dt = DateTime.fromMillis(data.on.seconds * 1000).toMillis()
    //log.debug(`dt ${dt}`)
    let barr = previousValue.get(userId)
    if (!barr) {
      barr = new Array<boolean>(periodLength).fill(false)
      previousValue.set(userId, barr)
    }
    const t = row.indexOf(dt)
    if (t >= 0) {
      barr[t] = true
    }
    return previousValue    
  }, new Map())

  const trList = Array.from(grouped.entries()).map(([userId, barr]) => {
    const tdList = barr.map((i, index) => <td>{i ? "X" : ""}</td>)
    return (<tr>
      <td><UserField coliverId={userId}/></td>
      {tdList}
    </tr>)
  })

  const headerList = row.map((millis) => <th>{DateTime.fromMillis(millis).toLocaleString(DateTime.DATE_MED_WITH_WEEKDAY)}</th>)

  return <Table striped bordered hover>
  <thead>
    <tr>
      <th>Pax</th>
      {headerList}
    </tr>
  </thead>
  <tbody>
    {trList}
  </tbody>
</Table>

}

const PresenceList = () => {

  const [coliversDocs, coliversDocLoading, coliverDocsError] = useCollection(db.collectionGroup("days").orderBy("on", "asc"))
  
  return <Container fluid>
      <h2><FontAwesomeIcon icon={faUsers}/> Répertoire</h2>
      {!coliversDocs ? <Spinner animation="border"/>: <WithContent coliversSnap={coliversDocs}/>}
      </Container>  
  
}

export default PresenceList