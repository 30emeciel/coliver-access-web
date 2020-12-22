import { useState } from 'react';
import * as React from 'react';
import Button from 'react-bootstrap/Button';
import Row from 'react-bootstrap/Row';
import Toast from 'react-bootstrap/Toast'
import { useCollectionData } from 'react-firebase-hooks/firestore';
import db from '../db';
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css';
import './Calendar.css'
import { ButtonGroup, ToggleButton } from 'react-bootstrap';

type DocumentData = firebase.firestore.DocumentData;

const ExampleToast: React.FC<{}> = ({ children }) => {
  const [show, toggleShow] = useState(true);

  return (
    <>
      {!show && <Button onClick={() => toggleShow(true)}>Show Toast</Button>}
      <Toast show={show} onClose={() => toggleShow(false)}>
        <Toast.Header>
          <strong className="mr-auto">React-Bootstrap</strong>
        </Toast.Header>
        <Toast.Body>{children}</Toast.Body>
      </Toast>
    </>
  );
};

const TestDb = () => {

    const [ docs, loading, error ] = useCollectionData<DocumentData>(db.collection("days").orderBy("on", "asc"));

    return (
      (
        <>
          <div>
          
          {loading && <span>Collection: Loading...</span>}
          {error && <strong>Error getting data: {JSON.stringify(error)}</strong>}
          {docs && 
          <ul>
            {docs.map((day, index) =>
              <li key={index}>{new Intl.DateTimeFormat("fr-FR", {
                year: "numeric",
                month: "long",
                day: "2-digit"
              }).format(day.on.toDate())}</li>
            )}
          </ul>
          }
          </div>
          <div>
          <Button variant="primary" className="mr-1">
      Primary
    </Button>
    <Button variant="secondary" className="mr-1">
      Secondary
    </Button>
    <Button variant="success" className="mr-1">
      Success
    </Button>
    <Button variant="warning" className="mr-1">
      Warning
    </Button>
    <Button variant="danger" className="mr-1">
      Danger
    </Button>
    <Button variant="info" className="mr-1">
      Info
    </Button>
    <Button variant="light" className="mr-1">
      Light
    </Button>
    <Button variant="dark" className="mr-1">
      Dark
    </Button>
    <Button variant="link" className="mr-1">
      Link
    </Button>
    </div>
    <div>
      <ExampleToast>
      We now have Toasts
        <span role="img" aria-label="tada">
          🎉
        </span>
      </ExampleToast>      
    </div>
    <div>
      
    
                
    </div>
    </>
      )
    );
  };

export default TestDb;