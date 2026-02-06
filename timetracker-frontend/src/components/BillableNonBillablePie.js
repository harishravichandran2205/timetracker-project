import React, { useMemo } from "react";
import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

const BillableNonBillablePie = ({ rows }) => {
  const { billableHours, nonBillableHours, totalHours } = useMemo(() => {
    let billable = 0;
    let nonBillable = 0;

    rows.forEach((row) => {
      const hours = Object.values(row.hoursByDate || {})
        .map((h) => Number(h || 0))
        .reduce((a, b) => a + b, 0);

      if (row.billable === "Yes") billable += hours;
      else nonBillable += hours;
    });

    return {
      billableHours: billable,
      nonBillableHours: nonBillable,
      totalHours: billable + nonBillable,
    };
  }, [rows]);

  const getThemeColors = () => {
    if (typeof window === "undefined") {
      return { primary: "#004aad", accent: "#0066ff" };
    }
    const styles = getComputedStyle(document.documentElement);
    const primary = styles.getPropertyValue("--brand-primary").trim() || "#004aad";
    const accent = styles.getPropertyValue("--brand-accent").trim() || "#0066ff";
    return { primary, accent };
  };

  const { primary, accent } = getThemeColors();

  if (totalHours === 0) {
    return (
      <div className="dashboard-card dashboard-card--pie">
        <h4 style={{ textAlign: "center" }}>Billable vs Non-Billable</h4>
        <p style={{ textAlign: "center", color: "#888" }}>
          No effort data available
        </p>
      </div>
    );
  }

  const data = {
    labels: ["Billable", "Non-Billable"],
    datasets: [
      {
        data: [billableHours, nonBillableHours],
        backgroundColor: [primary, accent],
      },
    ],
  };

  const options = {
    cutout: "65%",
    plugins: {
      legend: { position: "bottom" },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.label}: ${ctx.raw} hrs`,
        },
      },
    },
  };

  return (
    <div className="dashboard-card dashboard-card--pie">
      <h4 style={{ textAlign: "center" }}>Billable vs Non-Billable</h4>

      <div style={{ position: "relative" }}>
        <Doughnut data={data} options={options} />

        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
            pointerEvents: "none",
          }}
        >
          <strong>{totalHours}</strong>
          <div style={{ fontSize: "12px", color: "#666" }}>
            Total Hrs
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillableNonBillablePie;
