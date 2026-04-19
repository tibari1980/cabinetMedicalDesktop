# PRD - Application de Gestion de Cabinet Médical (MedConnect)
## 1. Vue d'ensemble
L'objectif est de créer une solution logicielle complète pour la gestion d'un cabinet médical. L'application doit centraliser toutes les activités quotidiennes, de la prise de rendez-vous à la gestion des dossiers patients, en passant par la facturation et le suivi médical.
## 2. Objectifs du Produit
- **Efficacité Opérationnelle** : Automatiser les tâches administratives (secrétariat).
- **Précision Médicale** : Centraliser l'historique des patients pour un meilleur diagnostic.
- **Expérience Patient** : Simplifier la prise de rendez-vous et le suivi.
- **Reporting** : Offrir des insights sur l'activité du cabinet.
## 3. Utilisateurs Cibles
| Rôle | Responsabilités |
| :--- | :--- |
| **Médecin** | Consultations, ordonnances, dossiers médicaux, rapports d'activité. |
| **Secrétaire** | Accueil, planning des rendez-vous, facturation initiale, gestion des appels. |
| **Administrateur** | Gestion des comptes, configuration des tarifs, inventaire (si nécessaire). |
## 4. Fonctionnalités Clés (MVP)
### A. Gestion des Patients
- Création et édition de fiches patients (Données personnelles, antécédents, allergies).
- Recherche rapide par nom, ID ou numéro de téléphone.
- Historique complet des visites.
### B. Calendrier & Rendez-vous
- Vue hebdomadaire/journalière interactive.
- Prise de rendez-vous (Drag & Drop).
- Statuts des rendez-vous (Confirmé, En attente, Annulé, Terminé).
- Système de rappels.
### C. Consultations & Dossiers Médicaux
- Saisie des observations cliniques.
- Génération d'ordonnances (avec impression PDF).
- Stockage de documents (Scans, rapports de laboratoire).
- Module de biométrie (Tension, Poids, Température, etc.).
### D. Facturation & Paiement
- Génération de factures basées sur les actes médicaux.
- Suivi des paiements (Payé, Impayé, Partiel).
- Exportation des rapports financiers simplifiés.
### E. Dashboard (Tableau de Bord)
- Statistiques du jour : Nombre de patients, chiffre d'affaires.
- Alertes : Rendez-vous urgents, ruptures de stocks (fournitures médicales).
## 5. Spécifications Techniques
- **Frontend** : Angular (version la plus récente).
- **Styling** : Tailwind CSS (pour une UI moderne et responsive).
- **Gestion des Données (Phase 1)** : Fichiers JSON locaux pour simuler une base de données.
- **Architecture** : Services Angular pour la gestion des données, Composants modulaires pour chaque fonctionnalité.
## 6. Structure des Données (Fictive)
Exemple de format JSON pour les patients :
```json
{
  "patients": [
    {
      "id": "P001",
      "firstName": "Jean",
      "lastName": "Dupont",
      "birthDate": "1985-06-15",
      "gender": "M",
      "phone": "+33 6 12 34 56 78",
      "antecedents": ["Hypertension", "Allergie Pénicilline"]
    }
  ]
}
```
## 7. Design & Expérience Utilisateur (Aesthetics)
- **Palette de Couleurs** : Tons professionnels (Bleu Médical, Blanc pur, Gris doux, Vert succès).
- **Typographie** : Polices modernes et lisibles (Inter, Roboto).
- **Effets** : Glassmorphism léger, transitions fluides, mode sombre/clair.
- **Responsive** : Utilisation optimale sur tablettes et ordinateurs de bureau.