import React, { useCallback, useEffect, useMemo, useState } from "react";
import Button from "react-bootstrap/Button";
import Row from "react-bootstrap/Row";
import "../Switch.css";
import { DateTime, Duration, Interval } from "luxon";

import {
  Alert,
  Card,
  Col,
  Container,
  Dropdown,
  DropdownButton,
  Form,
  Modal,
} from "react-bootstrap";
import Switch from "react-switch";
import db from "../../db";
import admin from "firebase";
import firebase from "../../firebase_config";
import { useCollectionData } from "react-firebase-hooks/firestore";
import Spinner from "react-bootstrap/Spinner";
import TheCalendar from "./TheCalendar";

type DocumentData = firebase.firestore.DocumentData;

const MyPresenceCalendar = () => {
  const currentUser = firebase.auth().currentUser!;
  console.assert(currentUser != null);

  /******************************************************************************************************************
   * States
   *****************************************************************************************************************/
  const [isFirstTimer, setIsFirstTimer] = useState(false);
  const [isTestNotAvailable, setTestNotAvailable] = useState(false);
  const [isCoworkingMode, setIsCoworkingMode] = useState(false);
  const [isColivingMode, setIsColivingMode] = useState(false);
  const [isColivingFormSubmitting, setIsColivingFormSubmitting] = useState(
    false
  );
  const [days, daysLoading, daysError] = useCollectionData<DocumentData>(
    db.collection(`users/${currentUser.uid}/days`).orderBy("on", "asc")
  );


  const [isRangeMode, setIsRangeMode] = useState(false);
  
  const [disabledDay, setDisabledDay] = useState<Set<DateTime>>(new Set());
  const [calValue, setCalValue] = useState<Date | Date[] | null>(null);

  const [showEmptyDayModal, setShowEmptyDayModal] = useState(false);
  const [showBusyDayModal, setShowBusyDayModal] = useState(false);

  
  const [pendingDays, setPendingDays] = useState<Set<number>>(new Set());
  

  useEffect(() => {
    if (!days) {
      return;
    }
    const pendingDays = days
      .filter((day) => day.status === "PENDING_REVIEW")
      .map((day) => {
        return new Date(day.on.seconds * 1000).getTime();
      });
    setPendingDays(new Set(pendingDays));
  }, [days, setPendingDays]);

  /******************************************************************************************************************
   * Functions
   *****************************************************************************************************************/

   const submitColivingRequest = async () => {
    setIsColivingFormSubmitting(true);
    const start = DateTime.fromJSDate((calValue as Date[])[0]);
    const end = DateTime.fromJSDate((calValue as Date[])[1]);
    const oneDay = Duration.fromObject({ days: 1 });
    
    // Get all the days that contains the selected range
    var res: DateTime[] = [];
    var i = start.plus({}); // clone
    while (i <= end) {
      if (disabledDay.has(i)) {
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
    setIsColivingMode(false);
    setIsRangeMode(false);
    setCalValue(null);
    setIsColivingFormSubmitting(false);
  };



  /******************************************************************************************************************
   * Inner Components
   *****************************************************************************************************************/

  const Title = () => {
    return (
      <Row>
        <h1>My presence calendar</h1>
      </Row>
    );
  };

  const Intro = () => {
    return (
      <Row>
        <Alert variant="info">
          Click on a day you would like to book. Your request will be reviewed
          by the <strong>Participante role</strong> and you will received an
          email with the decision.
          <br />
          Some days may not be available if the gender equity is not reached or
          there is not anymore spot available.
        </Alert>
      </Row>
    );
  };

  const FirstTimerIntro = () => {
    return (
      <Row>
        <Alert variant="warning">
          You are a new! Welcome 👋😀. For ease of integration, you recommand
          you to book a Coworking day on any Monday.
        </Alert>
      </Row>
    );
  };

  const ColivingForm = () => {
    if ((calValue as Date[])[1] == null) {
      return <p>Pick your departure date.</p>;
    }

    const d =
      Interval.fromDateTimes(
        DateTime.fromJSDate((calValue as Date[])[0]),
        DateTime.fromJSDate((calValue as Date[])[1])
      )      
      .count("days") - 1;
    return (
      <>
        <span>You are going to stay for {d} nights</span>{" "}
        {isColivingFormSubmitting ? (
          <Button disabled variant="primary">
            Loading...
          </Button>
        ) : (
          <Button
            disabled={d <= 0}
            variant="primary"
            onClick={submitColivingRequest}
          >
            Submit
          </Button>
        )}
      </>
    );
  };


  const EmptyDayModal = () => {
    return (
      <Modal
        show={showEmptyDayModal}
        onHide={() => setShowEmptyDayModal(false)}
      >
        <Modal.Header closeButton>
          <Modal.Title>What would you like to book?</Modal.Title>
        </Modal.Header>
        <Modal.Body>Please select what would you like to book</Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setIsCoworkingMode(true);
              //setIsRangeMode(true)
              setShowEmptyDayModal(false);
            }}
          >
            Coworking
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setIsColivingMode(true);
              setIsRangeMode(true);
              setShowEmptyDayModal(false);
            }}
          >
            Coliving
          </Button>
        </Modal.Footer>
      </Modal>
    );
  };

  const OccupiedDayModal = () => {
    return (
      <Modal show={showBusyDayModal} onHide={() => setShowBusyDayModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>What would you like to do?</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Button
            variant="secondary"
            onClick={() => {
              setIsCoworkingMode(true);
              //setIsRangeMode(true)
              setShowEmptyDayModal(false);
            }}
          >
            Cancel reservation
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setIsColivingMode(true);
              setIsRangeMode(true);
              setShowEmptyDayModal(false);
            }}
          >
            Add/remove days
          </Button>
        </Modal.Body>
      </Modal>
    );
  };
  

  const DevRows = () => {
    return (
      <>
        <Row>
          <label>
            <span>First timer test Meriem</span>
            <Switch
              className="react-switch"
              checked={isFirstTimer}
              onChange={(checked) => {
                setIsFirstTimer(checked);
                if (checked) {
                  setIsColivingMode(false);
                }
              }}
            />
          </label>
        </Row>
        <Row>
          <label>
            <span>Range mode</span>
            <Switch
              className="react-switch"
              onChange={(checked) => {
                setCalValue(null);
                setIsRangeMode(checked);
              }}
              checked={isRangeMode}
            />
          </label>
        </Row>

        <Row>
          <label>
            <span>Test Not available</span>
            <Switch
              className="react-switch"
              checked={isTestNotAvailable}
              onChange={(checked) => {
                setTestNotAvailable(checked);
              }}
            />
          </label>
        </Row>
        <Row>
          <label>
            <span>Off</span>
            <Switch
              disabled={isFirstTimer}
              className="react-switch"
              onChange={(checked) => setIsCoworkingMode(checked)}
              checked={isCoworkingMode}
              //              uncheckedIcon={false}
              //              checkedIcon={false}
              onColor="#3F7FBF"
              //              offColor="#32CD32"
            />
            <span>Coworking</span>
          </label>
        </Row>
        <Row>
          <label>
            <span>Off</span>
            <Switch
              disabled={isFirstTimer}
              className="react-switch"
              onChange={(checked) => setIsColivingMode(checked)}
              checked={isColivingMode}
              //              uncheckedIcon={false}
              //              checkedIcon={false}
              onColor="#3F7FBF"
              //              offColor="#32CD32"
            />
            <span>Coliving</span>
          </label>
        </Row>
      </>
    );
  };

  return (
    <>
      <Container>
        <Title />
        <br />
        <Intro />
        {isFirstTimer && <FirstTimerIntro />}
        <TheCalendar
          daysLoading={daysLoading}
          pendingDays={pendingDays}
          isRangeMode={isRangeMode}
          calValue={calValue}
          onChange={(d) => {
            if (isCoworkingMode || isColivingMode) {
              setCalValue(d);
            }
          }}
          onClickDay={(d : Date) => {
            if (!isCoworkingMode && !isColivingMode) {
              if (pendingDays.has(d.getTime())) {
                setShowBusyDayModal(true);
              } else {
                setCalValue(d);
                setShowEmptyDayModal(true);
              }
            }
          }}
        />
        <EmptyDayModal />
        <OccupiedDayModal />

        <br />
        <Row>
          {isColivingMode && (
            <Alert variant="info">
              <ColivingForm />
            </Alert>
          )}

          {isCoworkingMode && (
            <Alert variant="info">
              <Alert.Heading>Coworking</Alert.Heading>
              <p>You work!</p>
            </Alert>
          )}
        </Row>

        <hr />
        <DevRows />
      </Container>
    </>
  );
};

export default MyPresenceCalendar;
