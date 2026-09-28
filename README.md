# La Cave de Pépé — étapes 1 et 2

Ce dossier contient :
- **`supabase/`** : le schéma de base de données (étape 2), à exécuter dans cet ordre :
  1. `migrations/0001_schema.sql` — tables, contraintes, vues
  2. `migrations/0002_functions.sql` — fonctions serveur (règles métier)
  3. `migrations/0003_security_dev.sql` — sécurité **temporaire** (voir avertissement dans le fichier)
  4. `seed.sql` — réglages, les 4 produits, 2 vendeurs de test
- **`src/`** : le socle React (étape 1) + le premier écran fonctionnel : **vente rapide + tableau de bord**.

## Mettre en place Supabase

1. Crée un projet sur https://supabase.com (gratuit).
2. Dans l'éditeur SQL du projet, colle et exécute les 3 fichiers de `supabase/migrations/` dans l'ordre, puis `supabase/seed.sql`.
3. Dans *Project Settings → API*, récupère l'URL du projet et la clé `anon public`.
4. Copie `.env.example` en `.env` et renseigne ces deux valeurs.

⚠️ Tant que la connexion (étape 9 du plan) n'est pas en place, la base est ouverte à qui connaît l'adresse.
**N'y mets pas les vraies ventes du commerce pour l'instant** — uniquement des données de test.

## Lancer le projet en local

```bash
npm install
npm run dev
```

Ouvre l'adresse affichée (en général http://localhost:5173). Sur ton téléphone, connecté au même réseau,
Vite affiche aussi une adresse locale (`--host`) que tu peux ouvrir pour tester la disposition mobile.

## Vérifier que tout compile

```bash
npm run typecheck
npm run build
```

## Déployer sur Vercel

1. Pousse ce dossier sur un dépôt Git (GitHub, etc.).
2. Importe le dépôt dans Vercel.
3. Dans les réglages du projet Vercel, ajoute les variables d'environnement `VITE_SUPABASE_URL` et
   `VITE_SUPABASE_ANON_KEY` (les mêmes que dans ton `.env`).
4. Déploie.

## Ce qui fonctionne déjà

- Vente rapide : Si / Ka / Demi / Litre, quantité ajustable, client facultatif (créé à la volée),
  paiement comptant ou partiel, bonus manuel (un produit, quantité libre).
- Le stock affiché en haut se met à jour en temps réel entre les téléphones connectés.
- Les autres onglets (Historique, Crédits, Stock, Plus) sont des emplacements réservés :
  ce sera l'objet des prochaines étapes.

## Note sur cet environnement de développement

Je n'ai pas d'accès réseau dans cet environnement, donc je n'ai pas pu lancer `npm install` /
`npm run build` moi-même pour te le confirmer. Le code a été écrit et relu avec soin (types stricts,
imports cohérents), mais lance `npm run typecheck` de ton côté dès que possible et dis-moi si
quelque chose coince — je corrigerai.
