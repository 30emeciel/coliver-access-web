import { Result, Spin } from "antd"
import React, { useContext } from "react"
import { useDocumentData } from "react-firebase-hooks/firestore"
import { Route, Switch, useParams } from "react-router-dom"
import Account from "src/Account/Account"
import ReservationList from "src/Reservation/ReservationList"
import db from "src/core/db"
import PaxContext from "src/core/paxContext"
import { TPax } from "src/models/Pax"
import Dashboard from "src/Dashboard/Dashboard"
import PaxList from "src/Supervisor/PaxList"
import PresenceList from "src/Supervisor/PresenceList"
import MyPresenceCalendar from "../PresenceCalendar/MyPresenceCalendar"


type PaxParams = {
  id: string
}

const MyPresenceCalendarLoader = () => {
  const { id: userId } = useParams<PaxParams>()
  const [pax, , error] = useDocumentData<TPax>(db.doc(`pax/${userId}`))
  if (error) {
    throw error
  }
  if (pax) {
    return <MyPresenceCalendar pax={pax} />
  } else {
    return (
        <Spin />

    )
  }
}

const AccountLoader = () => {
  const { id: userId } = useParams<PaxParams>()
  return <Account paxId={userId} />
}
export function UserContent() {
  const uc = useContext(PaxContext);

  if (!uc.doc) {
    throw Error("pax is empty!");
  }

  return (
    <Switch>
      <Route exact path="/">
        <Dashboard />
      </Route>
      <Route exact path="/presence">
        <MyPresenceCalendar />
      </Route>
      <Route exact path="/my-reservations">
        <ReservationList />
      </Route>
      <Route exact path="/supervisor/pax">
        <PaxList />
      </Route>
      <Route exact path="/supervisor/pax/:id/presence">
        <MyPresenceCalendarLoader />
      </Route>
      <Route exact path="/supervisor/pax/:id/account">
        <AccountLoader />
      </Route>
      <Route exact path="/supervisor/presence-summary">
        <PresenceList />
      </Route>
      <Route exact path="/supervisor/reservations">
        <ReservationList isSupervisorMode={true}/>
      </Route>
      <Route>
        <Result status="404" title={"Perdu 😐"}/>
      </Route>

    </Switch>
  );
}
