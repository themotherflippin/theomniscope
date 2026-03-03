

## Plan: Centrer le bouton Hub dans la barre de navigation

Le bouton "Hub" doit toujours être en position centrale (3ème sur 5) dans la `BottomNav`.

### Modification

**`src/components/BottomNav.tsx`** : Réordonner le tableau `tabs` pour placer Hub au milieu :

1. Center (Home)
2. Investigate (Search)
3. **Hub (Compass)** ← au milieu
4. Wallet
5. Settings

Actuellement l'ordre est : Center, Investigate, Wallet, Hub, Settings. Il suffit d'inverser Wallet et Hub.

