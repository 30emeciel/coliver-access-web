import React, { useCallback, useMemo, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Row from 'react-bootstrap/Row';
import Calendar, { CalendarTileProperties } from 'react-calendar'
import 'react-calendar/dist/Calendar.css';
import './Calendar.css'
import './Switch.css'

import { Alert, Card, Col, Container, Dropdown, DropdownButton, Form } from 'react-bootstrap';
import Switch from "react-switch";

const MyPresenceCalendar = () => {
  const [ isFirstTimer, setIsFirstTimer ] = useState(false)
  const [ isColivingMode, setIsColivingMode ] = useState(true)

    const [ isRangeMode, setIsRangeMode ] = useState(false)
    const [ pendingDays, setPendingDays ] = useState<Set<number>>(new Set())
    //const [ disabledDay, setDisabledDay ] = useState<null | Date>(null)
    const [ calValue, setCalValue ] = useState<Date | Date[] | null  | undefined >(null)

    
    const pendingDaysTilesMemo =
      ({ activeStartDate, date, view } : CalendarTileProperties) => pendingDays.has(date.getTime()) ? 'reservation-pending' : ''

    const disabledTiles = 
      ({ activeStartDate, date, view } : CalendarTileProperties) => isFirstTimer ? date.getDay() !== 1 : false

    const onChangeFct = (d: Date|Date[]) => {
      console.log('Clicked day: ' + d.toString())

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
        <hr />
        You may activate the "Range mode" to select multiple days at once.
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
        <label>
          <span>Coworking</span>
          <Switch disabled={isFirstTimer} className="react-switch" onChange={(checked) => setIsColivingMode(checked)} checked={isColivingMode}
              uncheckedIcon={false}
              checkedIcon={false}
              onColor="#3F7FBF"
              offColor="#32CD32"
           />
          <span>Coliving</span>
        </label>

      </Row>
      <Row>
        {isColivingMode &&
        <Alert variant="info">
          <Alert.Heading>Coliving</Alert.Heading>
          <p>You sleep! As a result, you need to book at least two consecutive days (arrival and departure days).</p>
        </Alert>}  
        {!isColivingMode &&
        <Alert variant="info">
          <Alert.Heading>Coworking</Alert.Heading>
          <p>You work!</p>
        </Alert>}  
      </Row>
      <Row>
      <Calendar
        selectRange={isRangeMode}
        view="month"
        //showDoubleView 
        //showWeekNumbers
        showNeighboringMonth={false}
        tileClassName={pendingDaysTilesMemo}
        tileDisabled={disabledTiles}

        value={calValue}
        onChange={onChangeFct}/>
        </Row>
        <br />
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
          <Form noValidate validated={true}>
          <Form.Group controlId="formGroupNights">
            <Form.Label>Number of selected nights</Form.Label>
            <Form.Control plaintext readOnly value={pendingDays.size}/>
            {pendingDays.size <= 1 && <Form.Control.Feedback type="invalid">Please select at least one night</Form.Control.Feedback>}
            {pendingDays.size > 31 && <Form.Control.Feedback type="invalid">You cannot book more than 31 nights at once</Form.Control.Feedback>}
            <Form.Control.Feedback type="invalid">Test</Form.Control.Feedback>
          </Form.Group>
          <Button disabled={pendingDays.size <= 0} variant="primary" type="submit">Submit</Button>
          </Form>
        </Row>
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

</Container>
  
      </>
}

export default MyPresenceCalendar
