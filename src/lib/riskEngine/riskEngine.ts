/** Centralized risk engine — computes a risk score for a Case
 *  based on triggered modular risk factors.
 *  Score = sum(triggered_factor.weight) capped at 100.
 *  Confidence is based on evidence quantity. */

import { RISK_FACTORS, type RiskFactorInput, type RiskFactorResult } from "./riskFactors";

export type RiskLevel = "low" | "medium" | "high";
export type ConfidenceLevel = "low" | "medium" | "high";

export interface CaseRiskResult {
  riskScore: number;
  riskLevel: RiskLevel;
  confidenceLevel: ConfidenceLevel;
  triggeredFactors: RiskFactorResult[];
  allFactors: RiskFactorResult[];
  insufficientData: boolean;
}

function getRiskLevel(score: number): RiskLevel {
  if (score >= 70) return "high";
  if (score >= 30) return "medium";
  return "low";
}

function getConfidence(input: RiskFactorInput): ConfidenceLevel {
  const totalItems = input.items.length;
  if (totalItems >= 10) return "high";
  if (totalItems >= 4) return "medium";
  return "low";
}

export function computeRiskScore(input: RiskFactorInput): CaseRiskResult {
  if (input.items.length === 0) {
    return {
      riskScore: 0,
      riskLevel: "low",
      confidenceLevel: "low",
      triggeredFactors: [],
      allFactors: RISK_FACTORS.map(fn => fn(input)),
      insufficientData: true,
    };
  }

  const allFactors = RISK_FACTORS.map(fn => fn(input));
  const triggeredFactors = allFactors.filter(f => f.triggered);
  const rawScore = triggeredFactors.reduce((sum, f) => sum + f.weight, 0);
  const riskScore = Math.min(100, rawScore);

  return {
    riskScore,
    riskLevel: getRiskLevel(riskScore),
    confidenceLevel: getConfidence(input),
    triggeredFactors,
    allFactors,
    insufficientData: false,
  };
}
