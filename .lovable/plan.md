

## Plan: Audit i18n + vérification des clés API

### 1. Problèmes de traduction identifiés

Plusieurs textes sont en dur (français uniquement ou anglais uniquement) au lieu d'utiliser le système `useI18n()`. Voici la liste complète :

**`src/components/BottomNav.tsx`** — Labels en anglais dur ("Center", "Investigate", "Hub", "Wallet", "Settings") au lieu d'utiliser `t()`.

**`src/components/MoreSheet.tsx`** :
- Labels Hub en anglais dur ("Watchlists", "Alert Rules", "Radar", "Clusters", "Opportunities", "New Listings")
- Description en français dur : "Accédez rapidement à tous vos outils..."
- Message Pro mode en anglais dur : "Switch to Pro mode in Settings to see all tools"

**`src/pages/WalletActivity.tsx`** — Tout est en français dur :
- "Wallet Explorer", "Explorez le contenu...", "Explorer", "Entrez une adresse wallet", "Ouvrir le Scanner complet", etc.

**`src/components/wallet/WalletPortfolioWidget.tsx`** — Tout en français dur :
- "Wallet vide sur Cronos", "Ce wallet ne contient aucun CRO...", "Vérifier sur Cronoscan", "Valeur estimée", "Quota API atteint", etc.

**`src/pages/AlertsPage.tsx`** :
- Textes français durs : "alertes · non lues", "Tout lire", "alerte(s) critique(s) en attente", "Surveillance en temps réel..."
- Labels de filtre en français dur : "Tous", "Risque", "Prix", "Liquidité"
- Labels de priorité en français dur : "Critique", "Haute", "Moyenne", "Basse"
- Groupes de temps en français dur : "Maintenant", "Dernière heure", "Aujourd'hui", "Plus ancien"

**`src/pages/Opportunities.tsx`** :
- Description en français dur : "Chaque token est noté automatiquement..."

**`src/pages/Radar.tsx`** :
- Description en français dur : "Vue en temps réel de tous les tokens..."

**`src/pages/NewListings.tsx`** :
- Description en français dur : "Tokens récemment listés sur les DEX..."

### 2. Corrections à apporter

- **Ajouter ~40 nouvelles clés** dans `src/lib/i18n.tsx` pour couvrir tous les textes manquants
- **Remplacer tous les textes en dur** par des appels `t('clé')` dans les 7 fichiers concernés
- **Vérifier la cohérence** des traductions existantes (certaines sont correctes)

### 3. Clés API — État actuel

Le projet a déjà toutes les clés nécessaires configurées :

| Secret | Usage | Statut |
|--------|-------|--------|
| `MORALIS_API_KEY` | Données on-chain (wallets, tokens, NFTs) | ✅ Configuré |
| `CMC_API_KEY` | Prix CoinMarketCap | ✅ Configuré |
| `STRIPE_SECRET_KEY` | Paiements premium | ✅ Configuré |
| `ADMIN_PIN` / `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Admin | ✅ Configuré |

**Tu n'as pas besoin de rajouter d'autres clés API.** Tout est déjà en place. Le seul point à vérifier côté Moralis, c'est que ton forfait (tu mentionnes "Mentalist" — c'est probablement le plan Moralis) est bien actif et que le quota quotidien n'est pas dépassé. Si tu es sur le plan gratuit, les limites sont vite atteintes. Un plan payant Moralis résout les erreurs "Quota API atteint".

### 4. Fichiers modifiés

1. `src/lib/i18n.tsx` — Ajout de ~40 nouvelles clés bilingues
2. `src/components/BottomNav.tsx` — Labels traduits via `t()`
3. `src/components/MoreSheet.tsx` — Labels et descriptions traduits
4. `src/pages/WalletActivity.tsx` — Tous les textes traduits
5. `src/components/wallet/WalletPortfolioWidget.tsx` — Tous les textes traduits
6. `src/pages/AlertsPage.tsx` — Labels, descriptions et filtres traduits
7. `src/pages/Opportunities.tsx` — Description traduite
8. `src/pages/Radar.tsx` — Description traduite
9. `src/pages/NewListings.tsx` — Description traduite

