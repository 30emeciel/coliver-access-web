import { Result, Skeleton, Spin } from "antd"
import { lazy, Suspense, useContext } from "react"
import { useDocumentData } from "react-firebase-hooks/firestore"
import { Route, Switch, useParams } from "react-router-dom"
import db from "src/core/db"
import PaxContext from "src/core/paxContext"
import { TPax } from "src/models/Pax"
import { ReservationListMode } from "src/Reservation/ReservationList"

const Dashboard = lazy(() => import("src/Dashboard/Dashboard"))
const PaxList = lazy(() => import("src/Supervisor/PaxList"))
const PresenceList = lazy(() => import("src/Supervisor/PresenceList"))
const MyPresenceCalendar = lazy(() => import("src/Reservation/PresenceCalendar/MyPresenceCalendar"))
const EditReservation = lazy(() => import("src/Reservation/EditReservation"))
const ReservationIndex = lazy(() => import("src/Reservation/ReservationIndex"))
const Account = lazy(() => import("src/Account/Account"))
const ReservationList = lazy(() => import("src/Reservation/ReservationList"))

type IdParams = {
  id: string
}

type PaxReservationParams = {
  paxId: string
  reservationId: string
}

const MyPresenceCalendarLoader = () => {
  const { id: userId } = useParams<IdParams>()
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
  const { id: userId } = useParams<IdParams>()
  return <Account paxId={userId} />
}

const ReservationLoader = () => {
  const uc = useContext(PaxContext)
  const paxId = uc.doc!.sub!
  const { id: reservationId } = useParams<IdParams>()
  return <EditReservation paxId={paxId} requestId={reservationId} />
}

const SupervisorReservationLoader = () => {
  const { paxId, reservationId } = useParams<PaxReservationParams>()
  return <EditReservation paxId={paxId} requestId={reservationId} />
}
const SubPageLoading = () => {
  return <>
    <Skeleton active />
  </>
}
export function UserContent() {
  const uc = useContext(PaxContext);

  if (!uc.doc) {
    throw Error("pax is empty!");
  }
  return (
    <Suspense fallback={<SubPageLoading />}>
      <Switch>
        <Route exact path="/">
          <Dashboard />
        </Route>
        <Route exact path="/my-reservations">
          <ReservationIndex />
        </Route>
        <Route exact path="/reservation/:id">
          <ReservationLoader />
        </Route>
        <Route exact path="/supervisor/pax/:paxId/reservation/:reservationId">
          <SupervisorReservationLoader />
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
          <ReservationList mode={ReservationListMode.Supervisor}/>
        </Route>
        <Route>
          <Result status="404" title={"Perdu 😐"}/>
        </Route>
      </Switch>
    </Suspense>
  );
}
