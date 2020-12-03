import React, { useCallback, useEffect, useMemo, useState } from "react";
import Row from "react-bootstrap/Row";
import Calendar, { CalendarTileProperties } from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "./Calendar.css";
import Spinner from "react-bootstrap/Spinner";

const TheCalendar = ({
  isRangeMode,  
  onChange,
  onClickDay,
  calValue,
  daysLoading,
  pendingDays,
}: {
  isRangeMode?: boolean;
  onChange?: (d: Date | Date[]) => void;
  onClickDay?: (d: Date) => void;
  calValue?: null | Date | Date[];
  daysLoading: boolean;
  pendingDays: Set<number>;
}) => {
  
  /******************************************************************************************************************
   * Calendar helper functions
   *****************************************************************************************************************/

   const isTestNotAvailable = false
   const isFirstTimer = false

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
    </>
  );
};

export default TheCalendar;
