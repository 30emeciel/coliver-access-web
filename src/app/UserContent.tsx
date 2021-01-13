import { Spin } from "antd";
import React, { useContext } from "react";
import { useDocumentData } from "react-firebase-hooks/firestore";
import { Route, Switch, useParams } from "react-router-dom";
import Account from "src/Account/Account";
import db from "src/core/db";
import PaxContext from "src/core/paxContext";
import { Pax, PaxStates } from "src/core/usePax";
import DateRangePickerCalendarExample from "src/PresenceCalendar/Demo";
import PaxList from "src/Supervisor/PaxList";
import PresenceList from "src/Supervisor/PresenceList";
import OnBoarding from "../OnBoarding/OnBoarding";
import MyPresenceCalendar from "../PresenceCalendar/MyPresenceCalendar";


type PaxParams = {
  id: string
}

const MyPresenceCalendarLoader = () => {
  const { id: userId } = useParams<PaxParams>()
  const [pax, isLoading, error] = useDocumentData<Pax>(db.doc(`pax/${userId}`))
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
        {uc.doc.state === PaxStates.Confirmed ? <MyPresenceCalendar /> : <OnBoarding />}
      </Route>
      <Route exact path="/pax">
        <PaxList />
      </Route>
      <Route exact path="/pax/:id">
        <MyPresenceCalendarLoader />
      </Route>
      <Route exact path="/pax/account/:id">
        <AccountLoader />
      </Route>
      <Route exact path="/presences">
        <PresenceList />
      </Route>
      <Route exact path="/test">
        <DateRangePickerCalendarExample />
      </Route>
    </Switch>
  );
}
