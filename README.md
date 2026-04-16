# Jak funguje naše hra Cubes 2048 (Technický pohled)

Tenhle dokument vysvětluje, co se děje v pozadí naší hry Cubes 2048. Celý projekt jsme postavili na čistém JavaScriptu, HTML a CSS, takže k běhu není potřeba nic instalovat – stačí prohlížeč.

---

## 1. Jak jsme to poskládali
Hru jsme nenavrhli přes klasické obrázky, ale všechno necháváme vykreslovat přímo na "plátno" (HTML5 Canvas). 
* **script.js**: Tady jsme vytvořili veškerý mozek hry. Řešíme tu pohyb, detekci kolizí i to, jak se chovají boti.
* **Game Loop**: Nastavili jsme herní smyčku, která se v podstatě 60krát za sekundu celá smaže a znovu vykreslí. Díky tomu je pohyb plynulý a všechno působí živě.

---

## 2. Mechanika "Hada" a spojování kostek
Nechtěli jsme, aby to byl jen tupý čtverec, co se zvětšuje. Každého hráče jsme pojali jako řetězec kostek.
* **Pohyb**: První kostka (hlava) následuje myš a ostatní články se táhnou za ní jako provázek.
* **Slučování (Merge)**: Když hráč narazí hlavou do kostky se stejným číslem, naprogramovali jsme jejich spojení do jedné, přičemž se hodnota zdvojnásobí (2, 4, 8, 16...). 
* **Třídění**: Aby to vypadalo dobře, hra po každém sebrání kostky pole automaticky "přerovná". Nejsilnější kostka zůstává vždycky vepředu, aby bylo hned jasné, kdo na ploše dominuje.

---

## 3. Inteligentní kamera
Když má hráč hodně bodů, kostky jsou obrovské. Aby se vůbec vešly na displej, vymysleli jsme funkci pro **automatický zoom**. Čím větší má hráč skóre, tím víc se kamera oddálí. Vyladili jsme to tak, aby to nebylo skokové, ale krásně plynulé.

---

## 4. Jak přemýšlejí naši boti (AI)
Do mapy jsme přidali 15 botů. Nechtěli jsme, aby se hýbali náhodně, takže se v každém okamžiku rozhodují podle svého okolí:
* **Strach**: Pokud boti uvidí někoho většího, okamžitě otočí směr a zkusí utéct.
* **Lov**: Pokud je čistý vzduch, prioritně vyhledávají nejbližší menší kostky nebo bonusy (třeba "2x"), aby vyrostli.
* **Hranice**: Naprogramovali jsme jim hlídání okrajů mapy, aby se nezasekli v rohu a včas se odrazili zpět do hry.

---

## 5. Ovládání a vychytávky
* **Boost (Sprint)**: Přidali jsme možnost zrychlení. Aby to nebylo nefér, omezili jsme ho na 5 sekund a pak se musí energie pomalu dobít.
* **Leaderboard**: Tabulka vpravo nahoře se aktualizuje dynamicky, takže hráči hned vidí, jestli se dostali do TOP 10.
* **Vizuál**: Každé číslo má svou barvu podle standardu 2048. Použili jsme zaoblené rohy, aby kostky vypadaly moderně a příjemně.

---

## 6. Budoucí optimalizace
I když nám hra běží dobře, máme pár nápadů, jak ji v budoucnu vylepšit:
1.  **Lepší detekce kolizí**: Až bude na mapě stovky objektů, plánujeme použít systém "sektorů" (Quadtree), aby se procesor tolik nepotil.
2.  **Mobilní verze**: Chceme přidat virtuální joystick na displej pro pohodlné hraní na telefonech.
3.  **Efekty**: Rádi bysme přidali částicové efekty nebo záblesky při "snědení" nepřítele nebo při úspěšném spojení kostek.
4.  **Multiplayer**: Naším výhledovým cílem je vyměnit boty za skutečné lidi a propojit je přes internet.
