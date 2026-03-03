/** Alert Intelligence Pipeline — Phase 5
 *  Internal event hooks for future smart alert system.
 *  These are event emitters, NOT user-facing notifications. */

import { useCallback, useRef } from "react";
import type { CaseRiskResult } from "@/lib/riskEngine";

type AlertEvent =
  | { type: "risk_score_computed"; caseId: string; result: CaseRiskResult }
  | { type: "suspicious_pattern_detected"; caseId: string; factorId: string; details: string }
  | { type: "large_transfer_detected"; caseId: string; ref: string; amount: number };

type AlertListener = (event: AlertEvent) => void;

/** Internal event bus for investigation intelligence.
 *  Subscribe in components / background workers. */
export function useAlertIntelligence() {
  const listenersRef = useRef<AlertListener[]>([]);

  const subscribe = useCallback((listener: AlertListener) => {
    listenersRef.current.push(listener);
    return () => {
      listenersRef.current = listenersRef.current.filter(l => l !== listener);
    };
  }, []);

  const emit = useCallback((event: AlertEvent) => {
    // Log for debugging in development
    if (import.meta.env.DEV) {
      console.debug("[AlertIntelligence]", event.type, event);
    }
    listenersRef.current.forEach(l => l(event));
  }, []);

  const onRiskScoreComputed = useCallback(
    (caseId: string, result: CaseRiskResult) => {
      emit({ type: "risk_score_computed", caseId, result });
    },
    [emit]
  );

  const onSuspiciousPatternDetected = useCallback(
    (caseId: string, factorId: string, details: string) => {
      emit({ type: "suspicious_pattern_detected", caseId, factorId, details });
    },
    [emit]
  );

  const onLargeTransferDetected = useCallback(
    (caseId: string, ref: string, amount: number) => {
      emit({ type: "large_transfer_detected", caseId, ref, amount });
    },
    [emit]
  );

  return {
    subscribe,
    emit,
    onRiskScoreComputed,
    onSuspiciousPatternDetected,
    onLargeTransferDetected,
  };
}
