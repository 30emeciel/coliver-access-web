import { useCallback, useEffect, useMemo, useState } from "react";
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
import ColivingForm from "./ColivingForm";
import CoworkingForm from "./CoworkingForm";
import EditForm from "./EditForm";

import {UserDayStates, TCalendarContext, TMapDays, TMapGlobalDays} from "./MyPresenceCalendarTypes";

type DocumentData = firebase.firestore.DocumentData;



enum AppStates {
  Normal,
  ShowEmptyForm,
  ShowOccupiedForm,
  NewCoworking,
  NewColiving,
  EditDays,
}




const MyPresenceCalendar = () => {
  const currentUser = firebase.auth().currentUser!;
  console.assert(currentUser != null);

  /******************************************************************************************************************
   * States
   *****************************************************************************************************************/
  const [isFirstTimer, setIsFirstTimer] = useState(false);
  const [isTestNotAvailable, setTestNotAvailable] = useState(false);
  const [appState, setAppState] = useState(AppStates.Normal);

  const [listDays, listDaysLoading, listDaysError] = useCollectionData<DocumentData>(
    db.collection(`users/${currentUser.uid}/days`).orderBy("on", "asc")
  );

  const [userDays, setUserDays] = useState<TMapDays>(new Map());
  const [globalDays, setGlobalDays] = useState<TMapGlobalDays>(new Map());

  const calendarContext = new TCalendarContext({
    userDays: userDays,
    setUserDays: setUserDays,

    globalDays: globalDays,
    setGlobalDays: setGlobalDays,

    isLoading: listDaysLoading
  })
  
   useEffect(() => {
    if (!listDays) {
      return;
    }
    
    console.log("Refreshing calendar days...")
    const mapDays = new Map(listDays
//      .filter((day) => day.status === "PENDING_REVIEW")
      .map((day) => {        
        // TODO: #1 DateTime should be TZ insensitive
        let d = DateTime.fromMillis(day.on.seconds * 1000)
        console.log("d=" + d)
        return [d.toMillis(), $enum(UserDayStates).asValueOrThrow(day.status)] as [number, UserDayStates]
      }));
      setUserDays(mapDays)
  }, [listDays, setUserDays]);

  /******************************************************************************************************************
   * Functions
   *****************************************************************************************************************/

  /******************************************************************************************************************
   * Inner Components
   *****************************************************************************************************************/

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
              setAppState(AppStates.NewCoworking);
            }}
          >
            Coworking
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setAppState(AppStates.NewColiving);
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
      <Modal
        show={appState === AppStates.ShowOccupiedForm}
        onHide={() => setAppState(AppStates.Normal)}
      >
        <Modal.Header closeButton>
          <Modal.Title>What would you like to do?</Modal.Title>
        </Modal.Header>
        <Modal.Footer>
          <Button onClick={() => {}}>Cancel reservation</Button>
          <Button
            onClick={() => {
              setAppState(AppStates.EditDays);
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
                  setAppState(AppStates.Normal);
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
            {$enum(AppStates).map((value, key, wrappedEnum, index) => (
              <ToggleButton
                key={index}
                type="radio"
                //variant="secondary"
                name="radio"
                value={key}
                checked={appState === value}
                onChange={(e) =>
                  setAppState(
                    $enum(AppStates).getValueOrThrow(e.currentTarget.value)
                  )
                }
              >
                {key}
              </ToggleButton>
            ))}
          </ButtonGroup>
        </Row>
      </>
    );
  };

  const onClickDayFct = (d: Date) => {
    if (appState === AppStates.Normal) {
      let dt = DateTime.fromJSDate(d)
      if (calendarContext.userDays.has(dt.toMillis())) {
        setAppState(AppStates.ShowOccupiedForm);
      } else {        
        setAppState(AppStates.ShowEmptyForm);
      }
    }
  };

  return (
    <>
      <Container>
        <Row>
          <h1>My presence calendar</h1>
        </Row>
        <br />
        <Row>
          <Alert variant="info">
            Click on a day you would like to book. Your request will be reviewed
            by the <strong>Participante role</strong> and you will received an
            email with the decision.
            <br />
            Some days may not be available if the gender equity is not reached
            or there is not anymore spot available.
          </Alert>
        </Row>
        {isFirstTimer && <FirstTimerIntro />}

        <EmptyDayModal />
        <OccupiedDayModal />

        <br />
        {new Set([AppStates.Normal, AppStates.ShowEmptyForm, AppStates.ShowOccupiedForm]).has(appState) && (
          <Row>
            <TheCalendar
              calendarContext={calendarContext}
              isRangeMode={false}
              calValue={null}
              onClickDay={onClickDayFct}
            />
          </Row>
        )}

        {appState === AppStates.NewColiving && (
          <ColivingForm
            calendarContext={calendarContext}
            onSubmit={() => {
              setAppState(AppStates.Normal);
            }}
          />
        )}

        {appState === AppStates.NewCoworking && (
          <CoworkingForm
            calendarContext={calendarContext}
          />
        )}
        {appState === AppStates.EditDays && <Alert variant="info"></Alert>}

        <hr />
        <DevRows />
      </Container>
    </>
  );
};

export default MyPresenceCalendar;
