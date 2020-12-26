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
import { Jumbotron, Spinner } from "react-bootstrap";
import LoadingButton from "src/core/LoadingButton";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSignInAlt, faUserPlus } from "@fortawesome/free-solid-svg-icons";

const NoUserContent = ({isUserLoading}:{isUserLoading:boolean}) => {
  const {
    loginWithRedirect,
  } = useAuth0();

  return <Container>
  <Jumbotron>
    <h1 className="header">Bienvenue sur l'appli Coliv du 30ème Ciel</h1>
    <h2 className="header">
      L'application de gestion des présences au 30ème Ciel. Fait avec ❤.
    </h2>
    <hr />
    <br />
    { isUserLoading ? <Row className="justify-content-md-center"><Spinner animation="grow"/></Row> :  <>
    <Row className="justify-content-md-center" lg={2}>
    <LoadingButton
      variant="success"
      isLoading={false}
      onClick={() => loginWithRedirect(/*auth0_options*/)}
    >
      <FontAwesomeIcon icon={faSignInAlt}/> Me connecter avec mon compte PaxID
    </LoadingButton>    
    </Row>    
    <br />
    <Row className="justify-content-md-center" lg={2}>
    <LoadingButton      
      isLoading={false}
    >
      <FontAwesomeIcon icon={faUserPlus}/> Je suis nouveau, je veux créer mon compte PaxID
    </LoadingButton>
    </Row>
    </>
}
  </Jumbotron>
</Container>
}

const UserContent = ({user}:{user:User}) => {
  if (user.state === UserStates.Confirmed) {
    return  <div>OK</div>
  }
  else {
    return <OnBoarding user={user}/>
  }
}

const Content = () => {
  const { logout } = useAuth0();
  const [isUserLoading, user] = useUser()

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
        { (user && user.state === UserStates.Confirmed) && <>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />        
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="mr-auto">
            <Nav.Link href="#home">Reservation</Nav.Link>
            <Nav.Link href="#link">Contribute</Nav.Link>
          </Nav>
          <NavDropdown title="Alyosha" id="basic-nav-dropdown">
            <NavDropdown.Item href="#action/3.1">Profile</NavDropdown.Item>
            <NavDropdown.Item href="#action/3.2">
              Another action
            </NavDropdown.Item>
            <NavDropdown.Item href="#action/3.3">Something</NavDropdown.Item>
            <NavDropdown.Divider />
            <NavDropdown.Item
              onClick={() => {
                firebase.auth().signOut();
                logout({ returnTo: window.location.origin });
              }}
            >
              Logout
            </NavDropdown.Item>
          </NavDropdown>           
        </Navbar.Collapse>
        </>
        }
      </Navbar>
      <br />
      { user ? <UserContent user={user}/> : <NoUserContent isUserLoading={isUserLoading}/>} 
    </div>
  );
}

export default Content;
