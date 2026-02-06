import React, { useMemo } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";

/* ===== Chart.js registration ===== */
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
);

/* ================= HELPERS ================= */

// Parse any date format safely → JS Date
const parseDateSafe = (raw) => {
  if (!raw) return null;

  // dd-MM-yyyy
  if (/^\d{2}-\d{2}-\d{4}$/.test(raw)) {
    const [d, m, y] = raw.split("-");
    return new Date(`${y}-${m}-${d}`);
  }

  // yyyy-MM-dd
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return new Date(raw);
  }

  // "3 Jan (Mon)" / "03 Jan (Mon)"
  if (/[A-Za-z]{3}/.test(raw)) {
    const parts = raw.split(" ");
    const day = parts[0].padStart(2, "0");
    const monthMap = {
      Jan: "01", Feb: "02", Mar: "03", Apr: "04",
      May: "05", Jun: "06", Jul: "07", Aug: "08",
      Sep: "09", Oct: "10", Nov: "11", Dec: "12",
    };
    const month = monthMap[parts[1]];
    const year = new Date().getFullYear();
    return new Date(`${year}-${month}-${day}`);
  }

  // fallback
  const parsed = new Date(raw);
  return isNaN(parsed) ? null : parsed;
};

// Find the month range based on latest DB data
const getMonthRangeFromData = (rows) => {
  const allDates = [];

  rows.forEach((row) => {
    Object.keys(row.hoursByDate || {}).forEach((d) => {
      const parsed = parseDateSafe(d);
      if (parsed) allDates.push(parsed);
    });
  });

  if (allDates.length === 0) return null;

  // Latest date present in DB
  const latest = new Date(Math.max(...allDates.map(d => d.getTime())));

  const start = new Date(latest.getFullYear(), latest.getMonth(), 1);
  const end   = new Date(latest.getFullYear(), latest.getMonth() + 1, 0);

  return { start, end };
};

