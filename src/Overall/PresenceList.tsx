import { faBed, faBriefcase, faCalendarCheck, IconDefinition } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import loglevel from "loglevel"
import { DateTime, Duration, Interval } from "luxon"
import { useState } from "react"
import { Col, Container, Form, Image, Spinner, Table } from "react-bootstrap"
import { useCollection, useDocumentData } from "react-firebase-hooks/firestore"
import { useHistory } from "react-router-dom"
import db from "src/core/db"
import firebase from "src/core/firebase_config"
import { Pax } from "src/core/usePax"
import DateRangePicker from "react-bootstrap-daterangepicker"
// you will need the css that comes with bootstrap@3. if you are using
// a tool like webpack, you can do the following:
import "bootstrap/dist/css/bootstrap.css"
// you will also need the css that comes with bootstrap-daterangepicker
import "bootstrap-daterangepicker/daterangepicker.css"
import moment, { Moment } from "moment"
import { $enum } from "ts-enum-util"
import { ReservationKinds } from "src/PresenceCalendar/MyPresenceCalendarTypes"

const log = loglevel.getLogger("PresenceList")

const UserField = ({ paxId }: { paxId: string }) => {
  const paxDocRef = db.doc(`pax/${paxId}`)
  const [paxData, isLoading, error] = useDocumentData<Pax>(paxDocRef)

  if (paxData) {
    return (
      <>
        {paxData.picture && (
          <Image width="32" alt="selfie" thumbnail={false} roundedCircle src={paxData.picture} />
        )}{" "}
        {paxData.name}
      </>
    )
  } else {
    return <Spinner animation="border" />
  }
}


const WithContent = ({
  period,
  paxSnap,
}: {
  period: [DateTime, DateTime]
  paxSnap: firebase.firestore.QuerySnapshot
}) => {
  log.debug(`period[0]=${period[0]} period[1]=${period[1]}`)
  const int = Interval.fromDateTimes(period[0], period[1])
  const row = int.splitBy({ days: 1 }).map((i) => i.start.toMillis())
  const periodLength = row.length

  const history = useHistory()

  const grouped = paxSnap.docs.reduce<Map<string, (ReservationKinds|null)[]>>((previousValue, daySnap) => {
    ;(() => {
      const userId = daySnap.ref.parent!.parent!.id
      const data = daySnap.data()
      if (data.status !== "CONFIRMED") {
        //return
      }
      const dt = DateTime.fromMillis(data.on.seconds * 1000).toMillis()
      let barr = previousValue.get(userId)
      const index = row.indexOf(dt)
      if (index === -1) {
        return
      }
      if (!barr) {
        barr = new Array<ReservationKinds|null>(periodLength).fill(null)
        previousValue.set(userId, barr)
      }

      barr[index] = $enum(ReservationKinds).asValueOrThrow(data.kind)
    })()
    return previousValue
  }, new Map())

  const tdFct = (i:any) => {
    if (!i) return <></>
    const r:[string, IconDefinition] = i === ReservationKinds.Coliving ? ['#606dbc', faBed] : ['#6dbc6d', faBriefcase]
    return <FontAwesomeIcon style={{color: r[0]}} icon={r[1]} />
  }

  const trList = Array.from(grouped.entries()).map(([userId, barr]) => {
    const tdList = barr.map((i, index) => <td key={`${userId}${index}`}>{tdFct(i)}</td>)
    return (
      <tr key={userId}>
        <td>
          <UserField paxId={userId} />
        </td>
        {tdList}
      </tr>
    )
  })

  const headerList = row.map((millis) => (
    <th key={millis}>
      {DateTime.fromMillis(millis).toLocaleString({
        /* weekday: 'short',*/ month: "short",
        day: "2-digit",
      })}
    </th>
  ))

  return (
    <Table striped bordered hover responsive size="sm">
      <thead>
        <tr>
          <th>Pax</th>
          {headerList}
        </tr>
      </thead>
      <tbody>{trList}</tbody>
    </Table>
  )
}

const PresenceList = () => {
  const [paxDocs, paxDocLoading, paxDocsError] = useCollection(
    db.collectionGroup("days").orderBy("on", "asc")
  )
  const [period, setPeriod] = useState<[DateTime, DateTime]>([DateTime.local().startOf("month"), DateTime.local().endOf("month")])

  const handleCallback = (start: Moment, end: Moment, label: String | undefined) => {
    log.debug(`start ${start} end: ${end} label: ${label}`)
    setPeriod([DateTime.fromJSDate(start.toDate()), DateTime.fromJSDate(end.toDate())])
    //setEndPeriod(end)
  }

  return (
    <Container fluid>
      <h2>
        <FontAwesomeIcon icon={faCalendarCheck} /> Tableau des présences
      </h2>
        <Form>
          <Form.Group controlId="exampleForm.ControlInput1">
            <Form.Label>Période</Form.Label>
            <DateRangePicker
              onCallback={handleCallback}
              initialSettings={{
                autoApply: false,
                alwaysShowCalendars: true,
                ranges: {
                  "Les 7 derniers jours": [moment().subtract(6, "days"), moment()],
                  "Les 30 derniers jours": [moment().subtract(29, "days"), moment()],
                  "Ce mois-ci": [moment().startOf("month"), moment().endOf("month")],
                  "Le mois dernier": [
                    moment().subtract(1, "month").startOf("month"),
                    moment().subtract(1, "month").endOf("month"),
                  ],
                },
                locale: {
                  format: "DD/MM/YYYY",
                  separator: " - ",
                  applyLabel: "Appliquer",
                  cancelLabel: "Annuler",
                  fromLabel: "De",
                  toLabel: "A",
                  customRangeLabel: "Autre",
                  weekLabel: "S",
                  daysOfWeek: ["Di", "Lu", "Ma", "Me", "Je", "Ve", "Sa"],
                  monthNames: [
                    "Janvier",
                    "Fevrier",
                    "Mars",
                    "Avril",
                    "Mai",
                    "Juin",
                    "Juillet",
                    "Août",
                    "Septembre",
                    "Octobre",
                    "Novembre",
                    "Décembre",
                  ],
                  firstDay: 1,
                },
                startDate: period[0].toJSDate(),
                endDate: period[1].toJSDate(),
              }}
            >
              <input type="text" className="form-control" />
            </DateRangePicker>
          </Form.Group>
        </Form>
      {!paxDocs ? (
        <Spinner animation="border" />
      ) : (
        <WithContent
          period={period}
          paxSnap={paxDocs}
        />
      )}
    </Container>
  )
}

export default PresenceList
