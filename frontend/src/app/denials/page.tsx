"use client";

import { useEffect, useState } from "react";
import DataTable from "@/components/DataTable";
import {
  getDenialsByPayer,
  getDenialsByClaimType,
  getRevenueByEncounterClass,
  DenialByPayer,
  DenialByClaimType,
  RevenueByEncounterClass,
} from "@/lib/api";

export default function DenialsPage() {
  const [denialsByPayer, setDenialsByPayer] = useState<DenialByPayer[]>([]);
  const [denialsByType, setDenialsByType] = useState<DenialByClaimType[]>([]);
  const [revenueByClass, setRevenueByClass] = useState<
    RevenueByEncounterClass[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [payerData, typeData, revenueData] = await Promise.all([
          getDenialsByPayer(),
          getDenialsByClaimType(),
          getRevenueByEncounterClass(),
        ]);
        setDenialsByPayer(payerData);
        setDenialsByType(typeData);
        setRevenueByClass(revenueData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading)
    return <div className="loading">Loading denials analysis...</div>;
  if (error) return <div className="error">Error: {error}</div>;

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
        <h2>Denials & Revenue Analysis</h2>
        <p>Analyze denial patterns and revenue by payer and claim type</p>
      </div>

      <DataTable
        title="Denials by Payer"
        columns={[
          { header: "Payer Name", accessor: "payerName" },
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
            header: "Denied Claims",
            accessor: "deniedClaims",
            render: (val) => formatNumber(val),
          },
          {
            header: "Denied Amount",
            accessor: "deniedAmount",
            render: (val) => formatCurrency(val),
          },
          {
            header: "Denial Rate",
            accessor: "denialRate",
            render: (val) => (
              <span
                style={{
                  color: val > 10 ? "#e74c3c" : val > 5 ? "#f39c12" : "#27ae60",
                  fontWeight: 600,
                }}
              >
                {val.toFixed(1)}%
              </span>
            ),
          },
          {
            header: "Approval Rate",
            accessor: "approvalRate",
            render: (val) => `${val.toFixed(1)}%`,
          },
        ]}
        data={denialsByPayer}
      />

      <DataTable
        title="Denials by Claim Type"
        columns={[
          { header: "Claim Type", accessor: "claimType" },
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
            header: "Denied Claims",
            accessor: "deniedClaims",
            render: (val) => formatNumber(val),
          },
          {
            header: "Denied Amount",
            accessor: "deniedAmount",
            render: (val) => formatCurrency(val),
          },
          {
            header: "Denial Rate",
            accessor: "denialRate",
            render: (val) => (
              <span
                style={{
                  color: val > 10 ? "#e74c3c" : val > 5 ? "#f39c12" : "#27ae60",
                  fontWeight: 600,
                }}
              >
                {val.toFixed(1)}%
              </span>
            ),
          },
        ]}
        data={denialsByType}
      />

      <DataTable
        title="Revenue by Encounter Class"
        columns={[
          { header: "Encounter Class", accessor: "encounterClass" },
          {
            header: "Total Encounters",
            accessor: "totalEncounters",
            render: (val) => formatNumber(val),
          },
          {
            header: "Total Claim Cost",
            accessor: "totalClaimCost",
            render: (val) => formatCurrency(val),
          },
          {
            header: "Payer Coverage",
            accessor: "totalPayerCoverage",
            render: (val) => formatCurrency(val),
          },
          {
            header: "Patient Responsibility",
            accessor: "patientResponsibility",
            render: (val) => formatCurrency(val),
          },
          {
            header: "Avg Claim Cost",
            accessor: "avgClaimCost",
            render: (val) => formatCurrency(val),
          },
          {
            header: "Coverage Rate",
            accessor: "coverageRate",
            render: (val) => `${val.toFixed(1)}%`,
          },
        ]}
        data={revenueByClass}
      />
    </div>
  );
}
