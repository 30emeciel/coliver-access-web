import admin from "firebase";
import { DateTime, Duration, Interval } from "luxon";
import React, { useEffect, useState } from "react";
import { Row } from "react-bootstrap";
import Button from "react-bootstrap/Button";
import db from "../../db";
import firebase from "../../firebase_config";
import "../Switch.css";

const EditForm = (
  daysLoading,
  pendingDays,
  disabledDays
}: {
  daysLoading: boolean;
  pendingDays: Set<number>;
  disabledDays: Set<DateTime>;
  }) => {
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  const [newDays, setNewDays] = useState(new Set<Date>());

  const submitColivingRequest = async () => {
  
  };
  
  return (
    <>
    <Row>
    <TheCalendar
          daysLoading={daysLoading}
          pendingDays={pendingDays}
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
  <p>Click on the days to add/remove days</p>;
};

export default EditForm;
