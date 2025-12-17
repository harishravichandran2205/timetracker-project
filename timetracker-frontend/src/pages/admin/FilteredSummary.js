import React from "react";
import { useLocation } from "react-router-dom";
import "../css/AdminPage.css";

const FilteredSummary = () => {
  const location = useLocation();

  const rawResults = location.state?.results;
  console.log(rawResults);
  const results = Array.isArray(rawResults.data) ? rawResults.data : [];

  if (results.length === 0) {
    return <p style={{ padding: "20px" }}>No summary data available</p>;
  }

  return (
    <div className="admin-page">
      <h2 className="page-title">Summary Result</h2>

      <table className="summary-table">
        <thead>
          <tr>
            <th>Client Name</th>
            <th>Ticket Number</th>
            <th>Ticket Description</th>
            <th>Billable Hours</th>
            <th>Non-Billable Hours</th>
            <th>Task Description</th>
          </tr>
        </thead>
        <tbody>
          {results.map((row, idx) => (
            <tr key={idx}>
              <td>{row.client}</td>
              <td>{row.ticket}</td>
              <td>{row.ticketDescription}</td>
              <td>{row.billableHours}</td>
              <td>{row.nonBillableHours}</td>
              <td>
                <ol className="task-list">
                  {(row.descriptions || []).map((desc, i) => (
                    <li key={i}>{desc}</li>
                  ))}
                </ol>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default FilteredSummary;
