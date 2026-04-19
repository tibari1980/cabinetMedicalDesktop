# Guide : Installation du Cabinet Médical Hors-Ligne (Mode Desktop)

Ce guide détaille les étapes pour transformer l'application **MedConnect** en un logiciel autonome utilisable sans connexion internet sur l'ordinateur d'un médecin.

## ⚠️ Prérequis sur l'ordinateur cible
Pour les méthodes ci-dessous, l'ordinateur doit avoir :
- **Node.js** (LTS) installé (pour exécuter ou compiler l'application).
- Un navigateur moderne (Chrome, Edge ou Firefox).

---

## Option 1 : Transformer en Application Desktop (.exe) avec Electron
C'est la solution la plus professionnelle. L'application devient un logiciel indépendant avec son propre icône.

### Étape 1 : Installer Electron dans le projet
Dans le terminal du projet :
```bash
npm install --save-dev electron
```

### Étape 2 : Créer le fichier `main.js` (à la racine)
Créez un fichier nommé `main.js` qui dira à Electron comment ouvrir Angular :
```javascript
const { app, BrowserWindow } = require('electron')
const path = require('path')

function createWindow () {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, 'src/favicon.ico'),
    webPreferences: {
      nodeIntegration: true
    }
  })

  // Charge le build d'Angular
  win.loadFile('dist/med-connect/index.html')
}

app.whenReady().then(createWindow)
```

### Étape 3 : Configurer le build
Dans `angular.json`, modifiez la ligne `"baseHref": "/"` en `"baseHref": "./"` (ou gérez-le durant le build) pour que les fichiers soient trouvés localement.

### Étape 4 : Compiler et Lancer
1. Compilez Angular : `ng build`
2. Lancez Electron : `npx electron .`

---

## Option 2 : Installation via Serveur Local (Plus simple)
Idéal si vous voulez simplement que le médecin tape une adresse (ex: `http://localhost`) sans Internet.

### Étape 1 : Compiler le projet
```bash
ng build --configuration production
```
Le dossier `dist/med-connect` contient tous les fichiers nécessaires.

### Étape 2 : Utiliser un serveur ultra-léger
Installez un serveur statique mondial :
```bash
npm install -g http-server
```
Lancez l'application au démarrage de Windows :
```bash
http-server ./dist/med-connect -p 8080
```
Le médecin accède à son cabinet sur `http://localhost:8080`.

---

## Option 3 : Mode PWA (Installation via le navigateur)
Permet d'installer l'application depuis Chrome comme si c'était un logiciel.

### Étape 1 : Ajouter le module PWA
```bash
ng add @angular/pwa
```

### Étape 2 : Utilisation
Une fois le site déployé (même localement), une icône "+" apparaît dans la barre d'adresse. Une fois "installée", l'application fonctionne totalement **hors-ligne** grâce aux "Service Workers".

---

## Gestion de la Base de Données (Hors-Ligne)

| Solution | Avantages | Usage conseillé |
| :--- | :--- | :--- |
| **Fichiers JSON** | Très simple, aucun setup. | Début de projet / Petit cabinet. |
| **SQLite** | Robuste, sécurisé, rapide. | **Recommandé pour Electron.** |
| **IndexedDB** | Intégré au navigateur. | Recommandé pour le mode PWA. |

### Conseil de sécurité :
Puisque les données sont locales, conseillez au médecin de faire une **sauvegarde régulière** du dossier `assets/data` (ou du fichier SQLite) sur une clé USB externe.

---

## Résumé du flux de travail pour le déploiement
1. Vous développez les fonctionnalités sur votre machine.
2. Vous faites un `ng build`.
3. Vous compressez le dossier `dist` et vous le décompressez sur l'ordinateur du médecin.
4. Vous créez un raccourci sur son bureau vers le fichier `.exe` (si Electron) ou vers l'URL locale.
