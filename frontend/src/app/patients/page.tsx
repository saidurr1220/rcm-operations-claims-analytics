"use client";

import { useEffect, useState } from "react";
import DataTable from "@/components/DataTable";
import { getPatientsSummary, PatientSummary } from "@/lib/api";

export default function PatientsPage() {
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const data = await getPatientsSummary(100, 0);
        setPatients(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <div className="loading">Loading patients...</div>;
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
        <h2>Patient Summary</h2>
        <p>Patient demographics and financial overview</p>
      </div>

      <DataTable
        title={`Patients (Top 100 by Claim Amount)`}
        columns={[
          {
            header: "Patient Name",
            accessor: "firstName",
            render: (val, row) => `${row.firstName} ${row.lastName}`,
          },
          { header: "Gender", accessor: "gender" },
          {
            header: "Location",
            accessor: "city",
            render: (val, row) => `${row.city}, ${row.state}`,
          },
          {
            header: "Income",
            accessor: "income",
            render: (val) => formatCurrency(val),
          },
          {
            header: "Encounters",
            accessor: "totalEncounters",
            render: (val) => formatNumber(val),
          },
          {
            header: "Claims",
            accessor: "totalClaims",
            render: (val) => formatNumber(val),
          },
          {
            header: "Total Claim Amount",
            accessor: "totalClaimAmount",
            render: (val) => formatCurrency(val),
          },
          {
            header: "Payer Coverage",
            accessor: "totalPayerCoverage",
            render: (val) => formatCurrency(val),
          },
          {
            header: "Healthcare Expenses",
            accessor: "healthcareExpenses",
            render: (val) => formatCurrency(val),
          },
        ]}
        data={patients}
      />
    </div>
  );
}
