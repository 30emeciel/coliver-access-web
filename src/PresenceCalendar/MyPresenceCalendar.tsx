import {
  faBed,
  faExclamationCircle,
  faLaptopHouse,
  faUserClock,
  faUserEdit,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { DateTime } from "luxon";
import { useContext, useEffect, useState } from "react";
import { Alert, Col, Container } from "react-bootstrap";
import Button from "react-bootstrap/Button";
import Row from "react-bootstrap/Row";
import { useCollectionData } from "react-firebase-hooks/firestore";
import db from "src/core/db";
import "src/core/Switch.css";
import UserContext from "src/core/userContext";
import { User } from "src/core/useUser";
import { $enum } from "ts-enum-util";
import CancelationForm from "./CancelationForm";
import ColivingForm from "./ColivingForm";
import CoworkingForm from "./CoworkingForm";
import {
  TCalendarContext,
  TMapDays,
  TMapGlobalDays,
  TUserDay,
  UserDayStates,
} from "./MyPresenceCalendarTypes";
import TheCalendar from "./TheCalendar";

enum AppStates {
  Normal,
  ShowEmptyForm,
  ShowOccupiedForm,
  NewCoworking,
  ColivingForm,
  EditDays,
  CancelationForm,
}

const MyPresenceCalendar = ({ user }: { user?: User }) => {
  const { doc: currentUserData } = useContext(UserContext);
  if (!user) {
    user = currentUserData!;
  }

  /******************************************************************************************************************
   * States
   *****************************************************************************************************************/
  const [isFirstTimer, setIsFirstTimer] = useState(false);
  const [appState, setAppState] = useState(AppStates.Normal);

  const [
    listDays,
    listDaysLoading,
    listDaysError,
  ] = useCollectionData<TUserDay>(
    db.collection(`users/${user.sub}/days`).orderBy("on", "asc")
  );

  const [userDays, setUserDays] = useState<TMapDays>(new Map());
  const [globalDays, setGlobalDays] = useState<TMapGlobalDays>(new Map());

  const [calValue, setCalValue] = useState<Date | null>(null);

  const calendarContext = new TCalendarContext({
    userDays: userDays,
    setUserDays: setUserDays,

    globalDays: globalDays,
    setGlobalDays: setGlobalDays,

    isLoading: listDaysLoading,
    user: user,
  });

  useEffect(() => {
    if (!listDays) {
      return;
    }

    console.log("Refreshing calendar days...");
    const mapDays = new Map(
      listDays
        //      .filter((day) => day.status === "PENDING_REVIEW")
        .map((day) => {
          // TODO: #1 DateTime should be TZ insensitive
          let d = DateTime.fromMillis(day.on.seconds * 1000);
          let status = $enum(UserDayStates).asValueOrThrow(day.status);
          let ud = {
            kind: day.kind,
            status: status,
          };
          return [d.toMillis(), ud] as [number, TUserDay];
        })
    );
    setUserDays(mapDays);
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

  const onClickDayFct = (d: Date) => {
    //if (appState === AppStates.Normal) {
    let dt = DateTime.fromJSDate(d);
    setCalValue(d);
    if (calendarContext.userDays.has(dt.toMillis())) {
      setAppState(AppStates.ShowOccupiedForm);
    } else {
      setAppState(AppStates.ShowEmptyForm);
    }
    //}
  };

  return (
    <>
      <Container>
        <Row>
          <h2>
            <FontAwesomeIcon icon={faUserClock} /> Calendrier de présence
            {!(user === currentUserData) && <> de {user.name}</>}
          </h2>
        </Row>
        <Row>
          <Col></Col>
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

        <br />
        {new Set([
          AppStates.Normal,
          AppStates.ShowEmptyForm,
          AppStates.ShowOccupiedForm,
        ]).has(appState) && (
          <Row>
            <Col>
              <TheCalendar
                calendarContext={calendarContext}
                isRangeMode={false}
                calValue={calValue}
                onClickDay={onClickDayFct}
              />
            </Col>
          </Row>
        )}
        {new Set([AppStates.ShowEmptyForm]).has(appState) && (
          <>
            <br />
            <Row>
              <Col>
                <Alert variant="info">
                  <p>What would you like to book?</p>
                  <div className="">
                    <Button
                      className="mr-1"
                      variant="danger"
                      onClick={() => {
                        setCalValue(null);
                        setAppState(AppStates.Normal);
                      }}
                    >
                      <FontAwesomeIcon icon={faExclamationCircle} /> Cancel
                    </Button>
                    <Button
                      className="mr-1"
                      variant="success"
                      onClick={() => setAppState(AppStates.NewCoworking)}
                    >
                      <FontAwesomeIcon icon={faLaptopHouse} /> Coworking
                    </Button>
                    <Button onClick={() => setAppState(AppStates.ColivingForm)}>
                      <FontAwesomeIcon icon={faBed} /> Coliving
                    </Button>
                  </div>
                </Alert>
              </Col>
            </Row>
          </>
        )}
        {new Set([AppStates.ShowOccupiedForm]).has(appState) && (
          <>
            <br />
            <Row>
              <Col>
                <Alert variant="info">
                  <p>What would you like to do?</p>
                  <div className="">
                    <Button
                      className="mr-1"
                      variant="danger"
                      onClick={() => {
                        setCalValue(null);
                        setAppState(AppStates.Normal);
                      }}
                    >
                      <FontAwesomeIcon icon={faExclamationCircle} /> Cancel
                    </Button>
                    <Button
                      className="mr-1"
                      variant="warning"
                      onClick={() => setAppState(AppStates.CancelationForm)}
                    >
                      <FontAwesomeIcon icon={faExclamationCircle} /> Annuler ma
                      réservation...
                    </Button>
                    <Button
                      className="mr-1"
                      onClick={() => setAppState(AppStates.EditDays)}
                    >
                      <FontAwesomeIcon icon={faUserEdit} /> Modifier ma
                      réservation...
                    </Button>
                  </div>
                </Alert>
              </Col>
            </Row>
          </>
        )}

        {new Set([AppStates.CancelationForm]).has(appState) && (
          <CancelationForm
            calendarContext={calendarContext}
            calValue={calValue as Date}
            onSubmit={() => {
              setCalValue(null);
              setAppState(AppStates.Normal);
            }}
            onCancel={() => {
              setAppState(AppStates.ShowOccupiedForm);
            }}
          />
        )}

        {appState === AppStates.ColivingForm && (
          <ColivingForm
            calendarContext={calendarContext}
            firstCalValue={calValue}
            onSubmit={() => {
              setCalValue(null);
              setAppState(AppStates.Normal);
            }}
            onCancel={() => {
              setAppState(AppStates.ShowEmptyForm);
            }}
          />
        )}

        {appState === AppStates.NewCoworking && (
          <CoworkingForm
            calendarContext={calendarContext}
            firstCalValue={calValue!}
            onSubmit={() => {
              setCalValue(null);
              setAppState(AppStates.Normal);
            }}
            onCancel={() => {
              setAppState(AppStates.ShowEmptyForm);
            }}
          />
        )}
        {appState === AppStates.EditDays && <Alert variant="info"></Alert>}
      </Container>
    </>
  );
};

export default MyPresenceCalendar;
