import Container from "react-bootstrap/Container"
import Row from "react-bootstrap/Row"

import Navbar from "react-bootstrap/Navbar"
import Nav from "react-bootstrap/Nav"
import NavDropdown from "react-bootstrap/NavDropdown"
import Form from "react-bootstrap/Form"
import LogoutButton from '../LogoutButton';
import Col from 'react-bootstrap/Col';
import MyPresenceCalendar from './PresenceCalendar/MyPresenceCalendar'
import { useAuth0 } from "@auth0/auth0-react";
import firebase from "../firebase_config";


function Content() {
  const { logout } = useAuth0();

    return <div><Navbar bg="dark" variant="dark" expand="lg">
  <Navbar.Brand href="#home">30ème Ciel <span role="img" aria-label="rainbow">🌈</span> Coliv'app</Navbar.Brand>
  <Navbar.Toggle aria-controls="basic-navbar-nav" />
  <Navbar.Collapse id="basic-navbar-nav">
    <Nav className="mr-auto">
      <Nav.Link href="#home">Reservation</Nav.Link>
      <Nav.Link href="#link">Contribute</Nav.Link>      
    </Nav>
    <NavDropdown title="Alyosha" id="basic-nav-dropdown">
        <NavDropdown.Item href="#action/3.1">Profile</NavDropdown.Item>
        <NavDropdown.Item href="#action/3.2">Another action</NavDropdown.Item>
        <NavDropdown.Item href="#action/3.3">Something</NavDropdown.Item>
        <NavDropdown.Divider />
        <NavDropdown.Item onClick={() => {
    firebase.auth().signOut();
    logout({ returnTo: window.location.origin });        
  }}>Logout</NavDropdown.Item>
      </NavDropdown>
    
  </Navbar.Collapse>
  </Navbar>
  <Container fluid>
    <br />
      <Row><Col><MyPresenceCalendar/></Col></Row></Container></div>
  
}

export default Content