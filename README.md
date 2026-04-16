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
* **Směrové vedení**: Vypočítává se pomocí `Math.atan2` z rozdílu souřadnic kurzoru a středu obraz
