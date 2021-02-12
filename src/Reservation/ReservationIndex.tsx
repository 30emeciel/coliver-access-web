import { Collapse } from "antd"
import React from "react"
import myloglevel from "src/core/myloglevel"
import MyPresenceCalendar from "./PresenceCalendar/MyPresenceCalendar"
import ReservationList, { ReservationListMode } from "./ReservationList"

const log = myloglevel.getLogger("ReservationIndex")
const { Panel } = Collapse

export default function ReservationIndex() {
  return (
    <>

      <MyPresenceCalendar />

      <br />

      <Collapse ghost={true} defaultActiveKey="current-reservations">
        <Panel key="current-reservations" header={<strong>Réservations en cours</strong>}>
          <ReservationList mode={ReservationListMode.Current}/>
        </Panel>
        <Panel key="past-reservations" header={<strong>Réservations passées</strong>}>
          <ReservationList mode={ReservationListMode.Past}/>
        </Panel>
      </Collapse>
    </>
  )
}
