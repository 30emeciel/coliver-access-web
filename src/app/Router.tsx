import { Breadcrumb, Layout, Menu, Result, Skeleton, Spin } from "antd"
import { lazy, Suspense, useContext } from "react"
import { useDocumentData } from "react-firebase-hooks/firestore"
import { Redirect, Route, Switch, useParams } from "react-router-dom"
import db from "src/core/db"
import PaxContext from "src/core/paxContext"
import { TPax, TPaxStates } from "src/models/Pax"
import { ReservationListMode } from "src/Reservation/ReservationList"
import OnBoarding from "../OnBoarding/OnBoarding"
import { Login } from "./Login"
import Sider from "antd/es/layout/Sider"
import { Content, Header } from "antd/es/layout/layout"
import { LaptopOutlined, NotificationOutlined, UserOutlined } from "@ant-design/icons"
import SubMenu from "antd/es/menu/SubMenu"

const Dashboard = lazy(() => import("src/Dashboard/Dashboard"))
const PaxList = lazy(() => import("src/Supervisor/PaxList"))
const PresenceList = lazy(() => import("src/Supervisor/PresenceTable"))
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

const ReservationIndexLoader = () => {
  const { id: userId } = useParams<IdParams>()
  const [pax, , error] = useDocumentData<TPax>(db.doc(`pax/${userId}`))
  if (error) {
    throw error
  }
  if (pax) {
    return <ReservationIndex pax={pax} />
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
  const paxId = uc.doc!.id!
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
export function Router() {
  const uc = useContext(PaxContext);

  return (
    <Suspense fallback={<SubPageLoading />}>
      <Switch>
        <Route exact path="/login">
          {uc.doc ? <Redirect to="/" /> : <Login />}
        </Route>
        {!uc.doc && <Redirect to="/login" /> }
        <Route exact path="/onboarding">
          {uc.doc && uc.doc.state === TPaxStates.Confirmed ? <Redirect to="/" /> : <OnBoarding />}
        </Route>
        {uc.doc && uc.doc.state !== TPaxStates.Confirmed && <Redirect to="/onboarding"/>}
        <Route exact path="/">
          <Dashboard />
        </Route>
        <Route exact path="/reservations">
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
          <ReservationIndexLoader />
        </Route>
        <Route exact path="/supervisor/pax/:id/account">
          <Layout>
            <Sider>
              <Menu
                mode="inline"
                defaultSelectedKeys={['1']}
                defaultOpenKeys={['sub1']}
              >
                <SubMenu key="sub1" icon={<UserOutlined />} title="subnav 1">
                  <Menu.Item key="1">option1</Menu.Item>
                  <Menu.Item key="2">option2</Menu.Item>
                  <Menu.Item key="3">option3</Menu.Item>
                  <Menu.Item key="4">option4</Menu.Item>
                </SubMenu>
                <SubMenu key="sub2" icon={<LaptopOutlined />} title="subnav 2">
                  <Menu.Item key="5">option5</Menu.Item>
                  <Menu.Item key="6">option6</Menu.Item>
                  <Menu.Item key="7">option7</Menu.Item>
                  <Menu.Item key="8">option8</Menu.Item>
                </SubMenu>
                <SubMenu key="sub3" icon={<NotificationOutlined />} title="subnav 3">
                  <Menu.Item key="9">option9</Menu.Item>
                  <Menu.Item key="10">option10</Menu.Item>
                  <Menu.Item key="11">option11</Menu.Item>
                  <Menu.Item key="12">option12</Menu.Item>
                </SubMenu>
              </Menu>
            </Sider>

              <Layout>
                <Header>Header</Header>
                <Content>
                  <AccountLoader />
                </Content>
              </Layout>

          </Layout>

        </Route>
        <Route exact path="/supervisor/presence-table">
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
