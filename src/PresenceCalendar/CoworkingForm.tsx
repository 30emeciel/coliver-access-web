import { useCallback, useEffect, useMemo, useState } from "react";
import Button from "react-bootstrap/Button";
import Row from "react-bootstrap/Row";
import "src/core/Switch.css";
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
import db from "src/core/db";
import admin from "firebase";
import firebase from "src/core/firebase_config";
import { useCollectionData } from "react-firebase-hooks/firestore";
import Spinner from "react-bootstrap/Spinner";
import TheCalendar from "./TheCalendar";
import { TCalendarContext } from "./MyPresenceCalendarTypes";
import LoadingButton from "src/core/LoadingButton";

type DocumentData = firebase.firestore.DocumentData;

const CoworkingForm = ({
  calendarContext,
  firstCalValue,
  onSubmit,
  onCancel,
}: {
  calendarContext: TCalendarContext;
  firstCalValue: Date;
  onSubmit: () => void;
  onCancel: () => void;
}) => {
  const currentUser = firebase.auth().currentUser!;
  console.assert(currentUser != null);

  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  const [calValue, setCalValue] = useState<Date>(firstCalValue);

  const submitForm = async () => {
    if (!calValue) {
      return;
    }
    setIsFormSubmitting(true);
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

    onSubmit()
  };

  return (
    <>
      <Row>
        <Col>
          <TheCalendar
            calendarContext={calendarContext}
            isRangeMode={false}
            calValue={calValue}
            onChange={(d) => {
              if (d instanceof Date) {
                setCalValue(d);
              }
            }}
          />
        </Col>
      </Row>
      <br />
      <Row>
        <Col>
          <Alert variant="info">
            <p>
              You would like to cowork with us on{" "}
              {DateTime.fromJSDate(calValue).toLocaleString(DateTime.DATE_FULL)}
            </p>
            <p className="mb-0">
            <Button variant="danger" onClick={onCancel}>
              Cancel
            </Button>{" "}
            <LoadingButton
              disabled={!calValue}
              variant="primary"
              onClick={submitForm}
              isLoading={isFormSubmitting}
            >
              Submit
            </LoadingButton>
            </p>
          </Alert>
        </Col>
      </Row>
    </>
  );
};

export default CoworkingForm;
