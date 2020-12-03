import admin from "firebase";
import { DateTime, Duration, Interval } from "luxon";
import React, { useEffect, useState } from "react";
import { Alert, Row } from "react-bootstrap";
import Button from "react-bootstrap/Button";
import db from "../../db";
import firebase from "../../firebase_config";
import "../Switch.css";
import TheCalendar from "./TheCalendar";


const Normal = ({
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

  return (
    <>
    <Row>
      <TheCalendar
          daysLoading={daysLoading}
          pendingDays={pendingDays}
          isRangeMode={false}
        />
        </Row>
        
    </>
  );
};

export default Normal;
