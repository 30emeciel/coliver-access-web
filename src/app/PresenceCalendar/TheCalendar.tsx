import React, { useCallback, useEffect, useMemo, useState } from "react";
import Row from "react-bootstrap/Row";
import Calendar, { CalendarTileProperties } from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "./Calendar.css";
import Spinner from "react-bootstrap/Spinner";

const TheCalendar = ({
  isTestNotAvailable,
  isFirstTimer,
  isRangeMode,
  onClickDay,
  onChange,
  calValue,
  daysLoading,
  pendingDays,
}: {
  isTestNotAvailable: boolean;
  isFirstTimer: boolean;
  isRangeMode: boolean;
  onClickDay: (d: Date) => void;
  onChange: (d: Date | Date[]) => void;
  calValue: null | Date | Date[];
  daysLoading: boolean;
  pendingDays: Set<number>;
}) => {
  
  /******************************************************************************************************************
   * Calendar helper functions
   *****************************************************************************************************************/

  const pendingDaysTiles = ({
    activeStartDate,
    date,
    view,
  }: CalendarTileProperties) =>
    pendingDays.has(date.getTime()) ? "reservation-pending" : "";

  const disabledTiles = ({
    activeStartDate,
    date,
    view,
  }: CalendarTileProperties) =>
    isTestNotAvailable
      ? date.getDay() === 3
        ? true
        : false
      : isFirstTimer
      ? date.getDay() !== 1
      : false;

  const contentTiles = ({
    activeStartDate,
    date,
    view,
  }: CalendarTileProperties) =>
    isTestNotAvailable ? (
      date.getDay() === 3 ? (
        <div>Sold out</div>
      ) : null
    ) : null;

  return (
    <>
      <Row>
        {daysLoading ? (
          <>
            <Spinner animation="border" variant="primary" role="status">
              <span className="sr-only">Loading calendar...</span>
            </Spinner>{" "}
            <div>Loading calendar...</div>
          </>
        ) : (
          <Calendar
            selectRange={isRangeMode}
            view="month"
            //showDoubleView
            //showWeekNumbers
            //showNeighboringMonth={false}
            tileClassName={pendingDaysTiles}
            tileDisabled={disabledTiles}
            tileContent={contentTiles}
            value={calValue}
            onChange={onChange}
            onClickDay={onClickDay}
          />
        )}
      </Row>
    </>
  );
};

export default TheCalendar;
