import admin from "firebase";
import { DateTime, Duration, Interval } from "luxon";
import { useEffect, useState } from "react";
import { Alert, Row, Spinner } from "react-bootstrap";
import Button from "react-bootstrap/Button";
import { useDocumentDataOnce, useDocumentOnce } from "react-firebase-hooks/firestore";
import db from "../../db";
import firebase from "../../firebase_config";
import LoadingButton from "../Common/LoadingButton";
import "../Switch.css";
import { TCalendarContext } from "./MyPresenceCalendarTypes";
import TheCalendar from "./TheCalendar";

type DocumentData = firebase.firestore.DocumentData;


const CancelationForm = ({
  calendarContext,
  calValue,
  onSubmit,
  onCancel,
}: {
  calendarContext: TCalendarContext,
  calValue: Date,
  onSubmit: () => void,
  onCancel: () => void,
}) => {
  const currentUser = firebase.auth().currentUser!
  console.assert(currentUser != null)

  const [isFormSubmitting, setIsFormSubmitting] = useState(false)
  const docDayRef = firebase.firestore().doc(`users/${currentUser.uid}/days/${DateTime.fromJSDate(calValue).toISODate()}`)
  const [dayDoc, dayDocLoading, dayDocError] = useDocumentDataOnce<DocumentData>(docDayRef)
  const [requestSnap, requestSnapLoading, requestSnapError] = useDocumentOnce(dayDoc?.request)
  
  const [isFormLoading, setIsFormLoading] = useState(false)

  useEffect(() => {
    setIsFormLoading(dayDocLoading || requestSnapLoading)
  }, [dayDocLoading, requestSnapLoading, setIsFormLoading])

  const submitForm = async () => {

    setIsFormSubmitting(true);
    // Submit the list of days to firestore
    const FieldValue = admin.firestore.FieldValue;

    var batch = db.batch();
    const request_ref = db.doc(`users/${currentUser.uid}/requests/${requestSnap.id}`)
    batch.delete(request_ref)

    const daysQuerySnap = await db
      .collection(`users/${currentUser.uid}/days`)
      .where("request", "==", requestSnap.ref).get()
    
    daysQuerySnap.forEach((docSnap) => {
      batch.delete(docSnap.ref)
    })

    await batch.commit()

    // When all done, reset the UI
    setIsFormSubmitting(false);
    onSubmit();
  };

  const Form = () => {
    return <>
    <Alert variant="info">
      <p>        
        Would you like to cancel the reservation {!requestSnap ? <Spinner animation="border"/> : <strong>{requestSnap?.id}</strong>}?
      </p>
      <p className="mb-0">
        <Button
          variant="danger"
          onClick={onCancel}>Cancel</Button>
        {' '}
        <LoadingButton
          variant="primary"
          onClick={submitForm}
          isLoading={isFormSubmitting}
          disabled={isFormLoading}>Confirm</LoadingButton>        
        </p>
      </Alert>
      
    </>
  }
 
  return (
    <>
    <Row>
      <TheCalendar
          calendarContext={calendarContext}          
          isRangeMode={false}
          calValue={calValue}
        />
    </Row>
    <Row>
      <Form/>
    </Row>
    </>
  );
};

export default CancelationForm;
