import React, { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Row from 'react-bootstrap/Row';
import Toast from 'react-bootstrap/Toast'
import { useCollectionData } from 'react-firebase-hooks/firestore';
import db from '../db';
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css';
import './Calendar.css'
import { ButtonGroup, ToggleButton } from 'react-bootstrap';


const MyPresenceCalendar = () => {
    const [ isRangeMode, setIsRangeMode ] = useState(false)
    const [ calValue, setCalValue ] = useState<Date[] | Date | null>(null)

    return <>
    <Calendar
        selectRange={isRangeMode}
        view="month"
//        showDoubleView 
          showNeighboringMonth={false}
        tileDisabled={({activeStartDate, date, view }) => date.getDay() === 0}
        tileClassName={({ activeStartDate, date, view }) => view === 'month' && date.getDay() === 3 ? 'wednesday' : null}
        value={calValue}
        onChange={setCalValue}
        onClickDay={d => console.log('Clicked day: ' + d.toString())}
         />
         <ButtonGroup toggle className="mb-2">
        <ToggleButton
          type="checkbox"
          //variant="secondary"
          checked={isRangeMode}
          value="1"
          
          onChange={(e) => {            
            setIsRangeMode(e.currentTarget.checked);
          }
          }
        >
          {isRangeMode && <strong>Range mode</strong>}
          {!isRangeMode && <strong>Single mode</strong>}
        </ToggleButton>
      </ButtonGroup>
      </>
}

export default MyPresenceCalendar
