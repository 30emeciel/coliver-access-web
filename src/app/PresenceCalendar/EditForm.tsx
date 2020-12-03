import admin from "firebase";
import { DateTime, Duration, Interval } from "luxon";
import React, { useEffect, useState } from "react";
import Button from "react-bootstrap/Button";
import db from "../../db";
import firebase from "../../firebase_config";
import "../Switch.css";

const EditForm = (
  {
    onClickDay,
    onSubmit,
  }:
  { 
    onClickDay: (d: Date) => void,
    onSubmit: () => void,
  }) => {
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  const [newDays, setNewDays] = useState(new Set<Date>());

  const submitColivingRequest = async () => {
  
  };
  
  return (
    <>
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
    </>
  );
  <p>Click on the days to add/remove days</p>;
};

export default EditForm;
