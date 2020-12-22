import React, { useCallback, useEffect, useMemo, useState } from "react";
import Button from "react-bootstrap/Button";
import Row from "react-bootstrap/Row";
import "../Switch.css";
import { DateTime, Duration, Interval } from "luxon";
import { $enum } from "ts-enum-util";

import {
  Alert,
  ButtonGroup,
  Card,
  Col,
  Container,
  Dropdown,
  DropdownButton,
  Modal,
  ToggleButton,
} from "react-bootstrap";
import Switch from "react-switch";
import db from "../../db";
import admin from "firebase";
import firebase from "../../firebase_config";
import { useCollectionData } from "react-firebase-hooks/firestore";
import Spinner from "react-bootstrap/Spinner";
import TheCalendar from "./TheCalendar";
import { TCalendarContext } from "./MyPresenceCalendarTypes";

type DocumentData = firebase.firestore.DocumentData;

const CoworkingForm = ({
  calendarContext,
}: {
  calendarContext: TCalendarContext
}) => {

  const currentUser = firebase.auth().currentUser!;
  console.assert(currentUser != null);

  const [isFormSubmitting, setIsColivingFormSubmitting] = useState(
    false
  );
  const [calValue, setCalValue] = useState<undefined|Date>()


  const submitForm = async () => {
    if (!calValue) {
        return
    }
    setIsColivingFormSubmitting(true);
    const start = DateTime.fromJSDate(calValue);


    // Submit the list of days to firestore
    const FieldValue = admin.firestore.FieldValue;

    const request_data = {
      created: FieldValue.serverTimestamp(),
      status: "PENDING_REVIEW",
    };
    const request_doc = await db
      .collection(`users/${currentUser.uid}/requests`)
      .add(request_data);
    await db
        .collection(`users/${currentUser.uid}/days`)
        .doc(start.toISODate())
        .set({
          on: start.toJSDate(),
          request: request_doc,
          status: "PENDING_REVIEW",
          kind: "COWORKING",
        });
    
    // When all done, reset the UI
    //        setAppState(AppStates.Normal)
    //        setCalValue(null);
    //setIsFormSubmitting(false);
  };
  
  return (
    <>
    <Row>
    <TheCalendar
          calendarContext={calendarContext}
          isRangeMode={false}
          calValue={calValue}
          onChange={(d) => {
            if (d instanceof Date) {
              setCalValue(d)
            }
          }}          
        />
        </Row>
        <Row>
          <Alert variant="info">
    <span>Pick the date you would like to cowork with us</span>
      {" "}
      {isFormSubmitting ? (
        <Button disabled variant="primary">
          Loading...
        </Button>
      ) : (
        <Button
          disabled={!calValue}
          variant="primary"
          onClick={submitForm}
        >
          Submit
        </Button>
      )}
      </Alert>
      </Row>
    </>
  );
};

export default CoworkingForm;
