import React, { useEffect } from 'react';
//import logo from './logo.svg';
import { useAuth0 } from "@auth0/auth0-react";
import { useAuthState } from 'react-firebase-hooks/auth';
import firebase from "./firebase_config";
import axios from 'axios';
import Container from "react-bootstrap/Container"
import Row from "react-bootstrap/Row"
import Button from "react-bootstrap/Button"
import Jumbotron from 'react-bootstrap/Jumbotron';
import Content from './app/Content';




const auth0_options = {
  "scope": "openid profile email"
  }


const LoginButton = () => {
  const { isAuthenticated, isLoading } = useAuth0();
  const [ firebaseAuthUser, firebaseAuthIsloading, ] = useAuthState(firebase.auth());
  const { loginWithRedirect } = useAuth0();

  if ((isAuthenticated && !firebaseAuthUser) || isLoading || firebaseAuthIsloading) {
    return <Button disabled>Loading...</Button>;
  }
  return <Button onClick={() => loginWithRedirect(auth0_options)}>Log In</Button>;  

};



function App() {

  const { user, isAuthenticated, getAccessTokenSilently} = useAuth0();
  const [ firebaseAuthUser,, firebaseAuthError ] = useAuthState(firebase.auth());

  useEffect(() => {
    if (!user) {
      return
    }
    getAccessTokenSilently(auth0_options)
    .then((auth0_token) => axios.post("https://europe-west3-trentiemeciel.cloudfunctions.net/create_session", {access_token: auth0_token}))
    .then((exchange_token_response) => firebase.auth().signInWithCustomToken(exchange_token_response.data.firebase_token))

  }, [user, getAccessTokenSilently])

  if (!isAuthenticated || !firebaseAuthUser) {
    return <Container>
        <Jumbotron>
          <h1 className="header">Welcome To 30ème Ciel app</h1>
          <h2 className="header">Here you can manage your presence, see budget, manage events... </h2>
          <hr />      
          <LoginButton />
          { firebaseAuthError && <div>Error with Firebase Auth: {JSON.stringify(firebaseAuthError)}</div>}    
        </Jumbotron>
      </Container>
  }
  else {
    return <Content/>
  }
}

export default App;
