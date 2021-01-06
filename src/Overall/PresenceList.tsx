import {
  faBed,
  faCalendar,
  faCalendarCheck,
  faCheck,
  faUsers,
  faUsersCog,
  faUsersSlash,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { DateTime, Duration, Interval } from "luxon";
import {
  Col,
  Container,
  Dropdown,
  Form,
  Image,
  Spinner,
  Table,
} from "react-bootstrap";
import {
  useCollection,
  useCollectionData,
  useDocumentData,
} from "react-firebase-hooks/firestore";
import { useHistory } from "react-router-dom";
import db from "src/core/db";
import firebase from "src/core/firebase_config";
import loglevel from "loglevel";
import { User } from "src/core/useUser";

import "react-datepicker/dist/react-datepicker.css";
import DatePicker from "react-datepicker";
import { createElement, forwardRef, useState } from "react";

const log = loglevel.getLogger("PresenceList");

const UserField = ({ coliverId }: { coliverId: string }) => {
  const coliverDocRef = db.doc(`users/${coliverId}`);
  const [coliverData, isLoading, error] = useDocumentData<User>(coliverDocRef);

  if (coliverData) {
    return (
      <>
        {coliverData.picture && (
          <Image
            width="32"
            alt="selfie"
            thumbnail={false}
            roundedCircle
            src={coliverData.picture}
          />
        )}{" "}
        {coliverData.name}
      </>
    );
  } else {
    return <Spinner animation="border" />;
  }
};
const WithContent = ({
  startPeriod,
  periodLength,
  coliversSnap,
}: {
  startPeriod: DateTime,
  periodLength: number,
  coliversSnap: firebase.firestore.QuerySnapshot;
}) => {


  const int = Interval.after(
    startPeriod,
    Duration.fromObject({ days: periodLength })
  );
  const row = int.splitBy({ days: 1 }).map((i) => i.start.toMillis());

  const history = useHistory();

  const grouped = coliversSnap.docs.reduce<Map<string, boolean[]>>(
    (previousValue, daySnap) => {
      const userId = daySnap.ref.parent!.parent!.id;
      const data = daySnap.data();
      const dt = DateTime.fromMillis(data.on.seconds * 1000).toMillis();
      let barr = previousValue.get(userId);
      if (!barr) {
        barr = new Array<boolean>(periodLength).fill(false);
        previousValue.set(userId, barr);
      }
      const t = row.indexOf(dt);
      if (t >= 0) {
        barr[t] = true;
      }
      return previousValue;
    },
    new Map()
  );

  const trList = Array.from(grouped.entries()).map(([userId, barr]) => {
    const tdList = barr.map((i, index) => <td key={`${userId}${index}`}>{i && <FontAwesomeIcon icon={faBed}/>}</td>);
    return (
      <tr key={userId}>
        <td>
          <UserField coliverId={userId} />
        </td>
        {tdList}
      </tr>
    );
  });

  const headerList = row.map((millis) => (
    <th key={millis}>
      {DateTime.fromMillis(millis).toLocaleString(
        DateTime.DATE_SHORT
      )}
    </th>
  ));

  return (
    <Table striped bordered hover responsive size="xs">
      <thead>
        <tr>
          <th>Pax</th>
          {headerList}
        </tr>
      </thead>
      <tbody>{trList}</tbody>
    </Table>
  );
};

const PresenceList = () => {
  const [coliversDocs, coliversDocLoading, coliverDocsError] = useCollection(
    db.collectionGroup("days").orderBy("on", "asc")
  );
  const [startPeriod, setStartPeriod] = useState(DateTime.local().set({ hour: 0, minute: 0, second: 0, millisecond: 0 }));
  const [periodLength, setPeriodLength] = useState(14)


  const customInput = forwardRef(({ value, onClick }:{value:any, onClick:any}, ref) => (
    <Form.Group ref={ref} as={Col} controlId="formGridEmail"><Form.Label>Début de la période</Form.Label><Form.Control onChange={() => {}} onClick={onClick} value={value}/></Form.Group>
  ))

  return (
    <Container fluid>
      <h2>
        <FontAwesomeIcon icon={faCalendarCheck} /> Tableau des présences
      </h2>
      <Container>
        <Form>
          <Form.Row>
          <DatePicker selected={startPeriod.toJSDate()} onChange={(d) => setStartPeriod(DateTime.fromJSDate(d as Date))} customInput={createElement(customInput)}/>

            <Form.Group as={Col} controlId="formGridState">
              <Form.Label>Durée de la période</Form.Label>
              <Form.Control as="select" value={periodLength} onChange={(event) => {setPeriodLength(Number(event.target.value))}}>
                <option value={7}>1 semaine</option>
                <option value={7 * 2}>2 semaines</option>
                <option value={7 * 4}>4 semaines</option>
                <option value={7 * 6}>6 semaines</option>                
              </Form.Control>
            </Form.Group>
          </Form.Row>
        </Form>
      </Container>
      {!coliversDocs ? (
        <Spinner animation="border" />
      ) : (
        <WithContent startPeriod={startPeriod} periodLength={periodLength} coliversSnap={coliversDocs} />
      )}
    </Container>
  );
};

export default PresenceList;
