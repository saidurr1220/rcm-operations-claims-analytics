// API client for RCM Operations Analytics backend

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface KPIOverview {
    totalClaims: number;
    totalPatients: number;
    totalClaimAmount: number;
    avgClaimAmount: number;
    deniedClaims: number;
    approvedClaims: number;
    pendingClaims: number;
    denialRate: number;
    approvalRate: number;
    avgDaysToProcess: number;
}

export interface DenialByPayer {
    payerName: string;
    totalClaims: number;
    totalAmount: number;
    deniedClaims: number;
    deniedAmount: number;
    denialRate: number;
    approvedClaims: number;
    approvalRate: number;
}

export interface DenialByClaimType {
    claimType: string;
    totalClaims: number;
    totalAmount: number;
    deniedClaims: number;
    deniedAmount: number;
    denialRate: number;
    approvedClaims: number;
}

export interface MonthlyTrend {
    month: string;
    totalClaims: number;
    totalAmount: number;
    deniedClaims: number;
    approvedClaims: number;
    denialRate: number;
}

export interface RevenueByEncounterClass {
    encounterClass: string;
    totalEncounters: number;
    totalBaseCost: number;
    totalClaimCost: number;
    totalPayerCoverage: number;
    patientResponsibility: number;
    avgBaseCost: number;
    avgClaimCost: number;
    coverageRate: number;
}

export interface PatientSummary {
    id: string;
    firstName: string;
    lastName: string;
    gender: string;
    city: string;
    state: string;
    healthcareExpenses: number;
    healthcareCoverage: number;
    income: number;
    totalEncounters: number;
    totalClaims: number;
    totalClaimAmount: number;
    totalEncounterCost: number;
    totalPayerCoverage: number;
}

export interface QAIssue {
    issueType: string;
    tableName: string;
    recordId: string;
    description: string;
    issueValue: number | null;
}

async function fetchAPI<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${API_URL}${endpoint}`);

    if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
    }

    const json = await response.json();
    return json.data;
}

// KPI endpoints
export const getKPIOverview = () => fetchAPI<KPIOverview>('/api/kpis/overview');
export const getDenialsByPayer = () => fetchAPI<DenialByPayer[]>('/api/kpis/denials-by-payer');
export const getDenialsByClaimType = () => fetchAPI<DenialByClaimType[]>('/api/kpis/denials-by-claim-type');
export const getMonthlyTrends = () => fetchAPI<MonthlyTrend[]>('/api/kpis/monthly-trends');

// Revenue endpoints
export const getRevenueByEncounterClass = () => fetchAPI<RevenueByEncounterClass[]>('/api/revenue/by-encounterclass');

// Patient endpoints
export const getPatientsSummary = (limit = 100, offset = 0) =>
    fetchAPI<PatientSummary[]>(`/api/patients/summary?limit=${limit}&offset=${offset}`);

// QA endpoints
export const getQAIssues = (limit = 100, type?: string) => {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (type) params.append('type', type);
    return fetchAPI<QAIssue[]>(`/api/qa/issues?${params}`);
};

export const getQASummary = () => fetchAPI<{
    totalIssues: number;
    issueBreakdown: Array<{ issueType: string; count: number }>;
}>('/api/qa/summary');
