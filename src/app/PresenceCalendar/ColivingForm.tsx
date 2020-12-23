import admin from "firebase";
import { DateTime, Duration, Interval } from "luxon";
import { useEffect, useState } from "react";
import { Alert, Col, Row } from "react-bootstrap";
import Button from "react-bootstrap/Button";
import db from "../../db";
import firebase from "../../firebase_config";
import LoadingButton from "../Common/LoadingButton";
import "../Switch.css";
import { TCalendarContext } from "./MyPresenceCalendarTypes";
import TheCalendar from "./TheCalendar";

const ColivingForm = ({
  calendarContext,
  firstCalValue,
  onSubmit,
}: {
  calendarContext: TCalendarContext;
  firstCalValue: Date | null;
  onSubmit: () => void;
}) => {
  const currentUser = firebase.auth().currentUser!;
  console.assert(currentUser != null);

  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  const [interval, setInterval] = useState<null | Interval>(null);
  const [calValue, setCalValue] = useState<Date | Date[] | null>(
    firstCalValue ? firstCalValue : null
  );

  useEffect(() => {
    const twoDays = calValue as Date[];

    const arrivalDate = twoDays ? twoDays[0] : null;
    const departureDate = twoDays ? twoDays[1] : null;
    setInterval(
      !arrivalDate || !departureDate
        ? null
        : Interval.fromDateTimes(arrivalDate, departureDate)
    );
  }, [calValue]);

  const submitColivingRequest = async () => {
    if (!interval) {
      return;
    }
    const arrivalDate = interval.start;
    const departureDate = interval.end;

    setIsFormSubmitting(true);
    const oneDay = Duration.fromObject({ days: 1 });

    // Get all the days that contains the selected range
    var res: DateTime[] = [];
    var i = arrivalDate.plus({}); // clone
    while (i <= departureDate) {
      if (calendarContext.isDisabledDay(i)) {
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
    
    var batch = db.batch();
    
    res.forEach((r) => {
      batch.set(db.collection(`users/${currentUser.uid}/days`).doc(r.toISODate()), {
          on: r.toJSDate(),
          request: request_doc,
          status: "PENDING_REVIEW",
          kind: "COLIVING",
        });
    });

    await batch.commit()

    onSubmit();
  };

  const onChangeFct = (d: Date | Date[]) => {
    setCalValue(d as Date[]);
  };

  const numberOfNights = interval ? interval.count("days") - 1 : null;
  return (
    <>
      <Row>
        <Col>
          <TheCalendar
            calendarContext={calendarContext}
            isRangeMode={true}
            calValue={calValue}
            onChange={onChangeFct}
          />
        </Col>
      </Row>
      <br />
      <Row>
        <Col>
          <Alert variant="info">
            <span>
              {numberOfNights ? (
                <>You are going to stay for {numberOfNights} nights</>
              ) : (
                <>Pick your departure date</>
              )}
            </span>{" "}
            <Button variant="danger" onClick={() => onSubmit()}>
              Cancel
            </Button>{" "}
            <LoadingButton
              disabled={!numberOfNights || numberOfNights <= 0}
              variant="primary"
              onClick={submitColivingRequest}
              isLoading={isFormSubmitting}
            >
              Submit
            </LoadingButton>
          </Alert>
        </Col>
      </Row>
    </>
  );
};

export default ColivingForm;
