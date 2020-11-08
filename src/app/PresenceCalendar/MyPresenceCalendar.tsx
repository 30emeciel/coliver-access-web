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

enum AppStates {Normal, ShowEmptyForm, ShowOccupiedForm, NewCoworking, NewColiving}

const MyPresenceCalendar = () => {
  const currentUser = firebase.auth().currentUser!;
  console.assert(currentUser != null);

  /******************************************************************************************************************
   * States
   *****************************************************************************************************************/
  const [isFirstTimer, setIsFirstTimer] = useState(false);
  const [isTestNotAvailable, setTestNotAvailable] = useState(false);
  const [appState, setAppState] = useState(AppStates.Normal);

  const [isColivingFormSubmitting, setIsColivingFormSubmitting] = useState(
    false
  );
  const [days, daysLoading, daysError] = useCollectionData<DocumentData>(
    db.collection(`users/${currentUser.uid}/days`).orderBy("on", "asc")
  );

    
  const [disabledDay, setDisabledDay] = useState<Set<DateTime>>(new Set());
  const [calValue, setCalValue] = useState<Date | Date[] | null>(null);
  
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
    setAppState(AppStates.Normal)
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
        show={appState === AppStates.ShowEmptyForm}
        onHide={() => setAppState(AppStates.Normal)}
      >
        <Modal.Header closeButton>
          <Modal.Title>What would you like to book?</Modal.Title>
        </Modal.Header>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setAppState(AppStates.NewCoworking)
            }}
          >
            Coworking
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setAppState(AppStates.NewColiving)
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
      <Modal show={appState === AppStates.ShowOccupiedForm} onHide={() => setAppState(AppStates.Normal)}>
        <Modal.Header closeButton>
          <Modal.Title>What would you like to do?</Modal.Title>
        </Modal.Header>
        <Modal.Footer>
          <Button
            onClick={() => {
            }}
          >
            Cancel reservation
          </Button>
          <Button
            onClick={() => {
            }}
          >
            Add/remove days
          </Button>
        </Modal.Footer>
      </Modal>
    );
  };
  

  const DevRows = () => {
    return (
      <>
      <Row>
      <h2>Dev switches</h2>
      </Row>
        <Row>
          <label>
            <span>First timer test Meriem</span>
            <Switch
              className="react-switch"
              checked={isFirstTimer}
              onChange={(checked) => {
                setIsFirstTimer(checked);
                if (checked) {
                  setAppState(AppStates.Normal)
                }
              }}
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
{/*           <label>
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
          </label> */}
        </Row>
        <Row>
        <ButtonGroup toggle>
        {$enum(AppStates).map((value, key, wrappedEnum, index)  => (
          <ToggleButton
            key={index}
            type="radio"
            //variant="secondary"
            name="radio"
            value={key}
            checked={appState === value}
            onChange={(e) => setAppState($enum(AppStates).getValueOrThrow(e.currentTarget.value))}
          >
            {key}
          </ToggleButton>
        ))}
      </ButtonGroup>

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
          isRangeMode={appState === AppStates.NewColiving}
          isTestNotAvailable={isTestNotAvailable}
          isFirstTimer={isFirstTimer}
          calValue={calValue}
          onChange={(d) => {
            if (appState === AppStates.NewCoworking || appState === AppStates.NewColiving) {
              setCalValue(d);
            }
          }}
          onClickDay={(d : Date) => {
            if (appState === AppStates.Normal) {
              if (pendingDays.has(d.getTime())) {
                setAppState(AppStates.ShowOccupiedForm)
                
              } else {
                setCalValue(d);
                setAppState(AppStates.ShowEmptyForm)
              }
            }
          }}
        />
        <EmptyDayModal />
        <OccupiedDayModal />

        <br />
        <Row>
          {appState === AppStates.NewColiving && (
            <Alert variant="info">
              <ColivingForm />
            </Alert>
          )}

          {appState === AppStates.NewCoworking && (
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
