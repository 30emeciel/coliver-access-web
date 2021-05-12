import { faBed, faBriefcase, faCalendarCheck, IconDefinition } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import loglevel from "loglevel"
import { DateTime, Interval } from "luxon"
import { useState } from "react"
import { useCollection, useDocumentData } from "react-firebase-hooks/firestore"
import { useHistory } from "react-router-dom"
import db from "src/core/db"
import firebase from "src/core/myfirebase"
import { goToPaxAccountView, TPax } from "src/models/Pax"
import DateRangePicker from "react-bootstrap-daterangepicker"
// you will need the css that comes with bootstrap@3. if you are using
// a tool like webpack, you can do the following:
// you will also need the css that comes with bootstrap-daterangepicker
import "bootstrap-daterangepicker/daterangepicker.css"
import moment, { Moment } from "moment"
import { $enum } from "ts-enum-util"
import { Checkbox, Col, Row, Space, Spin, Table } from "antd"
import Avatar from "antd/lib/avatar/avatar"
import Column from "antd/lib/table/Column"
import { TReservationKind } from "../models/ReservationRequest"
import { TDay, TDayConverter, TDayState } from "../models/Day"

const log = loglevel.getLogger("PresenceList")

const UserField = ({ paxId, showEmail }: { paxId: string, showEmail: boolean }) => {
  const paxDocRef = db.doc(`pax/${paxId}`)
  const [paxData, isLoading, error] = useDocumentData<TPax>(paxDocRef)

  if (paxData) {
    return (
      <>
        {
          paxData.picture && (
            <Avatar src={paxData.picture} />
          )
        }
        {" "}
        {showEmail ? paxData.email : paxData.name}
      </>
    )
  }
  else {
    return <Spin />
  }
}

const UserEmailField = ({ paxId }: { paxId: string }) => {
  const paxDocRef = db.doc(`pax/${paxId}`)
  const [paxData, isLoading, error] = useDocumentData<TPax>(paxDocRef)

  if (paxData) {
    return (
      <>{paxData.email}
      </>
    )
  } else {
    return <Spin />
  }
}


const WithContent = ({
                       period,
                       paxSnaps,
                       showEmail,
                     }: {
  period: [DateTime, DateTime],
  paxSnaps: firebase.firestore.QuerySnapshot<TDay>,
  showEmail: boolean,
}) => {
  log.debug(`period[0]=${period[0]} period[1]=${period[1]}`)
  const int = Interval.fromDateTimes(period[0], period[1])
  const row = int.splitBy({ days: 1 }).map((i) => i.start.toMillis())
  const periodLength = row.length

  const history = useHistory()

  const grouped = paxSnaps.docs.reduce<Map<string, Map<number, (TReservationKind | null)>>>((previousValue, daySnap) => {
    (() => {
      const userId = daySnap.ref.parent!.parent!.id
      const day = daySnap.data()
      if (day.state !== TDayState.CONFIRMED) {
        return
      }
      const dt = day.on.toMillis()
      let barr = previousValue.get(userId)
      if (!barr) {
        barr = new Map<number, TReservationKind | null>()
        previousValue.set(userId, barr)
      }

      barr.set(dt, $enum(TReservationKind).asValueOrThrow(day.kind))
    })()
    return previousValue
  }, new Map())

  const dataSource = Array.from(grouped.entries()).map(([key, value]) => {
    const dayFieldList = Array.from(value.entries()).map(([key, value]) => [key.toString(), value]) as [string, any][]
    const paxIdField = [["key", key], ["paxId", key]] as [string, any][]
    const data = new Map(paxIdField.concat(dayFieldList))
    return Object.fromEntries(data.entries())
  })

  const tdFct = (i: any) => {
    if (!i) return <></>
    const r: [string, IconDefinition] = i === TReservationKind.COLIVING ? ["#606dbc", faBed] : ["#6dbc6d", faBriefcase]
    return <FontAwesomeIcon style={{ color: r[0] }} icon={r[1]} />
  }

  const day_columns = row.map((millis) => (
    <Column
      title={DateTime.fromMillis(millis).toLocaleString({
        /* weekday: 'short',*/ month: "short",
        day: "2-digit",
      })}
      dataIndex={millis.toString()}
      key={millis.toString()}
      render={(rk) => tdFct(rk)}
    />
  ))

  const pax_column = <Column<Record<string, string>>
    title="Pax"
    dataIndex="paxId"
    key="paxId"
    render={(paxId) => <UserField showEmail={showEmail} paxId={paxId} />}
    width={280}
    fixed="left"
    className="clickable-table-cell"
    onCell={(record,) => {
      return {
        onClick: () => {
          goToPaxAccountView(history, record["paxId"])}, // click row
      };
    }
    }
  />

  const columns = [pax_column].concat(day_columns)

  return (
    <Table
      bordered={true}
      pagination={false}
      size="small"
      scroll={{ "x": 1800 }}
      dataSource={dataSource}>
      {columns}
    </Table>


  )
}

const PresenceList = () => {
  const [period, setPeriod] = useState<[DateTime, DateTime]>([DateTime.local().startOf("month"), DateTime.local().endOf("month")])
  const [showEmail, setShowEmail] = useState(false)

  const [paxSnaps, paxDocLoading, paxDocsError] = useCollection<TDay>(
    db.collectionGroup("days").withConverter(TDayConverter)
      .where("on", ">=", period[0].toJSDate())
      .where("on", "<=", period[1].toJSDate())
      .orderBy("on", "asc"),
  )

  const handleCallback = (start: Moment, end: Moment, label: string | undefined) => {
    log.debug(`start ${start} end: ${end} label: ${label}`)
    setPeriod([DateTime.fromJSDate(start.toDate()), DateTime.fromJSDate(end.toDate())])
    //setEndPeriod(end)
  }

  return <>
      <h2>
        <FontAwesomeIcon icon={faCalendarCheck} /> Tableau des présences
      </h2>
      <Space direction="horizontal">
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
        <span>
        <Checkbox checked={showEmail} onChange={(e) => {setShowEmail(e.target.checked)}}/>
          {" "} Afficher les e-mails
        </span>
      </Space>
      {!paxSnaps ? (
        <Spin />
      ) : (
        <WithContent
          period={period}
          paxSnaps={paxSnaps}
          showEmail={showEmail}
        />
      )}
  </>
}

export default PresenceList
