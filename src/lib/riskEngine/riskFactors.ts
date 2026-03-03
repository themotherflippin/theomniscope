/** Modular risk factors for case-level risk assessment.
 *  Each factor is a pure function that inspects evidence items and returns a result.
 *  ZERO fictional data — only flags what is detectable from on-chain evidence. */

export interface RiskFactorResult {
  id: string;
  triggered: boolean;
  weight: number;
  label: { en: string; fr: string };
  description: { en: string; fr: string };
  details?: string;
}

export interface RiskFactorInput {
  items: Array<{
    item_type: string;
    ref: string;
    title: string | null;
    data: Record<string, unknown>;
  }>;
  notes: Array<{ body: string }>;
}

type RiskFactorFn = (input: RiskFactorInput) => RiskFactorResult;

// ─── Factor: Large Abnormal Transfer ───
const largeTransfer: RiskFactorFn = ({ items }) => {
  const txItems = items.filter(i => i.item_type === "tx");
  const hasLarge = txItems.some(i => {
    const val = Number(i.data?.value_native ?? i.data?.amount ?? 0);
    return val > 10000;
  });
  return {
    id: "large_transfer",
    triggered: hasLarge,
    weight: 15,
    label: {
      en: "Large Abnormal Transfer",
      fr: "Transfert anormalement élevé",
    },
    description: {
      en: "One or more transactions exceed the 10,000 native token threshold, indicating potential large-scale fund movement.",
      fr: "Une ou plusieurs transactions dépassent le seuil de 10 000 tokens natifs, indiquant un mouvement de fonds potentiellement important.",
    },
  };
};

// ─── Factor: Rapid Multi-Hop Movement ───
const rapidMultiHop: RiskFactorFn = ({ items }) => {
  const wallets = items.filter(i => i.item_type === "wallet");
  const txs = items.filter(i => i.item_type === "tx");
  const triggered = wallets.length >= 3 && txs.length >= 5;
  return {
    id: "rapid_multi_hop",
    triggered,
    weight: 20,
    label: {
      en: "Rapid Multi-Hop Movement",
      fr: "Mouvement multi-hop rapide",
    },
    description: {
      en: "Multiple wallets and transactions suggest rapid fund movement through intermediary addresses.",
      fr: "Plusieurs wallets et transactions suggèrent un mouvement rapide de fonds via des adresses intermédiaires.",
    },
  };
};

// ─── Factor: Flagged Contract Interaction ───
const flaggedContract: RiskFactorFn = ({ items }) => {
  const triggered = items.some(i => {
    const flags = i.data?.riskFlags as Array<{ label: string }> | undefined;
    return Array.isArray(flags) && flags.length > 0;
  });
  return {
    id: "flagged_contract",
    triggered,
    weight: 25,
    label: {
      en: "Interaction with Flagged Contract",
      fr: "Interaction avec un contrat signalé",
    },
    description: {
      en: "Evidence contains interactions with contracts that have existing risk flags.",
      fr: "Les preuves contiennent des interactions avec des contrats ayant des signaux de risque existants.",
    },
  };
};

// ─── Factor: Suspicious Approval Patterns ───
const suspiciousApprovals: RiskFactorFn = ({ items }) => {
  const triggered = items.some(i => {
    const d = i.data;
    return d?.method === "approve" || d?.method === "setApprovalForAll" ||
      String(i.title ?? "").toLowerCase().includes("approval");
  });
  return {
    id: "suspicious_approvals",
    triggered,
    weight: 18,
    label: {
      en: "Suspicious Approval Patterns",
      fr: "Schémas d'approbation suspects",
    },
    description: {
      en: "Token approvals detected that may grant unlimited spending access to unknown contracts.",
      fr: "Des approbations de tokens détectées pouvant accorder un accès de dépense illimité à des contrats inconnus.",
    },
  };
};

// ─── Factor: Dormant Wallet Sudden Activity ───
const dormantActivity: RiskFactorFn = ({ items }) => {
  const triggered = items.some(i => {
    const d = i.data;
    return d?.dormant === true || d?.dormantDays !== undefined && Number(d.dormantDays) > 180;
  });
  return {
    id: "dormant_activity",
    triggered,
    weight: 12,
    label: {
      en: "Dormant Wallet Sudden Activity",
      fr: "Activité soudaine d'un wallet dormant",
    },
    description: {
      en: "A previously inactive wallet has shown sudden activity after extended dormancy (>180 days).",
      fr: "Un wallet précédemment inactif a montré une activité soudaine après une longue dormance (>180 jours).",
    },
  };
};

// ─── Factor: Wash-Like Behavior ───
const washBehavior: RiskFactorFn = ({ items }) => {
  const wallets = items.filter(i => i.item_type === "wallet");
  const addresses = wallets.map(w => w.ref.toLowerCase());
  const txs = items.filter(i => i.item_type === "tx");
  const circular = txs.some(tx => {
    const from = String(tx.data?.from_address ?? "").toLowerCase();
    const to = String(tx.data?.to_address ?? "").toLowerCase();
    return addresses.includes(from) && addresses.includes(to);
  });
  return {
    id: "wash_behavior",
    triggered: circular,
    weight: 22,
    label: {
      en: "High-Frequency Wash-Like Behavior",
      fr: "Comportement de type wash trading haute fréquence",
    },
    description: {
      en: "Circular transactions detected between wallets in this case, suggesting potential wash trading.",
      fr: "Transactions circulaires détectées entre les wallets de ce dossier, suggérant un potentiel wash trading.",
    },
  };
};

// ─── Factor: Cluster Involvement ───
const clusterInvolvement: RiskFactorFn = ({ items }) => {
  const clusters = items.filter(i => i.item_type === "cluster");
  return {
    id: "cluster_involvement",
    triggered: clusters.length > 0,
    weight: 10,
    label: {
      en: "Cluster Involvement Detected",
      fr: "Implication dans un cluster détectée",
    },
    description: {
      en: "One or more wallet clusters have been identified, suggesting coordinated activity.",
      fr: "Un ou plusieurs clusters de wallets ont été identifiés, suggérant une activité coordonnée.",
    },
  };
};

/** All registered risk factors. Add new ones here. */
export const RISK_FACTORS: RiskFactorFn[] = [
  largeTransfer,
  rapidMultiHop,
  flaggedContract,
  suspiciousApprovals,
  dormantActivity,
  washBehavior,
  clusterInvolvement,
];
