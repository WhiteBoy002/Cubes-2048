# Technická dokumentace: Cubes 2048

Tento dokument slouží jako technický manuál k architektuře, mechanikám a implementaci webové hry **Cubes 2048**. Projekt využívá objektově orientovaný přístup v JavaScriptu a hardwarově akcelerované vykreslování skrze HTML5 Canvas.

---

## 1. Architektura systému

Hra je postavena jako vysoce výkonná klientská aplikace (SPA), která běží kompletně v prohlížeči uživatele.

### Souborová struktura a Data-Flow
* **index.html**: Hostitelský kontejner pro `<canvas>` a vrstvy uživatelského rozhraní (UI).
* **style.css**: Vizuální definice využívající moderní prvky jako *Glassmorphism* (rozostření pozadí) pro boční panely.
* **script.js**: Obsahuje herní engine, třídy entit a hlavní smyčku (`Game Loop`), která běží na frekvenci ~60 FPS.

---

## 2. Herní mechaniky a logika

### Růst a proces slučování (Merge System)
Každá entita se skládá z dynamického pole instancí třídy `Cube`. Logika v metodě `mergeBody()` zajišťuje:
1.  **Validaci kolize**: Detekce dotyku hlavy entity s jiným segmentem.
2.  **Inkrementaci**: Při shodě hodnot dochází k upgradu na $2^{n+1}$ a odstranění duplicitního článku.
3.  **Hierarchické řazení**: Metoda `.sort()` udržuje nejsilnější článek v čele, což definuje vizuální a herní dominanci.

### Dynamická kamera a logaritmický zoom
Hra řeší problém "velkých měřítek" pomocí adaptivního výpočtu zorného pole. Hodnota přiblížení se mění logaritmicky, aby růst nebyl lineární a hráč neztratil přehled o okolí:

$$camera.zoom = \frac{1}{1 + (\log_2(player.value) - 1) \times 0.15}$$

---

## 3. Implementace Umělé Inteligence (NPC)

Systém simuluje autonomní agenty (boty), kteří se rozhodují v každém snímku pomocí metody `think()`:

* **Vektorový útěk**: Pokud je detekována entita s vyšší hodnotou v kritické vzdálenosti, bot vypočítá opačný vektor pohybu ($\vec{V}_{escape} = \vec{P}_{bot} - \vec{P}_{target}$).
* **Akvizice cílů**: Algoritmus prioritizuje Power-Upy (2x) a menší cíle pro maximalizaci růstu.
* **Bounding Box**: Inteligentní odraz od hranic herního světa (WORLD_SIZE) zabraňuje uvíznutí botů na okrajích.

---

## 4. Uživatelské rozhraní a ovládání

### Interakce a fyzika pohybu
* **Směrové vedení**: Vypočítává se pomocí `Math.atan2` z rozdílu souřadnic kurzoru a středu obrazovky.
* **Boost systém**: Implementuje dočasné zvýšení rychlosti (multiplikátor 1.8x) s vázaným časovačem a automatickou regenerací energie v čase.

### Persistence a UI
* **Leaderboard**: Real-time žebříček TOP 10 entit, řazený podle celkového součtu hodnot všech článků.
* **Local Storage**: Trvalé ukládání High Score, které zůstává zachováno i po obnovení stránky.

---

## 5. Grafické zpracování

Vizuální styl definuje čistý Dark Mode s barevným schématem odpovídajícím standardu 2048.

| Hodnota | HEX kód | Efekt |
| :--- | :--- | :--- |
| 2 - 4 | #eee4da / #ede0c8 | Základní barvy |
| 8 - 64 | #f2b179 / #f65e3b | Oranžové/Červené tóny |
| 1024 - 2048 | #edc22e / #3c3a32 | Zlatý / Tmavý efekt se září |

Pro plynulost hran je využita metoda `ctx.roundRect`, která zajišťuje moderní "soft" vzhled všech herních objektů.

---

## 6. Budoucí optimalizace

Pro další rozvoj projektu jsou navržena následující technická vylepšení:

1.  **Quadtree Spatial Partitioning**: Nahrazení lineární detekce kolizí ($O(n^2)$) prostorovou strukturou pro zvýšení FPS při vysokém počtu entit.
2.  **Mobile Touch Engine**: Implementace virtuálního joysticku a gest pro plnou podporu mobilních zařízení.
3.  **Particle System**: Přidání vizuálních efektů (částic) při destrukci nepřátel nebo úspěšném merge procesu.
4.  **Multiplayer (WebSockets)**: Přechod z lokální simulace na synchronizovaný herní server pro souboj reálných hráčů.
