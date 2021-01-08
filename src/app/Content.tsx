import { useAuth0 } from "@auth0/auth0-react"
import {
  faCalendarCheck,
  faEye,
  faSignInAlt,
  faSignOutAlt,
  faSuperscript,
  faUserClock,
  faUserPlus,
  faUsers,
} from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import React, { useContext } from "react"
import { Alert, Image, Jumbotron, Spinner } from "react-bootstrap"
import Container from "react-bootstrap/Container"
import Nav from "react-bootstrap/Nav"
import Navbar from "react-bootstrap/Navbar"
import NavDropdown from "react-bootstrap/NavDropdown"
import Row from "react-bootstrap/Row"
import { ErrorBoundary } from "react-error-boundary"
import { useDocumentData } from "react-firebase-hooks/firestore"
import { BrowserRouter, Route, Switch, useHistory, useParams } from "react-router-dom"
import db from "src/core/db"
import firebase from "src/core/firebase_config"
import LoadingButton from "src/core/LoadingButton"
import PaxContext, { TPaxContext } from "src/core/paxContext"
import useUser, { Pax, PaxStates } from "src/core/usePax"
import PaxList from "src/Overall/PaxList"
import PresenceList from "src/Overall/PresenceList"
import OnBoarding from "../OnBoarding/OnBoarding"
import MyPresenceCalendar from "../PresenceCalendar/MyPresenceCalendar"
import cassé from "./cassé.jpg"
import Account from "src/Account/Account"

const NoUserContent = ({ isUserLoading }: { isUserLoading: boolean }) => {
  const { loginWithRedirect, isLoading } = useAuth0()

  return (
    <Container>
      <Jumbotron>
        <h1 className="header">Bienvenue sur l'appli Coliv du 30ème Ciel</h1>
        <h2 className="header">L'application de gestion des présences du 30ème Ciel. Fait avec ❤.</h2>
        <hr />
        <br />
        {isUserLoading ? (
          <Row className="justify-content-md-center">
            <Spinner animation="grow" />
          </Row>
        ) : (
          <>
            <Row className="justify-content-md-center" lg={2}>
              <LoadingButton variant="success" isLoading={isLoading} onClick={() => loginWithRedirect(/*auth0_options*/)}>
                <FontAwesomeIcon icon={faSignInAlt} /> Me connecter avec mon compte PaxID
              </LoadingButton>
            </Row>
            <br />
            <Row className="justify-content-md-center" lg={2}>
              <LoadingButton isLoading={isLoading} onClick={() => loginWithRedirect(/*auth0_options*/)}>
                <FontAwesomeIcon icon={faUserPlus} /> Je suis nouveau, je veux créer mon compte PaxID
              </LoadingButton>
            </Row>
          </>
        )}
      </Jumbotron>
    </Container>
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
      <Container>
        <Spinner animation="border" />
      </Container>
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
    <Container>
      <Image alt="cassé" src={cassé} fluid />
      <Alert variant="danger">
        <Alert.Heading>Bien vu!</Alert.Heading>
        <p>Tu viens de trouver un bug dans notre application.</p>

        <hr />
        <p>
          <strong>Message destiné aux développeurs:</strong>
          <br />
          {error.message}
        </p>
      </Alert>
    </Container>
  )
}

const SupervisorLinks = () => {
  const history = useHistory()

  return (
    <NavDropdown
      title={
        <>
          <FontAwesomeIcon icon={faEye} /> <span>Supervisaire</span>
        </>
      }
      id="basic-nav-dropdown"
    >
      <NavDropdown.Item onClick={() => history.push("/pax")}>
        <FontAwesomeIcon icon={faUsers} /> Répertoire des pax
      </NavDropdown.Item>
      <NavDropdown.Item onClick={() => history.push("/presences")}>
        <FontAwesomeIcon icon={faCalendarCheck} /> Tableau des présences
      </NavDropdown.Item>
    </NavDropdown>
  )
}

const NavLinks = () => {
  const history = useHistory()
  const paxContext = useContext(PaxContext)

  return (
    <>
      <Nav.Link onClick={() => history.push("/")}>
        <FontAwesomeIcon icon={faUserClock} /> Ma présence
      </Nav.Link>
      {paxContext.doc?.isSupervisor && <SupervisorLinks />}
    </>
  )
}

const Content = () => {
  const { logout } = useAuth0()
  const {
    isLoading: isUserLoading,
    isAuthenticated: isUserAuthenticated,
    userData: userDoc,
    docRef: userDocRef,
  } = useUser()

  const userContextValue: TPaxContext = {
    isLoading: isUserLoading,
    doc: userDoc,
    ref: userDocRef,
  }

  return (
    <>
      <BrowserRouter>
        <PaxContext.Provider value={userContextValue}>
          <Navbar bg="dark" variant="dark" expand="lg">
            <Navbar.Brand href="#home">
              <span role="img" aria-label="rainbow">
                🌈
              </span>{" "}
              Coliv'app
            </Navbar.Brand>

            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Navbar.Collapse id="basic-navbar-nav">
              <Nav className="mr-auto">{userDoc && userDoc.state === PaxStates.Confirmed && <NavLinks />}</Nav>

              {isUserAuthenticated && (
                <NavDropdown
                  title={
                    <>
                      {userDoc?.picture && (
                        <Image width="32" alt="Selfie" thumbnail={false} roundedCircle src={userDoc?.picture} />
                      )}
                      <span className="ml-2">{userDoc ? userDoc.name : "NoName"}</span>
                    </>
                  }
                  id="basic-nav-dropdown"
                >
                  <NavDropdown.Item
                    onClick={async () => {
                      await firebase.auth().signOut()
                      logout({ returnTo: window.location.origin })
                    }}
                  >
                    <FontAwesomeIcon icon={faSignOutAlt} /> Logout
                  </NavDropdown.Item>
                </NavDropdown>
              )}
            </Navbar.Collapse>
          </Navbar>
          <br />
          <ErrorBoundary FallbackComponent={ErrorFallback}>
            {!isUserLoading && isUserAuthenticated ? <UserContent /> : <NoUserContent isUserLoading={isUserLoading} />}
          </ErrorBoundary>
        </PaxContext.Provider>
      </BrowserRouter>
    </>
  )
}

export default Content
