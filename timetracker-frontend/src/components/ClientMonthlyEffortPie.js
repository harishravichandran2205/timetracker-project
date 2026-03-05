import React, { useEffect, useMemo, useState } from "react";
import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import "./css/ClientMonthlyEffortPie.css";

ChartJS.register(ArcElement, Tooltip, Legend);

const toHours = (hoursByDate) =>
  Object.values(hoursByDate || {})
    .map((h) => Number(h || 0))
    .filter((n) => Number.isFinite(n))
    .reduce((a, b) => a + b, 0);

const ClientMonthlyEffortPie = ({ rows = [] }) => {
  const [sortBy, setSortBy] = useState("effort_desc");
  const [selectedClient, setSelectedClient] = useState("all");

  const clientEfforts = useMemo(() => {
    const grouped = new Map();

    rows.forEach((row) => {
      const client = String(row.client || "").trim();
      if (!client) return;

      const hours = toHours(row.hoursByDate);
      if (hours <= 0) return;

      const current = grouped.get(client) || { client, billable: 0, nonBillable: 0 };
      if (String(row.billable || "").toLowerCase() === "yes") {
        current.billable += hours;
      } else {
        current.nonBillable += hours;
      }
      grouped.set(client, current);
    });

    return Array.from(grouped.values()).map((entry) => ({
      ...entry,
      total: entry.billable + entry.nonBillable,
    }));
  }, [rows]);

  const sortedClients = useMemo(() => {
    const list = [...clientEfforts];
    if (sortBy === "client_asc") {
      list.sort((a, b) => a.client.localeCompare(b.client));
    } else if (sortBy === "client_desc") {
      list.sort((a, b) => b.client.localeCompare(a.client));
    } else if (sortBy === "effort_asc") {
      list.sort((a, b) => a.total - b.total);
    } else {
      list.sort((a, b) => b.total - a.total);
    }
    return list;
  }, [clientEfforts, sortBy]);

  const clientOptions = useMemo(() => sortedClients.map((c) => c.client), [sortedClients]);

  useEffect(() => {
    if (!clientOptions.length) {
      setSelectedClient("all");
      return;
    }
    if (selectedClient !== "all" && !clientOptions.includes(selectedClient)) {
      setSelectedClient(clientOptions[0]);
    }
  }, [clientOptions, selectedClient]);

  const selected = useMemo(() => {
    if (selectedClient === "all") {
      return clientEfforts.reduce(
        (acc, c) => ({
          client: "All Clients",
          billable: acc.billable + c.billable,
          nonBillable: acc.nonBillable + c.nonBillable,
          total: acc.total + c.total,
        }),
        { client: "All Clients", billable: 0, nonBillable: 0, total: 0 }
      );
    }
    return clientEfforts.find((c) => c.client === selectedClient) || {
      client: selectedClient,
      billable: 0,
      nonBillable: 0,
      total: 0,
    };
  }, [clientEfforts, selectedClient]);

  const projectEfforts = useMemo(() => {
    if (selectedClient === "all") return [];

    const grouped = new Map();
    rows.forEach((row) => {
      const client = String(row.client || "").trim();
      if (client !== selectedClient) return;

      const project = String(row.project || "").trim() || "Unknown Project";
      const hours = toHours(row.hoursByDate);
      if (hours <= 0) return;

      const current = grouped.get(project) || { name: project, billable: 0, nonBillable: 0 };
      if (String(row.billable || "").toLowerCase() === "yes") {
        current.billable += hours;
      } else {
        current.nonBillable += hours;
      }
      grouped.set(project, current);
    });

    const projects = Array.from(grouped.values()).map((entry) => ({
      ...entry,
      total: entry.billable + entry.nonBillable,
    }));

    if (sortBy === "effort_asc") {
      projects.sort((a, b) => a.total - b.total);
    } else if (sortBy === "effort_desc") {
      projects.sort((a, b) => b.total - a.total);
    } else if (sortBy === "client_asc") {
      projects.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      projects.sort((a, b) => b.name.localeCompare(a.name));
    }

    return projects;
  }, [rows, selectedClient, sortBy]);

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

  const data = {
    labels: ["Billable", "Non-Billable"],
    datasets: [
      {
        data: [selected.billable, selected.nonBillable],
        backgroundColor: [primary, accent],
        borderWidth: 0,
      },
    ],
  };

  const options = {
    cutout: "62%",
    plugins: {
      legend: { position: "bottom" },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.label}: ${Number(ctx.raw || 0).toFixed(2)} hrs`,
        },
      },
    },
  };

  const showProjectSplit = selectedClient !== "all";
  const tableRows = showProjectSplit
    ? projectEfforts
    : sortedClients.map((entry) => ({ ...entry, name: entry.client }));

  return (
    <div className="dashboard-card dashboard-card--pie">
      <h4 className="client-pie-title">Client Effort</h4>
      <div className="client-pie-controls">
        <select
          className="client-pie-select"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="effort_desc">Sort: Effort High-Low</option>
          <option value="effort_asc">Sort: Effort Low-High</option>
          <option value="client_asc">Sort:A-Z</option>
          <option value="client_desc">Sort:Z-A</option>
        </select>
        <select
          className="client-pie-select"
          value={selectedClient}
          onChange={(e) => setSelectedClient(e.target.value)}
          disabled={!clientOptions.length}
        >
          <option value="all">All Clients</option>
          {clientOptions.map((client) => (
            <option key={client} value={client}>
              {client}
            </option>
          ))}
        </select>
      </div>

      {selected.total <= 0 ? (
        <p className="client-pie-empty">No effort data available</p>
      ) : (
        <>
          <div className="client-pie-table">
            <div className="client-pie-table-head">
              <span>{showProjectSplit ? "Project" : "Client"}</span>
              <span>Billable</span>
              <span>Non-Billable</span>
              <span>Total Hrs</span>
            </div>
            {tableRows.map((entry) => (
              <div className="client-pie-table-row" key={entry.name}>
                <span title={entry.name}>{entry.name}</span>
                <span>{entry.billable.toFixed(2)}</span>
                <span>{entry.nonBillable.toFixed(2)}</span>
                <span>{entry.total.toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="client-pie-chart-wrap">
            <Doughnut data={data} options={options} />
            <div className="client-pie-center-label">
              <div>Total Hrs</div>
              <strong>{selected.total.toFixed(2)}</strong>
              <div className="client-pie-center-client">{selected.client}</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ClientMonthlyEffortPie;
