import admin from "firebase";
import { DateTime, Duration, Interval } from "luxon";
import React, { useEffect, useState } from "react";
import { Alert, Row } from "react-bootstrap";
import Button from "react-bootstrap/Button";
import db from "../../db";
import firebase from "../../firebase_config";
import "../Switch.css";
import TheCalendar from "./TheCalendar";


const ColivingForm = ({
  daysLoading,
  pendingDays,
  disabledDays,
  onSubmit,
}: {
  daysLoading: boolean,
  pendingDays: Set<number>,
  disabledDays: Set<DateTime>,
  onSubmit: () => void,
}) => {
  const currentUser = firebase.auth().currentUser!
  console.assert(currentUser != null)

  const [isFormSubmitting, setIsFormSubmitting] = useState(false)
  const [interval, setInterval] = useState<null | Interval>(null)
  const [calValue, setCalValue] = useState<Date[] | undefined>();

  useEffect(() => {

    const twoDays = calValue as Date[]
    
    const arrivalDate = twoDays ? twoDays[0] : null
    const departureDate = twoDays ? twoDays[1] : null
    setInterval(
      !arrivalDate || !departureDate
        ? null
        : Interval.fromDateTimes(arrivalDate, departureDate)
    );
  }, [calValue])

  const submitColivingRequest = async () => {

    if (!interval) {
      return;
    }
    const arrivalDate = interval.start
    const departureDate = interval.end

    setIsFormSubmitting(true);
    const oneDay = Duration.fromObject({ days: 1 })

    // Get all the days that contains the selected range
    var res: DateTime[] = [];
    var i = arrivalDate.plus({}); // clone
    while (i <= departureDate) {
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
    setIsFormSubmitting(false);
    onSubmit();
  };

  const onChangeFct = (d:Date | Date[]) => {
    setCalValue(d as Date[]);  
  }

  const numberOfNights = interval ? interval.count("days") - 1 : null;
  return (
    <>
    <Row>
      <TheCalendar
          daysLoading={daysLoading}
          pendingDays={pendingDays}
          isRangeMode={true}
          calValue={calValue}
          onChange={onChangeFct}          
        />
        </Row>
        <Row>
                    <Alert variant="info">
      <span>
        {numberOfNights ? (
          <>You are going to stay for {numberOfNights} nights</>
        ) : (
          <>Pick your departure date</>
        )}
      </span>{" "}
      {isFormSubmitting ? (
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
      </Alert>
      </Row>
    </>
  );
};

export default ColivingForm;
