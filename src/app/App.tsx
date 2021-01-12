import { useAuth0 } from "@auth0/auth0-react"
import {
  faCalendarCheck,
  faEye,

  faSignInAlt,
  faSignOutAlt,

  faUserClock,
  faUserPlus,
  faUsers
} from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { Button, Image, Menu, Result, Row, Spin } from "antd"
import Avatar from "antd/lib/avatar/avatar"
import Layout, { Content, Footer, Header } from "antd/lib/layout/layout"
import SubMenu from "antd/lib/menu/SubMenu"
import React, { useContext } from "react"
import { ErrorBoundary } from "react-error-boundary"
import { useDocumentData } from "react-firebase-hooks/firestore"
import { BrowserRouter, Route, Switch, useHistory, useParams } from "react-router-dom"
import Account from "src/Account/Account"
import db from "src/core/db"
import firebase from "src/core/firebase_config"
import LoadingButton from "src/core/LoadingButton"
import PaxContext, { TPaxContext } from "src/core/paxContext"
import useUser, { Pax, PaxStates } from "src/core/usePax"
import PaxList from "src/Overall/PaxList"
import PresenceList from "src/Overall/PresenceList"
import OnBoarding from "../OnBoarding/OnBoarding"
import MyPresenceCalendar from "../PresenceCalendar/MyPresenceCalendar"
import 'antd/dist/antd.css';
import "./App.css"
import cassé from "./cassé.jpg"
import { LoginOutlined } from '@ant-design/icons';

const NoUserContent = ({ isUserLoading }: { isUserLoading: boolean }) => {
  const { loginWithRedirect, isLoading } = useAuth0()

  return (
    <Layout>
      <Content>
        <h1 className="header">Bienvenue sur l'appli Coliv du 30ème Ciel</h1>
        <h2 className="header">L'application de gestion des présences du 30ème Ciel. Fait avec ❤.</h2>
        <hr />
        <br />
        {isUserLoading ? (
          <Row>
            <Spin />
          </Row>
        ) : (
          <>
            <Row>
              <Button
                icon={<FontAwesomeIcon icon={faSignInAlt} className="anticon"/>}
                size="large"
                type="primary"
                block
                loading={isLoading}
                onClick={() => loginWithRedirect(/*auth0_options*/)}
              >
                Me connecter avec mon compte PaxID
              </Button>
            </Row>
            <br />
            <Row>
              <Button icon={<FontAwesomeIcon className="anticon" icon={faUserPlus} />}                 size="large"
                type="default"
                block
 loading={isLoading} onClick={() => loginWithRedirect(/*auth0_options*/)}>
                Je suis nouveau, je veux créer mon compte PaxID
              </Button>
            </Row>
          </>
        )}
      </Content>
    </Layout>
  )
}

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
const UserContent = () => {
  const uc = useContext(PaxContext)

  if (!uc.doc) {
    throw Error("pax is empty!")
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
    </Switch>
  )
}

const ErrorFallback = ({ error }: { error: Error }) => {
  return (
    <Result status="warning" title="Bravo ! Tu viens de trouver un bug dans notre application." subTitle={error.message} icon={<Image alt="cassé" src={cassé} />} />
  )
}

const NavLinks = () => {
  const history = useHistory()
  const pc = useContext(PaxContext)
  const { logout } = useAuth0()

  return (
    <>
      <Layout>
        <Content>
          <Menu mode="horizontal" theme="dark">
            {pc.doc && pc.doc.state === PaxStates.Confirmed && (
              <>
                <Menu.Item icon={<FontAwesomeIcon icon={faUserClock} />} onClick={() => history.push("/")}>
                  Ma présence
                </Menu.Item>
                {pc.doc?.isSupervisor && (
                  <SubMenu
                    key="supervisor"
                    icon={<FontAwesomeIcon className="mr-2" icon={faEye} />}
                    title="Supervisaire"
                  >
                    <Menu.Item
                      key="setting:1"
                      icon={<FontAwesomeIcon icon={faUsers} />}
                      onClick={() => history.push("/pax")}
                    >
                      Répertoire des pax
                    </Menu.Item>
                    <Menu.Item
                      key="setting:2"
                      icon={<FontAwesomeIcon icon={faCalendarCheck} />}
                      onClick={() => history.push("/presences")}
                    >
                      Tableau des présences
                    </Menu.Item>
                  </SubMenu>
                )}
                {pc.isAuthenticated && (
                  <SubMenu
                    style={{float: "right"}}
                    title={
                      <>
                        {pc.doc?.picture && <Avatar size="default" icon={<Image src={pc.doc?.picture} />} />}
                        <span className="ml-2">{pc.doc?.name ? pc.doc.name : "-"}</span>
                      </>
                    }
                  >
                    <Menu.Item
                      onClick={async () => {
                        await firebase.auth().signOut()
                        logout({ returnTo: window.location.origin })
                      }}
                      icon={<FontAwesomeIcon icon={faSignOutAlt} />}
                    >
                      Logout
                    </Menu.Item>
                  </SubMenu>
                )}
              </>
            )}
          </Menu>
        </Content>
      </Layout>
    </>
  )
}

const App = () => {
  const {
    isLoading: isUserLoading,
    isAuthenticated: isUserAuthenticated,
    userData: userDoc,
    docRef: userDocRef,
  } = useUser()

  const userContextValue: TPaxContext = {
    isLoading: isUserLoading,
    isAuthenticated: isUserAuthenticated,
    doc: userDoc,
    ref: userDocRef,
  }

  return (
    <>
      <BrowserRouter>
        <PaxContext.Provider value={userContextValue}>
          <Layout className="layout">
            <Header>
              <div className="logo">
                <span role="img" aria-label="rainbow" style={{margin: "0px 8px 0 0"}}>🌈</span>
                <span style={{color: "white"}}>Coliv'app</span>

              </div>
              <NavLinks />

            </Header>
            <Content style={{ padding: "50px 50px" }}>
                <ErrorBoundary FallbackComponent={ErrorFallback}>
                  {!isUserLoading && isUserAuthenticated ? (
                    <UserContent />
                  ) : (
                    <NoUserContent isUserLoading={isUserLoading} />
                  )}
                </ErrorBoundary>
            </Content>
            <Footer style={{ textAlign: "center" }}>30ème Ciel 🌈</Footer>
          </Layout>
        </PaxContext.Provider>
      </BrowserRouter>
    </>
  )
}

export default App
