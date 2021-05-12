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
import { Badge, Checkbox, Space, Spin, Table } from "antd"
import Avatar from "antd/lib/avatar/avatar"
import Column from "antd/lib/table/Column"
import { TReservationKind } from "../models/ReservationRequest"
import { TDay, TDayConverter, TDayState } from "../models/Day"
import { ClockCircleOutlined } from "@ant-design/icons"

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

const WithContent = (
  {
    period,
    daySnaps,
    showEmail,
    isLoading,
  }: {
    period: [DateTime, DateTime],
    daySnaps: firebase.firestore.QuerySnapshot<TDay> | undefined,
    showEmail: boolean,
    isLoading: boolean,
}) => {
  log.debug(`period[0]=${period[0]} period[1]=${period[1]}`)
  const int = Interval.fromDateTimes(period[0], period[1])
  const row = int.splitBy({ days: 1 }).map((i) => i.start.toMillis())

  const history = useHistory()

  const grouped = daySnaps?.docs.reduce<Map<string, Map<number, (TDay | null)>>>((previousValue, daySnap) => {
    (() => {
      const userId = daySnap.ref.parent!.parent!.id
      const day = daySnap.data()
      const dt = day.on.toMillis()
      let barr = previousValue.get(userId)
      if (!barr) {
        barr = new Map<number, TDay | null>()
        previousValue.set(userId, barr)
      }

      barr.set(dt, day)
    })()
    return previousValue
  }, new Map())

  const dataSource = grouped ? Array.from(grouped.entries()).map(([key, value]) => {
    const dayFieldList = Array.from(value.entries()).map(([key, value]) => [key.toString(), value]) as [string, any][]
    const paxIdField = [["key", key], ["paxId", key]] as [string, any][]
    const data = new Map(paxIdField.concat(dayFieldList))
    return Object.fromEntries(data.entries())
  }) : undefined

  const tdFct = (i: TDay) => {
    if (!i)
      return <></>
    const r: [string, IconDefinition] = i.kind === TReservationKind.COLIVING ? ["#606dbc", faBed] : ["#6dbc6d", faBriefcase]
    const icon = <FontAwesomeIcon style={{ color: r[0] }} icon={r[1]} />
    if (i.state == TDayState.PENDING_REVIEW) {
      return <Badge count={<ClockCircleOutlined />}>{icon}</Badge>
    }
    else {
      return icon
    }
  }

  const day_columns = row.map((millis) => {
    const day_dt = DateTime.fromMillis(millis)
    return (
      <Column<Record<string, any>>
        title={day_dt.toLocaleString({
          /* weekday: 'short',*/ month: "short",
          day: "2-digit",
        })}
        dataIndex={millis.toString()}
        key={millis.toString()}
        render={(rk) => tdFct(rk)}
        className={[6, 7].includes(day_dt.weekday) ? "presence-list-weekend-cell" : ""}
      />
    )
  })

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
      loading={isLoading}
      scroll={{ "x": 1800 }}
      dataSource={dataSource}>
      {columns}
    </Table>


  )
}

const PresenceList = () => {
  const [period, setPeriod] = useState<[DateTime, DateTime]>([DateTime.local().startOf("month"), DateTime.local().endOf("month")])
  const [showEmail, setShowEmail] = useState(false)

  const [daySnaps, daySnapsLoading, dayError] = useCollection<TDay>(
    db.collectionGroup("days").withConverter(TDayConverter)
      .where("on", ">=", period[0].toJSDate())
      .where("on", "<=", period[1].toJSDate())
      .where("state", "in", ["CONFIRMED", "PENDING_REVIEW"])
      .orderBy("on", "asc"),
  )

  const handleCallback = (start: Moment, end: Moment, label: string | undefined) => {
    log.debug(`start ${start} end: ${end} label: ${label}`)
    setPeriod([DateTime.fromJSDate(start.toDate()), DateTime.fromJSDate(end.toDate())])
    //setEndPeriod(end)
  }
  if (dayError) {
    throw dayError
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
      <WithContent
          period={period}
          daySnaps={daySnaps}
          isLoading={daySnapsLoading}
          showEmail={showEmail}
        />

  </>
}

export default PresenceList
