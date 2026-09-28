# La Cave de Pépé

Application web de gestion pour un commerce de sodabi.

Le projet est développé sous le nom de dépôt **CaveSodabi**, tandis que le nom de l'application est **La Cave de Pépé**.

## À propos

La Cave de Pépé est une application conçue pour faciliter la gestion quotidienne d'un commerce de sodabi.

L'objectif est de disposer d'un outil simple, rapide et utilisable principalement depuis un téléphone pour :

* enregistrer les ventes en temps réel ;
* suivre automatiquement le stock ;
* gérer les entrées de stock ;
* enregistrer les bonus accordés aux clients ;
* suivre les ventes à crédit ;
* enregistrer les paiements partiels et ultérieurs ;
* consulter l'historique ;
* suivre quelques statistiques essentielles ;
* permettre à plusieurs utilisateurs de travailler sur les mêmes données.

L'application privilégie la simplicité et la rapidité plutôt qu'une gestion commerciale ou comptable complexe.

## Produits

Les quatre formats principaux sont :

| Produit |   Volume |     Prix |
| ------- | -------: | -------: |
| Si      |   125 ml | 150 FCFA |
| Ka      |   250 ml | 300 FCFA |
| Demi    |   500 ml | 600 FCFA |
| Litre   | 1 000 ml | 800 FCFA |

Le stock est géré en volume physique.

Les valeurs de volume sont exprimées en millilitres dans la logique interne afin d'éviter les problèmes d'arrondi liés aux nombres décimaux.

## Gestion du stock

Le stock évolue automatiquement en fonction des mouvements enregistrés.

### Sorties

Une vente entraîne une diminution du stock correspondant au volume vendu.

Exemples :

* 1 Si → -125 ml
* 1 Ka → -250 ml
* 1 Demi → -500 ml
* 1 Litre → -1 000 ml

Les bonus accordés aux clients sont également considérés comme des sorties physiques de stock.

### Entrées

Lorsqu'un nouveau stock arrive, une entrée est enregistrée.

Exemple :

```text
Stock actuel : 8 625 ml
Nouvelle entrée : +25 000 ml
Nouveau stock : 33 625 ml
```

Les entrées de stock sont conservées dans l'historique.

### Corrections

Une correction manuelle peut être effectuée lorsqu'une différence est constatée entre le stock théorique et le stock réel.

Les corrections doivent être tracées et ne doivent pas être assimilées à des ventes.

## Ventes

L'application est conçue autour de ventes rapides.

Les quatre formats sont accessibles directement depuis l'écran principal :

* Si
* Ka
* Demi
* Litre

Une vente correspond à un produit et peut être enregistrée indépendamment des autres ventes.

Une vente peut éventuellement être associée à :

* un utilisateur/vendeur ;
* un client ;
* un paiement ;
* un bonus.

Ces informations supplémentaires doivent rester facultatives afin de conserver une utilisation rapide.

## Vente en gros

Le litre est vendu à **800 FCFA** lorsque le client achète en volume.

Plusieurs litres peuvent être enregistrés dans une même vente de produit.

Exemple :

```text
Litre × 5
5 000 ml
4 000 FCFA
```

## Bonus

Les clients qui achètent plusieurs litres peuvent recevoir un bonus.

À titre indicatif :

* plus de 3 L → un bonus de Si peut être accordé ;
* plus de 4 L → un bonus de Ka peut être accordé.

Ces règles ne sont cependant pas automatisées.

Le bonus est toujours décidé et saisi manuellement par l'utilisateur.

Exemples :

```text
5 L + aucun bonus
5 L + 1 Si
5 L + 2 Si
6 L + 1 Ka
```

Un bonus :

* diminue le stock ;
* ne génère aucun chiffre d'affaires ;
* doit être enregistré dans l'historique.

## Crédits

Les ventes à crédit existent mais restent relativement rares.

Le système est volontairement simple.

Une vente peut être :

* entièrement payée ;
* partiellement payée ;
* non payée.

Exemple :

```text
Vente : 300 FCFA
Paiement initial : 100 FCFA
Reste : 200 FCFA
```

