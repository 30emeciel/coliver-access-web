import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";

import Navbar from "react-bootstrap/Navbar";
import Nav from "react-bootstrap/Nav";
import NavDropdown from "react-bootstrap/NavDropdown";
import Form from "react-bootstrap/Form";
import Col from "react-bootstrap/Col";
import MyPresenceCalendar from "../PresenceCalendar/MyPresenceCalendar";
import { useAuth0 } from "@auth0/auth0-react";
import firebase from "src/core/firebase_config";
import OnBoarding from "../OnBoarding/OnBoarding";
import useUser, { User, UserStates } from "src/core/useUser";
import { Alert, Image, Jumbotron, Spinner } from "react-bootstrap";
import LoadingButton from "src/core/LoadingButton";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSignInAlt, faUserPlus } from "@fortawesome/free-solid-svg-icons";
import glb from "src/core/glb";
import { ErrorBoundary } from "react-error-boundary";
import cassé from "./cassé.jpg"
import { useEffect } from "react";

const NoUserContent = ({ isUserLoading }: { isUserLoading: boolean }) => {
  const { loginWithRedirect } = useAuth0();

  return (
    <Container>
      <Jumbotron>
        <h1 className="header">Bienvenue sur l'appli Coliv du 30ème Ciel</h1>
        <h2 className="header">
          L'application de gestion des présences du 30ème Ciel. Fait avec ❤.
        </h2>
        <hr />
        <br />
        {isUserLoading ? (
          <Row className="justify-content-md-center">
            <Spinner animation="grow" />
          </Row>
        ) : (
          <>
            <Row className="justify-content-md-center" lg={2}>
              <LoadingButton
                variant="success"
                isLoading={false}
                onClick={() => loginWithRedirect(/*auth0_options*/)}
              >
                <FontAwesomeIcon icon={faSignInAlt} /> Me connecter avec mon
                compte PaxID
              </LoadingButton>
            </Row>
            <br />
            <Row className="justify-content-md-center" lg={2}>
              <LoadingButton isLoading={false}>
                <FontAwesomeIcon icon={faUserPlus} /> Je suis nouveau, je veux
                créer mon compte PaxID
              </LoadingButton>
            </Row>
          </>
        )}
      </Jumbotron>
    </Container>
  );
};

const UserContent = () => {
  const user = glb.user;
  if (!user) {
    throw Error("user is empty!");
  }

  if (user.state === UserStates.Confirmed) {
    return <MyPresenceCalendar />;
  } else {
    return <OnBoarding />;
  }
};

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
  );
};

const Content = () => {
  const { logout } = useAuth0();
  const {
    isLoading: isUserLoading,
    isAuthenticated,
    userDetails: user,
    docRef: userDocRef,
  } = useUser();

  useEffect(() => {
    if (isUserLoading) {
      return
    }
    glb.user = user
  }, [user, isUserLoading])

  useEffect(() => {
    glb.ref = userDocRef
  }, [userDocRef])

  useEffect(() => {
    glb.isLoading = isUserLoading
  }, [isUserLoading])

  return (
    <div>
      <Navbar bg="dark" variant="dark" expand="lg">
        <Navbar.Brand href="#home">
          30ème Ciel{" "}
          <span role="img" aria-label="rainbow">
            🌈
          </span>{" "}
          Coliv'app
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="mr-auto">
            {user && user.state === UserStates.Confirmed && (
              <>
                <Nav.Link href="#home">Reservation</Nav.Link>
                <Nav.Link href="#link">Contribute</Nav.Link>
              </>
            )}
          </Nav>

          {isAuthenticated && (
            <NavDropdown
              title={
                <>
                  {user?.picture && <Image
                    width="32"
                    alt="Selfie"
                    thumbnail={false}
                    roundedCircle
                    src={user?.picture}
                  />
                  }
                  <span className="ml-2">Alyosha</span>
                </>
              }
              id="basic-nav-dropdown"
            >
              <NavDropdown.Item
                onClick={async () => {                  
                    await firebase.auth().signOut();
                    logout({ returnTo: window.location.origin });
                }}
              >
                Logout
              </NavDropdown.Item>
            </NavDropdown>
          )}
        </Navbar.Collapse>
      </Navbar>
      <br />
      <ErrorBoundary
        FallbackComponent={ErrorFallback}        
      >{!isUserLoading && isAuthenticated ? (
        <UserContent />
      ) : (
        <NoUserContent isUserLoading={isUserLoading} />
      )}
      </ErrorBoundary>
    </div>
  );
};

export default Content;
