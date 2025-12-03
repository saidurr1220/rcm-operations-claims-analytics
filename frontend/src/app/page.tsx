"use client";

import { useEffect, useState } from "react";
import KPICard from "@/components/KPICard";
import DataTable from "@/components/DataTable";
import {
  getKPIOverview,
  getMonthlyTrends,
  KPIOverview,
  MonthlyTrend,
} from "@/lib/api";

export default function OverviewPage() {
  const [kpis, setKpis] = useState<KPIOverview | null>(null);
  const [trends, setTrends] = useState<MonthlyTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [kpiData, trendsData] = await Promise.all([
          getKPIOverview(),
          getMonthlyTrends(),
        ]);
        setKpis(kpiData);
        setTrends(trendsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <div className="loading">Loading dashboard...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!kpis) return <div className="error">No data available</div>;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);

  const formatNumber = (value: number) =>
    new Intl.NumberFormat("en-US").format(value);

  return (
    <div>
      <div className="page-header">
        <h2>RCM Operations Overview</h2>
        <p>Key performance indicators and claim trends</p>
      </div>

      <div className="kpi-grid">
        <KPICard
          label="Total Claims"
          value={formatNumber(kpis.totalClaims)}
          subtitle={`${formatNumber(kpis.totalPatients)} patients`}
        />
        <KPICard
          label="Total Claim Amount"
          value={formatCurrency(kpis.totalClaimAmount)}
          subtitle={`Avg: ${formatCurrency(kpis.avgClaimAmount)}`}
        />
        <KPICard
          label="Denial Rate"
          value={`${kpis.denialRate.toFixed(1)}%`}
          subtitle={`${formatNumber(kpis.deniedClaims)} denied claims`}
          variant={
            kpis.denialRate > 10
              ? "negative"
              : kpis.denialRate > 5
              ? "warning"
              : "positive"
          }
        />
        <KPICard
          label="Approval Rate"
          value={`${kpis.approvalRate.toFixed(1)}%`}
          subtitle={`${formatNumber(kpis.approvedClaims)} approved claims`}
          variant="positive"
        />
        <KPICard
          label="Pending Claims"
          value={formatNumber(kpis.pendingClaims)}
          variant="warning"
        />
        <KPICard
          label="Avg Processing Time"
          value={`${kpis.avgDaysToProcess.toFixed(1)} days`}
          variant={kpis.avgDaysToProcess > 30 ? "negative" : "default"}
        />
      </div>

      <DataTable
        title="Monthly Claim Trends (Last 12 Months)"
        columns={[
          { header: "Month", accessor: "month" },
          {
            header: "Total Claims",
            accessor: "totalClaims",
            render: (val) => formatNumber(val),
          },
          {
            header: "Total Amount",
            accessor: "totalAmount",
            render: (val) => formatCurrency(val),
          },
          {
            header: "Approved",
            accessor: "approvedClaims",
            render: (val) => formatNumber(val),
          },
          {
            header: "Denied",
            accessor: "deniedClaims",
            render: (val) => formatNumber(val),
          },
          {
            header: "Denial Rate",
            accessor: "denialRate",
            render: (val) => `${val.toFixed(1)}%`,
          },
        ]}
        data={trends}
      />
    </div>
  );
}
