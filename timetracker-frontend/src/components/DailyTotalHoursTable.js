import React from "react";
import "./css/DailyTotalHoursTable.css";

const DailyTotalHoursTable = ({ rows = [], dateColumns = [] }) => {
  const getTotalForDate = (date) =>
    rows.reduce((sum, row) => {
      const raw = row?.hoursByDate?.[date];
      const value = Number.parseFloat(raw);
      return Number.isFinite(value) ? sum + value : sum;
    }, 0);

  const formatTotal = (value) => {
    if (!Number.isFinite(value)) return "0";
    return Number.isInteger(value) ? String(value) : value.toFixed(1);
  };

  return (
    <div className="daily-total-hours-wrapper">
      <table className="daily-total-hours-table">
        <thead>
          <tr>
            <th className="label-col">Daily Totals</th>
            {dateColumns.map((date) => (
              <th key={date} className="date-col">
                {date}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="label-col">Total Hours</td>
            {dateColumns.map((date) => (
              <td key={date} className="date-col">
                {formatTotal(getTotalForDate(date))}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default DailyTotalHoursTable;
