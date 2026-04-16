# Technická dokumentace projektu: Cubes 2048 

Tento dokument poskytuje komplexní přehled o architektuře, mechanikách a implementaci webové hry **Cubes 2048**. Projekt je hostován jako živá webová aplikace na adrese:  [https://whiteboy002.github.io/Cubes-2048/).

---

## 1. Architektura systému

Hra je vyvinuta jako jednostránková webová aplikace postavená na technologiích HTML5, CSS3 a JavaScript.

### Souborová struktura
* **index.html**: Definuje DOM strukturu, vrstvy uživatelského rozhraní (UI) a kontejner pro plátno.
* **style.css**: Obsahuje vizualizaci herního menu, typografii a definice pro skleněné efekty bočních panelů.
* **script.js**: Obsahuje veškerou herní logiku, fyzikální engine a stavy hry.
* **bgm.mp3**: Externí audio asset pro ambientní podkres.

---

## 2. Herní mechaniky a logika

### Růst a slučování (Merge System)
Základní jednotkou hry je třída `Cube`. Na rozdíl od klasických her typu "snake", zde každá kostka v řetězci nese číselnou hodnotu (mocninu čísla 2). 

Logika slučování v metodě `mergeBody()` funguje následovně:
1. Iterace skrze pole segmentů entity.
2. Porovnání hodnoty sousedních nebo vnitřních článků.
3. Při shodě hodnot se jeden článek odstraní a druhý inkrementuje svou hodnotu na dvojnásobek ($v_{new} = v_{old} \times 2$).
4. Pole se následně seřadí sestupně, aby nejsilnější článek tvořil hlavu entity, která určuje kolizní prioritu.

### Dynamická kamera a zoom
Pro zajištění hratelnosti při vysokých hodnotách (velkých rozměrech kostek) hra implementuje adaptivní zoom. Hodnota přiblížení je vypočítávána logaritmicky na základě hodnoty hlavního segmentu:

$$camera.zoom = \frac{1}{1 + (\log_2(player.value) - 1) \times 0.15}$$

Tento výpočet zajišťuje, že se zorné pole rozšiřuje plynule a proporcionálně k růstu hráče.

---

## 3. Implementace Umělé Inteligence (NPC)

Hra simuluje prostředí s 15 nezávislými boty. Každý bot se rozhoduje v reálném čase na základě stavu okolního světa v metodě `think()`.

* **Detekce hrozeb**: Pokud je vzdálenost k nepříteli s vyšší hodnotou menší než 550 jednotek, bot okamžitě mění směr o 180 stupňů (vektorový útek).
* **Akvizice cílů**: Pokud bot není v ohrožení, prioritně vyhledává Power-Up "2x" nebo menší entity, které může absorbovat.
* **Hranice světa**: Při dosažení souřadnic WORLD_SIZE (3000 jednotek od středu) bot provede odraz úhlu, aby neopustil herní plochu.

---

## 4. Uživatelské rozhraní a ovládání

### Interakce
* **Směrové vedení**: Vypočítává se jako arkus tangens (`Math.atan2`) rozdílu pozice kurzoru a středu plátna.
* **Boost systém**: Sprint zvyšuje základní rychlost z 3.2 na 5.76 jednotek za snímek. Je řízen časovačem `boostTimer` s kapacitou 5 sekund a automatickou regenerací.

### Prvky UI
* **Leaderboard**: Dynamicky generovaný seznam TOP 10 entit, aktualizovaný každých 400ms.
* **Persistence dat**: Nejvyšší dosažené skóre se ukládá do `localStorage` prohlížeče, což umožňuje sledování progresu bez nutnosti databáze.

---

## 5. Grafické zpracování a barvy

Vizuální styl využívá tmavé pozadí (#0b0b0b) s kontrastními barvami segmentů, které odpovídají standardu hry 2048.

| Hodnota | Barva HEX | Barva textu |
| :--- | :--- | :--- |
| 2 | #eee4da | #776e65 |
| 8 | #f2b179 | #ffffff |
| 64 | #f65e3b | #ffffff |
| 2048 | #3c3a32 | #ffffff |

Pro vykreslování zaoblených rohů kostek je využita metoda `ctx.roundRect`, která dodává hře moderní vzhled.

---

## 6. Pokyny pro nasazení (Deployment)

Vzhledem k povaze projektu je nasazení na GitHub Pages optimální volbou.

1. Ujistěte se, že všechny soubory jsou v kořenovém adresáři repozitáře.
2. V nastavení GitHub repozitáře aktivujte sekci **Pages**.
3. Zvolte větev `main` jako zdroj pro sestavení.
4. Hra bude dostupná na adrese `https://whiteboy002.github.io/CubeGame/`.

---

## 7. Budoucí optimalizace

* **Mobilní podpora**: Implementace dotykových událostí pro ovládání na mobilních zařízeních.
* **Optimalizace kolizí**: Využití prostorového rozdělení (např. Quadtree) pro efektivnější detekci kolizí při vyšším počtu entit.
* **Audio efekty**: Přidání zvukových vzorků pro procesy slučování a eliminace.
