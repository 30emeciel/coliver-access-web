import React, { useCallback, useMemo, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Row from 'react-bootstrap/Row';
import Calendar, { CalendarTileProperties } from 'react-calendar'
import 'react-calendar/dist/Calendar.css';
import './Calendar.css'
import './Switch.css'
import {DateTime, Duration, Interval} from 'luxon';

import { Alert, Card, Col, Container, Dropdown, DropdownButton, Form, Modal } from 'react-bootstrap';
import Switch from "react-switch";
import db from '../db';
import admin from 'firebase'
import firebase from "../firebase_config"

const MyPresenceCalendar = () => {
  const [ isFirstTimer, setIsFirstTimer ] = useState(false)
  const [ isTestNotAvailable, setTestNotAvailable ] = useState(false)
  const [ isCoworkingMode, setIsCoworkingMode ] = useState(false)
  const [ isColivingMode, setIsColivingMode ] = useState(false)
  const [ show, setShow ] = useState(false)

    const [ isRangeMode, setIsRangeMode ] = useState(false)
    const [ pendingDays, setPendingDays ] = useState<Set<number>>(new Set())
    const [ disabledDay, setDisabledDay ] = useState<Set<DateTime>>(new Set())
    const [ calValue, setCalValue ] = useState<Date | Date[] | null>(null)

    
    const pendingDaysTiles =
      ({ activeStartDate, date, view } : CalendarTileProperties) => pendingDays.has(date.getTime()) ? 'reservation-pending' : ''

    const disabledTiles = 
      ({ activeStartDate, date, view } : CalendarTileProperties) => isTestNotAvailable ? (date.getDay() === 3 ? true : false) : (isFirstTimer ? date.getDay() !== 1 : false)

    const contentTiles = 
      ({ activeStartDate, date, view } : CalendarTileProperties) => isTestNotAvailable ? (date.getDay() === 3 ? <div>Sold out</div> : null) : null

    const onChangeFct = (d: Date|Date[]) => {
      console.log('Clicked day: ' + d.toString())
      if (!isCoworkingMode && !isColivingMode) {
        return
      }

      function onD(d: Date[], onlyAdd: boolean) {
        var new_value = new Set(pendingDays)            
        d.forEach(d2 => {
          
          if (!onlyAdd && new_value.has(d2.getTime())) {
        new_value.delete(d2.getTime())
      }
      else {
        new_value.add(d2.getTime())          
      }
      
          
        });
        
      setPendingDays(new_value)
      }

      if (d instanceof Date) {
        onD([d as Date], false)
      }
      else {
        const index = d[0]
        const end = d[1]
        const new_d = [];
        while (index <= end) {
          new_d.push(new Date(index))
          index.setDate(index.getDate() + 1)
        }
        
        onD(new_d, true)
        
       
      }
    
      
    }

    const submitColivingRequest = async () => {

      const start = DateTime.fromJSDate((calValue as Date[])[0])
      const end = DateTime.fromJSDate((calValue as Date[])[1])
      const oneDay = Duration.fromObject({"days": 1})
      var res : DateTime[] = []
      var i = start.plus({}); // clone
      while (i <= end) {
        if (disabledDay.has(i)) {
          continue
        }
        res.push(i);
        i = i.plus(oneDay);
      }

      console.log(res)
      
      // Get the `FieldValue` object
      const FieldValue = admin.firestore.FieldValue;

      const request_data = {
        created: FieldValue.serverTimestamp(),        
        status: "PENDING_REVIEW",
      }
      const currentUser = firebase.auth().currentUser!
      console.assert(currentUser != null)
      const request_doc = await db.collection(`users/${currentUser.uid}/requests`).add(request_data);
      res.forEach(r => {
        db.collection(`users/${currentUser.uid}/days`).doc(r.toISODate()).set({
          on: r.toJSDate(),
          request: request_doc,
          status: "PENDING_REVIEW",
          kind: "COLIVING"
        })
      })

    }

    const ColivingForm = () => {

      if ((calValue as Date[])[1] == null) {
        return <p>Pick your departure date.</p>
      }

      const d = Interval.fromDateTimes(
        DateTime.fromJSDate((calValue as Date[])[0]),
        DateTime.fromJSDate((calValue as Date[])[1]))
          .count("days") - 1
      return <>
        <span>You request to stay for {d} nights</span>
        {" "}
        <Button disabled={d <= 0} variant="primary" onClick={submitColivingRequest}>Submit</Button>
        </>

    }
    return <>
    
    <Container>
      <Row>
        <h1>My presence calendar</h1>
      </Row>
      <br />    
      <Row>
      <Alert variant="info">
        Click on the days you would like to book. 
        When ready, click <strong>Submit</strong> to send your request.
        Your request will be reviewed by the <strong>Participante role</strong> and you will received an email with the decision.<br />
        Some days may not be available if the gender equity is not reached or there is not anymore spot available.      
        </Alert>
        </Row>
        <Row>
        {isFirstTimer && 
        <Alert variant="warning">
          You are a new! Welcome 👋😀.
          For ease of integration, you recommand you to book a Coworking day on any Monday.
        </Alert>
        }
      </Row>
      <Row>
      <Calendar
        selectRange={isRangeMode}
        view="month"
        //showDoubleView 
        //showWeekNumbers
        showNeighboringMonth={false}
        tileClassName={pendingDaysTiles}
        tileDisabled={disabledTiles}
        tileContent={contentTiles}

        onClickDay={(d) => {
          if (!isCoworkingMode && !isColivingMode) {
            setCalValue(d);
            setShow(true)
        }}}
        value={calValue}
        onChange={(d) => {
          if (isCoworkingMode || isColivingMode) {
            setCalValue(d)
          }
        }}
        />
        </Row>
        <br />
        <Row>
        {isColivingMode && 
        <Alert variant="info">
          <ColivingForm />
        </Alert>
        }

        {isCoworkingMode &&
        <Alert variant="info">
          <Alert.Heading>Coworking</Alert.Heading>
          <p>You work!</p>
        </Alert>}  
      </Row>
        <Modal show={show} onHide={() => setShow(false)}>
        <Modal.Header closeButton>
          <Modal.Title>What would you like to book?</Modal.Title>
        </Modal.Header>
        <Modal.Body>Please select what would you like to book</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => {
            setIsCoworkingMode(true)
            //setIsRangeMode(true)
            setShow(false)
            }}>
            Coworking
          </Button>
          <Button variant="primary" onClick={() => {
            setIsColivingMode(true)
            setIsRangeMode(true)
            setShow(false)
            }}>
            Coliving
          </Button>
        </Modal.Footer>
      </Modal>
        
        <hr />
        <Row>
        <label>
          <span>First timer test</span>
          <Switch className="react-switch" checked={isFirstTimer} onChange={(checked) => {
            setIsFirstTimer(checked)
            if (checked) {
              setIsColivingMode(false)
            }
          }
          }/>
        </label>
        </Row>
        <Row>
         <label>
          <span>Range mode</span>
          <Switch className="react-switch" onChange={(checked) => {
            setCalValue(null)
            setIsRangeMode(checked)
            }} checked={isRangeMode}  />
        </label>
        </Row>

        <Row>
        <label>
          <span>Test Not available</span>
          <Switch className="react-switch" checked={isTestNotAvailable} onChange={(checked) => {
            setTestNotAvailable(checked)
          }
          }/>
        </label>
        </Row>
        <Row>
        <label>
          <span>Off</span>
          <Switch disabled={isFirstTimer} className="react-switch" onChange={(checked) => setIsCoworkingMode(checked)} checked={isCoworkingMode}
//              uncheckedIcon={false}
//              checkedIcon={false}
              onColor="#3F7FBF"
//              offColor="#32CD32"
           />
          <span>Coworking</span>
        </label>
        </Row>
        <Row>
        <label>
          <span>Off</span>
          <Switch disabled={isFirstTimer} className="react-switch" onChange={(checked) => setIsColivingMode(checked)} checked={isColivingMode}
//              uncheckedIcon={false}
//              checkedIcon={false}
              onColor="#3F7FBF"
//              offColor="#32CD32"
           />
          <span>Coliving</span>
        </label>
      </Row>

</Container>
  
      </>
}

export default MyPresenceCalendar