Des paiements supplémentaires peuvent être enregistrés ultérieurement jusqu'au règlement complet.

Un même client peut avoir plusieurs ventes avec un solde restant.

Le montant restant est calculé à partir du montant de la vente et des paiements enregistrés.

## Paiement

Le commerce utilise uniquement le paiement en espèces pour le moment.

Les autres moyens de paiement ne font pas partie du MVP.

## Clients

L'enregistrement d'un client est facultatif.

Une vente peut être associée à un client enregistré ou rester anonyme.

Les informations d'un client peuvent comprendre :

* nom ;
* numéro de téléphone facultatif ;
* historique des ventes ;
* montants restant à payer.

L'application ne cherche pas à devenir un CRM complet.

## Utilisateurs

Plusieurs personnes peuvent utiliser l'application.

Chaque utilisateur dispose de son propre compte et peut être associé aux ventes qu'il enregistre.

Le MVP prévoit notamment des rôles simples tels que :

* Administrateur ;
* Vendeur.

Les permissions doivent rester simples et adaptées aux besoins réels du commerce.

## Fonctionnalités principales

### MVP

* Tableau de bord
* Ventes rapides
* Gestion du stock
* Entrées de stock
* Corrections de stock
* Bonus manuels
* Clients
* Crédits
* Paiements partiels et ultérieurs
* Historique des ventes
* Annulation/correction des ventes
* Alertes de stock faible
* Statistiques simples
* Gestion des utilisateurs
* Synchronisation des données entre utilisateurs

### Hors périmètre du MVP

Les fonctionnalités suivantes ne sont volontairement pas prévues dans la première version :

* Mobile Money
* paiement par carte
* paiement en ligne
* comptabilité avancée
* gestion complexe des fournisseurs
* gestion multi-entrepôts
* système de fidélité
* prédiction des ventes
* fonctionnalités IA
* notifications SMS
* rapports commerciaux complexes

Elles pourront être envisagées ultérieurement si les besoins du commerce évoluent.

## Interface

L'application est conçue selon une approche **mobile-first**.

Les priorités sont :

1. rapidité ;
2. simplicité ;
3. lisibilité ;
4. boutons facilement accessibles ;
5. navigation intuitive ;
6. feedback immédiat après une action ;
7. faible quantité de saisie nécessaire.

L'identité visuelle de **La Cave de Pépé** doit évoquer une cave à bouteilles et une réserve de boissons, avec une atmosphère chaleureuse et authentique.

L'interface doit rester moderne et fonctionnelle sans être surchargée.

## Architecture

L'application est destinée à être déployée sur :

* **Frontend :** React + TypeScript
* **Build :** Vite
* **Hébergement :** Vercel
* **Backend / base de données :** Firebase ou Supabase, choix à confirmer

L'architecture définitive sera déterminée avant l'implémentation complète du MVP.

Les règles métier importantes doivent être centralisées et ne doivent pas dépendre uniquement du frontend.

## Données principales

Le modèle de données devrait notamment gérer des concepts tels que :

```text
Users
Products
Sales
Payments
Clients
Stock Movements
```

La structure exacte de la base de données sera définie lors de la phase d'architecture.

## Principe de traçabilité

Les changements importants doivent être traçables.

Le système doit notamment conserver les mouvements liés :

* aux ventes ;
* aux bonus ;
* aux entrées de stock ;
* aux corrections ;
* aux paiements ;
* aux annulations.

Une opération importante ne doit pas simplement modifier une valeur sans laisser de trace lorsque cette trace est nécessaire à la cohérence du système.

## Développement

Le projet est développé progressivement.

Avant l'implémentation complète, les éléments suivants doivent être validés :

1. architecture technique ;
2. choix du backend et de la base de données ;
3. schéma de données ;
4. structure du projet ;
5. parcours utilisateur ;
6. écrans principaux ;
7. règles métier.

L'objectif est de construire un MVP réellement utilisable dans le commerce et pouvant évoluer progressivement.

## Statut

**En développement — MVP**

## Nom du projet

**Dépôt :** `cavesodabi`

**Application :** `La Cave de Pépé`
