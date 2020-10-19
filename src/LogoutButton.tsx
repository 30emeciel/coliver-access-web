import React from 'react';
import { useAuth0 } from "@auth0/auth0-react";
import firebase from "./firebase_config";
import Button from "react-bootstrap/Button"


function LogoutButton() {
    
  const { logout } = useAuth0();
  
  return <Button onClick={() => {
    firebase.auth().signOut();
    logout({ returnTo: window.location.origin });        
  }}>
    Log Out
  </Button>
}

export default LogoutButton