# Guide de migration

Les sites générés par `create-staycore-site` contiennent **deux natures de code** :

1. **Le SDK** (`@staycore/booking-sdk`) — une dépendance npm → se met à jour avec npm.
2. **Le template** (composants copiés dans `src/` au moment du scaffold) → **ne se met PAS à jour** via npm. Il faut réappliquer les changements à la main.

> ⚠️ Rappel semver 0.x : un caret `^0.2.x` n'installe **pas** une `0.3.x` (en 0.x, chaque montée de mineure est une rupture). Il faut éditer la plage manuellement.

---

## → 0.3.0 — Taxe de séjour conforme + nuit orpheline

### 1. Mettre à jour le SDK (dépendance)

Dans le `package.json` du site :

```diff
-    "@staycore/booking-sdk": "^0.2.3",
+    "@staycore/booking-sdk": "^0.3.0",
```

Puis :

```bash
npm install   # ou pnpm install / yarn
```

Cela suffit pour : les nouveaux champs `adults_count` / `children_count` (types), `tourism_tax_detail`, et le recalcul de `usePrice`. Mais le SDK seul **n'affiche rien de nouveau** — il faut patcher le template (étape 2).

### 2. Réappliquer les changements template (code copié)

Deux fichiers à mettre à jour depuis le template de référence
(`templates/base/src/components/booking/`) :

- **`BookingForm.tsx`** — remplace le sélecteur unique « voyageurs » par deux
  compteurs **Adultes** / **Enfants (-18 ans)** ; envoie `adults_count` et
  `children_count` au prix et au checkout (`guests_count = adultes + enfants`).
- **`DatePickerCalendar.tsx`** — corrige la **nuit orpheline** : un jour d'arrivée
  d'une autre réservation devient cliquable comme **date de départ**.

Le plus simple : copier ces deux fichiers depuis le template à jour, puis
ré-appliquer tes éventuelles personnalisations (styles, libellés). Si tu n'as pas
modifié ces composants, un copier-coller direct suffit.

### 3. Rebuild + redeploy

```bash
npm run build
# puis redéploiement habituel (Vercel)
```

### Côté PMS

Pour que le calcul soit réellement conforme, l'organisation doit, dans le PMS :
renseigner le **classement** (et le code INSEE) de chaque logement, puis passer
le moteur de réservation en mode **« barème automatique »**. Sans ça, le calcul
reste sur le forfait historique (rétro-compatible).
