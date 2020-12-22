import admin from "firebase";
import { DateTime, Duration, Interval } from "luxon";
import React, { useEffect, useState } from "react";
import { Row } from "react-bootstrap";
import Button from "react-bootstrap/Button";
import db from "../../db";
import firebase from "../../firebase_config";
import "../Switch.css";
import { TCalendarContext } from "./MyPresenceCalendarTypes";
import TheCalendar from "./TheCalendar";

enum EditActions {
  Add,
  Remove,
}

const EditForm = ({
  calendarContext,
}: {
  calendarContext: TCalendarContext;
  }) => {
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
    
  const [listEditDays, setListEditDays] = useState(new Map<DateTime, EditActions>());

  const onClickDay = (d:Date) => {
    let dt = DateTime.fromJSDate(d)
    let action = listEditDays.get(dt)
    if (action) {
      listEditDays.delete(dt)    
    }
    else {
      listEditDays.set(dt, calendarContext.userDays.has(dt) ? EditActions.Remove : EditActions.Add)
    }
  }

  const submitColivingRequest = async () => {
  
  };
  
  return (
    <>
    <Row>
    <TheCalendar
          calendarContext={calendarContext}
          isRangeMode={false}     
          onClickDay={onClickDay}     
        />
        </Row>
        <Row>
      <span>Click on the dates you want to add or remove</span>{" "}
      {isFormSubmitting ? (
        <Button disabled variant="primary">
          Loading...
        </Button>
      ) : (
        <Button
          
          variant="primary"
          onClick={submitColivingRequest}
        >
          Submit
        </Button>
      )}
      </Row>
    </>
  );  
};

export default EditForm;
