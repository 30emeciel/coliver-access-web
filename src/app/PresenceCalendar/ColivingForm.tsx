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
  Form,
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

type DocumentData = firebase.firestore.DocumentData;

const ColivingForm = ({
  arrivalDate,
  departureDate,
  disabledDays,
  onSubmit
}: {
  arrivalDate: Date|null;
  departureDate: Date|null;
  disabledDays: Set<DateTime>;
  onSubmit: () => void;
}) => {

  const currentUser = firebase.auth().currentUser!;
  console.assert(currentUser != null);

  const [isColivingFormSubmitting, setIsColivingFormSubmitting] = useState(
    false
  );
  const [interval, setInterval] = useState<null|Interval>(null)

  useEffect(() => {
      setInterval(!arrivalDate || !departureDate ? null : Interval.fromDateTimes(arrivalDate, departureDate))      
  }, [arrivalDate, departureDate])

  const submitColivingRequest = async () => {
    if (!arrivalDate || !departureDate) {
        return
    }
    setIsColivingFormSubmitting(true);
    const start = DateTime.fromJSDate(arrivalDate);

    const end = DateTime.fromJSDate(departureDate);
    const oneDay = Duration.fromObject({ days: 1 });

    // Get all the days that contains the selected range
    var res: DateTime[] = [];
    var i = start.plus({}); // clone
    while (i <= end) {
      if (disabledDays.has(i)) {
        continue;
      }
      res.push(i);
      i = i.plus(oneDay);
    }

    // Submit the list of days to firestore
    const FieldValue = admin.firestore.FieldValue;

    const request_data = {
      created: FieldValue.serverTimestamp(),
      status: "PENDING_REVIEW",
    };
    const request_doc = await db
      .collection(`users/${currentUser.uid}/requests`)
      .add(request_data);
    const promise_arr = res.map((r) => {
      return db
        .collection(`users/${currentUser.uid}/days`)
        .doc(r.toISODate())
        .set({
          on: r.toJSDate(),
          request: request_doc,
          status: "PENDING_REVIEW",
          kind: "COLIVING",
        });
    });

    await Promise.all(promise_arr);

    // When all done, reset the UI    
    setIsColivingFormSubmitting(false);
    onSubmit();
  };
  
  const numberOfNights = interval ? interval.count("days") - 1 : null;
  return (
    <>
    <span>
      {numberOfNights ? <>You are going to stay for {numberOfNights} nights</> : <>Pick your departure date</>}
      </span>
      {" "}
      {isColivingFormSubmitting ? (
        <Button disabled variant="primary">
          Loading...
        </Button>
      ) : (
        <Button
          disabled={!numberOfNights || numberOfNights <= 0}
          variant="primary"
          onClick={submitColivingRequest}
        >
          Submit
        </Button>
      )}
    </>
  );
};

export default ColivingForm;
