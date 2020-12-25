import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Button from "react-bootstrap/Button";
import Row from "react-bootstrap/Row";
import "src/core/Switch.css";
import { DateTime, Duration, Interval } from "luxon";
import { $enum } from "ts-enum-util";
import * as typeformEmbed from '@typeform/embed'

import {
  Alert,
  ButtonGroup,
  Card,
  Col,
  Container,
  Dropdown,
  DropdownButton,
  Form,
  InputGroup,
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
import ColivingForm from "./ColivingForm";
import CoworkingForm from "./CoworkingForm";
import EditForm from "./EditForm";
import { useFormik } from 'formik';
import * as yup from 'yup';

import {
  UserDayStates,
  TCalendarContext,
  TMapDays,
  TMapGlobalDays,
  TUserDay,
} from "./MyPresenceCalendarTypes";
import CancelationForm from "./CancelationForm";
import { Field, Formik, FormikHelpers, FormikValues } from "formik";


type DocumentData = firebase.firestore.DocumentData;

enum AppStates {
  Normal,
  ShowEmptyForm,
  ShowOccupiedForm,
  NewCoworking,
  ColivingForm,
  EditDays,
  CancelationForm,
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

  const [
    listDays,
    listDaysLoading,
    listDaysError,
  ] = useCollectionData<TUserDay>(
    db.collection(`users/${currentUser.uid}/days`).orderBy("on", "asc")
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

  const DevRows = () => {
    return (
      <>
        <Row>
          <h2>Dev pannel</h2>
        </Row>
        <Row>
          <label>calValue = {calValue?.toDateString()}</label>
          <Button
            size="sm"
            onClick={() => {
              setCalValue(null);
            }}
          >
            Reset
          </Button>
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

  const schema = yup.object({
    firstName: yup.string().required(),
    lastName: yup.string().required(),
    username: yup.string().required(),
    city: yup.string().required(),
    state: yup.string().required(),
    zip: yup.string().required(),
    terms: yup.bool().required(),
  });
  
  function FormExample() {
    return (
      <Formik
        validationSchema={schema}
        onSubmit={console.log}
        initialValues={{
          firstName: 'Mark',
          lastName: 'Otto',
          username: '',
          city: '',
          state: '',
          zip: '',
          terms: false
        }}
      >
        {({
          handleSubmit,
          handleChange,
          handleBlur,
          values,
          touched,
          isValid,
          errors,
        }) => (
          <Form noValidate onSubmit={handleSubmit}>
            <Form.Row>
              <Form.Group as={Col} md="4" controlId="validationFormik01">
                <Form.Label>First name</Form.Label>
                <Form.Control
                  type="text"
                  name="firstName"
                  value={values.firstName}
                  onChange={handleChange}
                  isValid={touched.firstName && !errors.firstName}
                />
                <Form.Control.Feedback>Looks good!</Form.Control.Feedback>
              </Form.Group>
              <Form.Group as={Col} md="4" controlId="validationFormik02">
                <Form.Label>Last name</Form.Label>
                <Form.Control
                  type="text"
                  name="lastName"
                  value={values.lastName}
                  onChange={handleChange}
                  isValid={touched.lastName && !errors.lastName}
                />
  
                <Form.Control.Feedback>Looks good!</Form.Control.Feedback>
              </Form.Group>
              <Form.Group as={Col} md="4" controlId="validationFormikUsername">
                <Form.Label>Username</Form.Label>
                <InputGroup>
                  <InputGroup.Prepend>
                    <InputGroup.Text id="inputGroupPrepend">@</InputGroup.Text>
                  </InputGroup.Prepend>
                  <Form.Control
                    type="text"
                    placeholder="Username"
                    aria-describedby="inputGroupPrepend"
                    name="username"
                    value={values.username}
                    onChange={handleChange}
                    isInvalid={!!errors.username}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.username}
                  </Form.Control.Feedback>
                </InputGroup>
              </Form.Group>
            </Form.Row>
            <Form.Row>
              <Form.Group as={Col} md="6" controlId="validationFormik03">
                <Form.Label>City</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="City"
                  name="city"
                  value={values.city}
                  onChange={handleChange}
                  isInvalid={!!errors.city}
                />
  
                <Form.Control.Feedback type="invalid">
                  {errors.city}
                </Form.Control.Feedback>
              </Form.Group>
              <Form.Group as={Col} md="3" controlId="validationFormik04">
                <Form.Label>State</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="State"
                  name="state"
                  value={values.state}
                  onChange={handleChange}
                  isInvalid={!!errors.state}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.state}
                </Form.Control.Feedback>
              </Form.Group>
              <Form.Group as={Col} md="3" controlId="validationFormik05">
                <Form.Label>Zip</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Zip"
                  name="zip"
                  value={values.zip}
                  onChange={handleChange}
                  isInvalid={!!errors.zip}
                />
  
                <Form.Control.Feedback type="invalid">
                  {errors.zip}
                </Form.Control.Feedback>
              </Form.Group>
            </Form.Row>
            <Form.Group>
              <Form.Check
                required
                name="terms"
                label="Agree to terms and conditions"
                onChange={handleChange}
                isInvalid={!!errors.terms}
                feedback={errors.terms}
                id="validationFormik0"
              />
            </Form.Group>            
            <Button type="submit">Submit form</Button>
          </Form>
        )}
      </Formik>
    );
  }


const MyTypeform = () => {
  const typeformRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!typeformRef || !typeformRef.current) {
      return
    }
    typeformEmbed.makeWidget(typeformRef.current, 'https://bgwqrin5mwx.typeform.com/to/zpxsFL8Z#userid=xxxxx', {
      hideFooter: true,
      hideHeaders: true,
      opacity: 50,
    })
  }, [typeformRef])

  return <div ref={typeformRef} style={{ height: '100vh', width: '100%' }}></div>
}


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
          <h1>My presence calendar</h1>
        </Row>
        <Row><Col>
        

     </Col></Row>
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
                    Cancel
                  </Button>
                  <Button className="mr-1" variant="success" onClick={() => setAppState(AppStates.NewCoworking)}>
                    Coworking
                  </Button>
                  <Button onClick={() => setAppState(AppStates.ColivingForm)}>
                    Coliving
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
                  <p>
                    What would you like to do?
                  </p>
                  <div className="">
                    <Button
                      className="mr-1"
                      variant="danger"
                      onClick={() => setAppState(AppStates.CancelationForm)}
                    >
                      Cancel reservation...
                    </Button>
                    <Button
                      className="mr-1"
                      onClick={() => setAppState(AppStates.EditDays)}>
                      Change reservation...
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

        <hr />
        <DevRows />
      </Container>
    </>
  );
};

export default MyPresenceCalendar;
