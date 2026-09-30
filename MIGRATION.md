# Guide de migration

Les sites générés par `create-staycore-site` contiennent **deux natures de code** :

1. **Le SDK** (`@staycore/booking-sdk`) — une dépendance npm → se met à jour avec npm.
2. **Le template** (composants copiés dans `src/` au moment du scaffold) → **ne se met PAS à jour** via npm. Il faut réappliquer les changements à la main.

> ⚠️ Rappel semver 0.x : un caret `^0.2.x` n'installe **pas** une `0.3.x` (en 0.x, chaque montée de mineure est une rupture). Il faut éditer la plage manuellement.

---

## → 0.4.0 — Options, chat, formulaire de contact, cartes cadeaux

Tout est additif : un site en 0.3 continue de fonctionner sans rien changer.

### 1. Mettre à jour le SDK

```bash
pnpm add @staycore/booking-sdk@^0.4.0
```

### 2. Ce que vous pouvez brancher

- **Options** (`pms.options.list`, hook `useOptions`) : passez la sélection à `price.compute` et à `checkout.create` sous la forme `options: [{ id, quantity }]`. Si vous appeliez déjà la route `/options` à la main, remplacez l'appel par le SDK.
- **Carte cadeau au paiement** : un champ « code carte cadeau » qui passe `gift_card_code` au devis puis au checkout. Affichez `amount_due` plutôt que `total` sur le bouton de paiement, et sautez Stripe quand le checkout répond `payment_required: false`.
- **Vente de cartes cadeaux** : `pms.giftCards.checkout` → Stripe Elements → `pms.giftCards.confirm`, exactement comme une réservation.
- **Chat** : le hook `useChat({ active })`. Les messages portent un `role` (`visitor`, `assistant`, `host`).
- **Formulaire de contact** : `pms.contact.send`.

N'affichez un module que si `config().modules.<module>.enabled` est vrai : l'hôte les active un par un dans Moteur de résa › Site web.

### 3. CORS

Les nouvelles routes vivent sous `/api/v1/book/{slug}` : votre domaine, déjà autorisé pour la réservation, l'est aussi pour elles.

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
