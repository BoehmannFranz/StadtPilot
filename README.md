# **Machbarkeitsuntersuchung & Vision – StadtPilot 3D PoC**

## **1. Vision**  
**StadtPilot 3D** ist ein **Proof of Concept** für eine interaktive 3D-Simulation einer modernen Kleinstadt.  
Die Grundidee ist, **kommunale Planungsentscheidungen** für Fachplaner, Verwaltung und interessierte Bürger **visuell und intuitiv** nachvollziehbar zu machen.  

Die Hauptfunktionen der Vision:  
- Platzierung von **Feuerwachen**, **Kindertagesstätten (Kitas)** und **Schulen**  
- Sofortige **Heatmap-Visualisierung** der Bürgerzufriedenheit in Abhängigkeit der Abdeckung  
- Eine **einfach verständliche Benutzeroberfläche**, die den Einfluss der Infrastruktur auf die Stadt direkt zeigt  

**Langfristige Vision:**  
StadtPilot 3D könnte sich zu einem interaktiven Stadtplanungs- und Bürgerbeteiligungstool entwickeln, das reale Geodaten nutzt und politische Entscheidungen durch Simulation unterstützt.  

---

## **2. Technische Umsetzung des PoC**

Der PoC wurde vollständig im Browser mit folgenden Technologien umgesetzt:  

- **HTML5** – Grundstruktur und UI-Elemente  
- **JavaScript (ES6)** – Logik für Interaktion, Heatmap und Objektplatzierung  
- **Three.js** – Rendering-Engine für die 3D-Visualisierung  
- **OrbitControls** – Kamerasteuerung zur freien Bewegung in der Stadt  
- **Eigenes Heatmap-System** – Farbkodierte Flächen je nach Versorgungsgrad  

Die Stadt besteht aus:  
- **Grundfläche** mit Straßennetz (Rasterstruktur)  
- Zufällig platzierten Gebäuden (Wohnhäuser, Deko)  
- Bäumen und Grünflächen  
- Rasterbasierten Heatmap-Kacheln zur Darstellung der Bürgerzufriedenheit  

**Platzierungslogik:**  
- Jeder Gebäudetyp hat einen definierten Versorgungsradius (Feuerwehr 2000 m, Kita 100 m, Schule 600 m)  
- Jede Rasterzelle wird ausgewertet, ob sie von einer oder mehreren Einrichtungen abgedeckt wird  
- Die Heatmap wird in Echtzeit aktualisiert, sobald ein neues Gebäude platziert wird  

---

## **3. Vorgehensweise (Vibecoding-Ansatz)**

Der PoC wurde nach dem **Vibecoding-Prinzip** entwickelt:  
- **Schnell sichtbare Ergebnisse** anstreben  
- Direkte Anpassung von Code & visuellem Feedback ohne große Build-Tools  
- Fokus auf **Machbarkeit und Spaß am Experimentieren**, nicht auf perfekter Architektur  

Dadurch konnten erste funktionierende Versionen **innerhalb weniger Stunden** erstellt werden, inklusive:
- Grundszene mit Kamera & Steuerung  
- Platzierbare Objekte  
- Dynamische Heatmap-Logik  

---

## **4. Herausforderungen**

Während der Umsetzung traten einige **technische Stolpersteine** auf:  

### **a) Bibliotheken & Abhängigkeiten**
- Das Einbinden von `three.min.js` und `OrbitControls.js` aus lokalen Dateien führte zu **Ladefehlern**  
- Lösung: Lokalen Webserver nutzen statt direktem Öffnen der HTML-Datei (Vermeidung von CORS-Fehlern)  

### **b) Modul- vs. Nicht-Modul-Skripte**
- Neuere Three.js-Versionen setzen auf ES6-Module, was zu **Importfehlern** führte  
- Lösung: Klassische UMD-Version von Three.js und OrbitControls verwenden  

### **c) Zeitaufwand für Fehlersuche**
- Ein erheblicher Teil der Entwicklungszeit floss in das **Debugging kleinerer Integrationsprobleme**  
- Häufig lag der Fehler nicht im Code selbst, sondern in der **Lade- und Pfadstruktur** der Dateien  

---

## **5. Machbarkeitsbewertung**

| **Kriterium**                  | **Bewertung** |
|--------------------------------|---------------|
| Entwicklungsaufwand für PoC    | Gering bis mittel |
| Einstiegshürde                 | Niedrig (HTML & JS Grundkenntnisse genügen) |
| Ergebnisqualität               | Gut für Prototypen, begrenzt realistisch |
| Erweiterbarkeit zu Realspiel   | Niedrig – erfordert Game Engine |
| Interaktive Visualisierung     | Sehr gut umsetzbar |

---

## **6. Grenzen des Ansatzes**

Obwohl der PoC das Ziel der Visualisierung erfüllt, gibt es klare **Limitierungen**:  
- **Keine vollständige Game-Engine**: Für ein echtes Simulationsspiel bräuchte es KI-Logik, Bewegungsphysik, Asset-Streaming und ein Eventsystem  
- **Keine persistente Speicherung**: Platzierungen gehen beim Neuladen verloren  
- **Einfache Geometrien**: Gebäude und Landschaft sind rein stilisierte Platzhalter  

---

## **7. Fazit**

Die Umsetzung zeigt klar:  
- **Mit einfachem JavaScript, HTML und Three.js** lassen sich schnell erste, funktionierende interaktive 3D-Anwendungen entwickeln  
- Bereits einfache Logiken können **komplexe Konzepte** wie Bürgerzufriedenheit räumlich veranschaulichen  
- Für eine Weiterentwicklung zu einem realistischen Spiel oder Planungstool ist eine **strukturierte, modulare Game Engine** notwendig  

> **Schlussfolgerung:**  
> StadtPilot 3D beweist, dass man mit minimalem Setup und schnellem Prototyping visuell ansprechende und interaktive Stadt-Heatmaps realisieren kann.  
> Für den produktiven Einsatz oder eine realitätsnahe Simulation wäre jedoch ein deutlich aufwendigerer technischer Unterbau erforderlich.
