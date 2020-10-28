import React, { useEffect, useState } from 'react';
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
  return <Button onClick={() => loginWithRedirect(auth0_options)}>Continue with 30ème Ciel SSO</Button>;  

};



function App() {

  const { user, isAuthenticated, getAccessTokenSilently} = useAuth0();
  const [ firebaseAuthUser, firebaseLoading, firebaseAuthError ] = useAuthState(firebase.auth());
  const [ auth0Token, setAuth0Token ] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      return
    }
    getAccessTokenSilently(auth0_options)
    .then((auth0_token) => setAuth0Token(auth0_token))

  }, [user, getAccessTokenSilently])

  useEffect(() => {
    if (firebaseLoading) {
      //wait firebase to be ready
      return
    }

    if (firebaseAuthUser) {
      // if user is already authenticated, nothing to do
      return
    }

    if (!user || !auth0Token) {
      //auth0 not ready yet, stop here and wait
      return
    }

    // exchange auth0 token to firebase auth token
    axios
      .post("https://europe-west3-trentiemeciel.cloudfunctions.net/create_session", {access_token: auth0Token})
      .then((exchange_token_response) => firebase.auth().signInWithCustomToken(exchange_token_response.data.firebase_token))
    
  }, [firebaseAuthUser, firebaseLoading, user, auth0Token])

  if (!isAuthenticated || !firebaseAuthUser) {
    return <Container>
        <Jumbotron>
          <h1 className="header">Welcome To 30ème Ciel Coliv'app</h1>
          <h2 className="header">Here you can manage your presence to the Coliving and Coworking and contribute to the project</h2>
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
