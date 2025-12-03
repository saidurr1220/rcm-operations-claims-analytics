"use client";

import { useEffect, useState } from "react";
import KPICard from "@/components/KPICard";
import DataTable from "@/components/DataTable";
import { getQAIssues, getQASummary, QAIssue } from "@/lib/api";

export default function QAPage() {
  const [issues, setIssues] = useState<QAIssue[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [issuesData, summaryData] = await Promise.all([
          getQAIssues(100),
          getQASummary(),
        ]);
        setIssues(issuesData);
        setSummary(summaryData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <div className="loading">Loading QA issues...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  const formatNumber = (value: number) =>
    new Intl.NumberFormat("en-US").format(value);

  const issueTypeLabels: Record<string, string> = {
    negative_claim_amount: "Negative Claim Amount",
    claim_cost_less_than_base: "Claim Cost < Base Cost",
    coverage_exceeds_claim: "Coverage Exceeds Claim",
    missing_critical_field: "Missing Critical Field",
    implausible_age: "Implausible Age",
    missing_payer: "Missing Payer",
    long_processing_time: "Long Processing Time",
  };

  return (
    <div>
      <div className="page-header">
        <h2>Data Quality Issues</h2>
        <p>
          Identify and track data quality problems across claims and encounters
        </p>
      </div>

      {summary && (
        <div className="kpi-grid">
          <KPICard
            label="Total Issues Found"
            value={formatNumber(summary.totalIssues)}
            variant="warning"
          />
          {summary.issueBreakdown.slice(0, 5).map((item: any) => (
            <KPICard
              key={item.issueType}
              label={issueTypeLabels[item.issueType] || item.issueType}
              value={formatNumber(item.count)}
              variant="negative"
            />
          ))}
        </div>
      )}

      <DataTable
        title="Data Quality Issues (Top 100)"
        columns={[
          {
            header: "Issue Type",
            accessor: "issueType",
            render: (val) => issueTypeLabels[val] || val,
          },
          { header: "Table", accessor: "tableName" },
          {
            header: "Record ID",
            accessor: "recordId",
            render: (val) => (
              <code
                style={{
                  fontSize: "0.75rem",
                  background: "#ecf0f1",
                  padding: "0.25rem 0.5rem",
                  borderRadius: "4px",
                }}
              >
                {val}
              </code>
            ),
          },
          { header: "Description", accessor: "description" },
        ]}
        data={issues}
      />

      <div className="card">
        <div className="card-header">
          <h3>QA Check Definitions</h3>
        </div>
        <ul style={{ lineHeight: 2, paddingLeft: "1.5rem" }}>
          <li>
            <strong>Negative Claim Amount:</strong> Claims with amount ≤ $0
          </li>
          <li>
            <strong>Claim Cost &lt; Base Cost:</strong> Total claim cost is less
            than base encounter cost
          </li>
          <li>
            <strong>Coverage Exceeds Claim:</strong> Payer coverage exceeds
            total claim cost
          </li>
          <li>
            <strong>Missing Critical Field:</strong> Claims missing status,
            payer, or diagnosis code
          </li>
          <li>
            <strong>Implausible Age:</strong> Patient age &lt; 0 or &gt; 110
            years
          </li>
          <li>
            <strong>Missing Payer:</strong> Encounters without an assigned payer
          </li>
          <li>
            <strong>Long Processing Time:</strong> Claims taking &gt; 90 days to
            process
          </li>
        </ul>
      </div>
    </div>
  );
}
