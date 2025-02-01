const { exec } = require('child_process');
const path = require('path');

// Funktion zum Starten des Servers (server.js)
function startServer() {
  const serverPath = path.join(__dirname, 'server.js');
  const command = `node ${serverPath}`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Fehler beim Starten des Servers: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Fehler: ${stderr}`);
      return;
    }
    console.log('Server gestartet!');
  });
}

// Funktion zum Schließen von Chrome oder Edge
function closeBrowser(browser = 'chrome') {
  const command = browser === 'chrome'
    ? 'taskkill /F /IM chrome.exe'  // Für Windows (Chrome)
    : 'taskkill /F /IM msedge.exe';  // Für Windows (Edge)

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Fehler beim Schließen von ${browser}: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Fehler: ${stderr}`);
      return;
    }
    console.log(`${browser} wurde geschlossen.`);
  });
}

// Funktion zum Starten von Chrome oder Edge mit einer URL
function openBrowser(url, browser = 'chrome') {
  const command = browser === 'chrome'
    ? `start chrome ${url}`  // Für Windows (Chrome)
    : `start msedge ${url}`;  // Für Windows (Edge)

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Fehler beim Öffnen von ${browser}: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Fehler: ${stderr}`);
      return;
    }
    console.log(`${browser} geöffnet mit der URL: ${url}`);
  });
}

// Hauptfunktion: Schließen von Chrome, Starten des Servers und Öffnen von zwei URLs
function main() {
  // Zuerst den Browser (Chrome oder Edge) schließen
  closeBrowser('chrome');  // Oder 'edge' für Microsoft Edge

  // Dann den Server starten
  startServer();

  // Zwei Browser-URLs öffnen
  setTimeout(() => {
    openBrowser('http://localhost:4000/');  // URL 1
    openBrowser('http://localhost:4000/');  // URL 2
    openBrowser('http://localhost:4000/');  // URL 3
    openBrowser('http://localhost:4000/');  // URL 4
  }, 2000);  // Verzögerung von 2 Sekunden (damit der Server gut startet)
}

// Skript ausführen
main();
