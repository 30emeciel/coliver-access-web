import { Collapse } from "antd"
import React, { useContext } from "react"
import myloglevel from "src/core/myloglevel"
import MyPresenceCalendar from "./PresenceCalendar/MyPresenceCalendar"
import ReservationList, { ReservationListMode } from "./ReservationList"
import { TPax } from "../models/Pax"
import PaxContext from "../core/paxContext"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faUserClock } from "@fortawesome/free-solid-svg-icons"

const log = myloglevel.getLogger("ReservationIndex")
const { Panel } = Collapse



export default function ReservationIndex({ pax: initialPax }: { pax?: TPax }) {
  const { doc: currentUserData } = useContext(PaxContext)
  const pax = initialPax ? initialPax : currentUserData!

  return <>
      <h2>
        {pax !== currentUserData && <> <FontAwesomeIcon icon={faUserClock} /> Calendrier de présence de {pax.name}</>}
      </h2>

      <MyPresenceCalendar pax={pax}/>

      <br />

      <Collapse ghost={true} defaultActiveKey="current-reservations">
        <Panel key="current-reservations" header={<strong>Réservations en cours</strong>}>
          <ReservationList pax={pax} mode={ReservationListMode.Current}/>
        </Panel>
        <Panel key="past-reservations" header={<strong>Réservations passées</strong>}>
          <ReservationList pax={pax} mode={ReservationListMode.Past}/>
        </Panel>
      </Collapse>
    </>
}