const normalizeToMidnight = (d) => {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const getMonday = (date) => {
  const d = normalizeToMidnight(date);
  const day = d.getDay(); // 0=Sun, 1=Mon...
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
};

// Week index relative to calendar weeks (Mon-Sun) within the month
const getWeekIndexFromRange = (date, rangeStart) => {
  const msInDay = 1000 * 60 * 60 * 24;
  const monthStart = normalizeToMidnight(rangeStart);
  const firstWeekStart = getMonday(monthStart);
  const weekStart = getMonday(date);
  const diffDays = Math.floor((weekStart - firstWeekStart) / msInDay);
  return Math.floor(diffDays / 7) + 1;
};

const formatRangeLabel = (start, end) => {
  const startDay = start.getDate();
  const endDay = end.getDate();
  const monthName = start.toLocaleString("default", { month: "short" });
  return `${monthName} ${startDay}–${endDay}`;
};

const buildWeekLabelMap = (rangeStart, rangeEnd) => {
  const labels = {};
  const monthStart = normalizeToMidnight(rangeStart);
  const monthEnd = normalizeToMidnight(rangeEnd);
  const firstWeekStart = getMonday(monthStart);
  const msInDay = 1000 * 60 * 60 * 24;

  let index = 1;
  let cursor = new Date(firstWeekStart);
  while (cursor <= monthEnd) {
    const weekStart = new Date(cursor);
    const weekEnd = new Date(cursor);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const clampedStart = weekStart < monthStart ? monthStart : weekStart;
    const clampedEnd = weekEnd > monthEnd ? monthEnd : weekEnd;

    labels[index] = formatRangeLabel(clampedStart, clampedEnd);

    cursor = new Date(cursor.getTime() + 7 * msInDay);
    index += 1;
  }

  return labels;
};

/* =========================================== */

const PreviousMonthWeeklyBar = ({ rows }) => {
  const getThemeColors = () => {
    if (typeof window === "undefined") {
      return { primary: "#004aad", accent: "#0066ff" };
    }
    const styles = getComputedStyle(document.documentElement);
    const primary = styles.getPropertyValue("--brand-primary").trim() || "#004aad";
    const accent = styles.getPropertyValue("--brand-accent").trim() || "#0066ff";
    return { primary, accent };
  };

  const getTagColors = () => {
    if (typeof window === "undefined") {
      return { tagBg: "#e9edf3", tagText: "#546177" };
    }
    const styles = getComputedStyle(document.documentElement);
    const tagBg = styles.getPropertyValue("--tag-bg").trim() || "#e9edf3";
    const tagText = styles.getPropertyValue("--tag-text").trim() || "#546177";
    return { tagBg, tagText };
  };

  const { primary, accent } = getThemeColors();
  const { tagBg, tagText } = getTagColors();
  const { labels, billable, nonBillable, monthLabel, noDataWeeks } = useMemo(() => {
    const range = getMonthRangeFromData(rows);
    if (!range) {
      return { labels: [], billable: [], nonBillable: [], monthLabel: "", noDataWeeks: [] };
    }

    const { start, end } = range;
    const weekly = {};

    rows.forEach((row) => {
      Object.entries(row.hoursByDate || {}).forEach(([rawDate, hrs]) => {
        if (!hrs) return;

        const date = parseDateSafe(rawDate);
        if (!date || date < start || date > end) return;

        const week = getWeekIndexFromRange(date, start);

        if (!weekly[week]) {
          weekly[week] = { billable: 0, nonBillable: 0 };
        }

        const hours = Number(hrs || 0);
        if (row.billable === "Yes") {
          weekly[week].billable += hours;
        } else {
          weekly[week].nonBillable += hours;
        }
      });
    });

    const weekLabels = buildWeekLabelMap(start, end);
    const weeks = Object.keys(weekLabels)
      .map(Number)
      .sort((a, b) => a - b);

    const monthLabel = start.toLocaleString("default", {
      month: "long",
      year: "numeric",
    });

    return {
      labels: weeks.map((w) => weekLabels[w] || `Week ${w}`),
      billable: weeks.map((w) => (weekly[w] ? weekly[w].billable : 0)),
      nonBillable: weeks.map((w) => (weekly[w] ? weekly[w].nonBillable : 0)),
      noDataWeeks: weeks.map(
        (w) => !(weekly[w] && (weekly[w].billable || weekly[w].nonBillable))
      ),
      monthLabel,
    };
  }, [rows]);

  if (labels.length === 0) {
    return (
      <div className="dashboard-card dashboard-card--bar">
        <h4 style={{ textAlign: "center" }}>
          Previous Month – Weekly Effort
        </h4>
        <p style={{ textAlign: "center", color: "#888" }}>
          No data available for previous month
        </p>
      </div>
    );
  }

  const data = {
    labels,
    datasets: [
      {
        label: "Billable",
        data: billable,
        backgroundColor: primary,
      },
      {
        label: "Non-Billable",
        data: nonBillable,
        backgroundColor: accent,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: "bottom" },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ${ctx.raw} hrs`,
        },
      },
    },
    scales: {
      x: { stacked: true },
      y: {
        stacked: true,
        title: {
          display: true,
          text: "Hours",
        },
      },
    },
  };

  const plugins = [
    {
      id: "noDataTags",
      afterDatasetsDraw: (chart) => {
        if (!noDataWeeks || noDataWeeks.length === 0) return;
        const ctx = chart.ctx;
        const meta = chart.getDatasetMeta(0);
        const yScale = chart.scales.y;
        const baseY = yScale.getPixelForValue(0);

        ctx.save();
        ctx.font = "11px Poppins, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        noDataWeeks.forEach((isNoData, i) => {
          if (!isNoData) return;
          const point = meta?.data?.[i];
          if (!point) return;

          const text = "No data";
          const paddingX = 6;
          const textWidth = ctx.measureText(text).width;
          const boxWidth = textWidth + paddingX * 2;
          const boxHeight = 16;
          const x = point.x;
          const y = Math.max(baseY - 10, yScale.top + boxHeight);

          const left = x - boxWidth / 2;
          const top = y - boxHeight / 2;

          ctx.fillStyle = tagBg;
          const radius = 6;
          ctx.beginPath();
          ctx.moveTo(left + radius, top);
          ctx.lineTo(left + boxWidth - radius, top);
          ctx.quadraticCurveTo(left + boxWidth, top, left + boxWidth, top + radius);
          ctx.lineTo(left + boxWidth, top + boxHeight - radius);
          ctx.quadraticCurveTo(left + boxWidth, top + boxHeight, left + boxWidth - radius, top + boxHeight);
          ctx.lineTo(left + radius, top + boxHeight);
          ctx.quadraticCurveTo(left, top + boxHeight, left, top + boxHeight - radius);
          ctx.lineTo(left, top + radius);
          ctx.quadraticCurveTo(left, top, left + radius, top);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = tagText;
          ctx.fillText(text, x, y);
        });

        ctx.restore();
      },
    },
  ];

  return (
    <div className="dashboard-card dashboard-card--bar">
      <h4 style={{ textAlign: "center" }}>
        {monthLabel} – Weekly Effort
      </h4>
      <Bar data={data} options={options} plugins={plugins} />
    </div>
  );
};

export default PreviousMonthWeeklyBar;
