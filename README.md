# Flit Flat

Jednoduchá aplikácia v slovenčine na správu investičných bytov. React + Vite s voliteľnou súkromnou synchronizáciou cez Supabase. Vyžaduje Node.js 22.12+ (overené s 24.19) a npm.

## Spustenie

```sh
cd /workspace/flit-flat
npm ci
npm run dev -- --port 5173
```

Použite existujúci checkout; cloudová úloha je už izolovaná a nepotrebuje ďalší Git worktree.

## Funkcie

- Pridanie, úprava a odstránenie nehnuteľností, údaje nájomníkov a dohodnuté nájomné.
- Mesačné, kvartálne a ročné predpisy za elektrinu, plyn, vodu, spoločné priestory, internet, poistenie a ostatné služby.
- Manuálne označenie úhrady pre konkrétny mesiac, prehľad splatnosti a filtrovanie podľa bytu alebo stavu.
- Kompletná ZIP záloha vrátane dokumentov a fotiek, obnovenie s validáciou; aj import starších JSON záloh.
- Voliteľné fiktívne ukážkové portfólio, responzívne rozhranie pre mobil aj počítač.

Prihlásenie a prenos existujúcich údajov nastavte podľa [návodu Supabase](docs/SUPABASE.md). V cloudovom režime sú údaje a prílohy súkromne v Supabase a dostupné rovnakému účtu na ďalších zariadeniach. Bez prihlásenia možno explicitne zvoliť lokálny režim.

Lokálny režim začína prázdnym portfóliom. Jeho údaje a prílohy sa ukladajú do IndexedDB `flit-flat-files-v1` v tomto prehliadači. Pôvodné dáta z localStorage pod kľúčom `flit-flat-v1` sa pri prvom načítaní automaticky načítajú a pri uložení sa prenesú do databázy. Pôvodná kópia sa odstráni až po úspešnom uložení do databázy. Záloha obsahuje osobné údaje: uchovávajte ju bezpečne. V lokálnom režime sa dáta neposielajú na server a nesynchronizujú medzi zariadeniami. Vymazanie úložiska prehliadača odstráni údaje; predtým ich exportujte v Nastaveniach. Rôzne domény a porty používajú odlišné úložisko.

Platby sú **mesačné, kvartálne, ročné alebo jednorazové predpisy**. Suma sa zadáva za celé obdobie (napríklad ročné poistenie 120 €). Pri ročnej platbe zvolíte mesiac splatnosti; pri kvartálnej jeden mesiac cyklu, ktorý sa opakuje každé tri mesiace aj cez koniec roka. Cyklus nie je obmedzený dátumom začiatku, platí aj pre predchádzajúce roky. V prehľade sú len platby splatné vo vybranom mesiaci. Cez **Všetky predpisy** možno upraviť aj platby splatné inokedy. Staršie dáta a zálohy bez opakovania sa interpretujú ako mesačné; pôvodný kľúč úložiska aj dáta zostávajú zachované.

Pri každom byte je **plánovaný mesačný zisk = dohodnuté nájomné − mesačný priemer všetkých zadaných nákladov daného bytu**. Kvartálna suma sa delí tromi, ročná dvanástimi. Napríklad nájomné 620 € a mesačné náklady 180 € znamenajú zisk 440 €. Ročné poistenie 120 € pridá do mesačných nákladov 10 €. Záporný výsledok sa zobrazí ako strata. Označenie úhrady tento plánovaný výsledok nemení. Nie je to potvrdený príjem, peňažný tok ani zisk po daniach; nezadané náklady sa nezohľadnia.

Zmena sumy, opakovania či splatnosti sa prejaví vo všetkých mesiacoch; aplikácia neuchováva históriu predpisov. Deň 29–31 sa v kratšom mesiaci posunie na jeho posledný deň. Po splatnosti je platba až deň nasledujúci po dni splatnosti, podľa lokálneho času zariadenia. Označenie úhrady platí iba pre zvolený mesiac a uchová sa aj pri úprave predpisu. Vymazanie predpisu vymaže všetky jeho úhrady. Odstránenie bytu odstráni aj jeho nájomníka a platby, po potvrdení.

Táto prvá verzia sa nepripája k banke ani dodávateľom. Nájomné je dohodnutá suma, nie potvrdený príjem. Vyúčtovanie spotreby, história nájomníkov zatiaľ nie sú implementované. Zámerne neobsahuje skutočné osobné ani bankové údaje.

## Overenie a produkčné zostavenie

```sh
npm test
npm run build
npm run preview -- --port 4173
```

Doménové testy overujú kratšie mesiace, priestupný rok, stavy úhrad po mesiacoch a validáciu záloh. Pri vývoji bol v Chromium overený aj celý používateľský tok: pridanie bytu/platby, úhrada, obnovenie stránky, zmena mesiaca, nájomníci, export/import, odmietnutie chybnej zálohy, odstránenie bytu s platbami a mobilná navigácia.

`dist/` obsahuje statickú aplikáciu vhodnú na statický hosting. Fonty aj ikony sú súčasťou zostavenia; lokálny režim nepotrebuje externé API. Cloudový režim používa Supabase Auth, databázu a Storage.

## Aplikácia pre iPhone

Projekt teraz obsahuje aj iOS aplikáciu cez Capacitor 8. Na Macu spustite `npm ci`, `npm run ios:sync` a `npm run ios:open`; inštaláciu do iPhonu dokončíte podpísaním v Xcode. Obrazovky sú priamo v aplikácii, Vercel nie je potrebný. Natívna verzia ukladá údaje cez Preferences a zálohu exportuje cez systémové Zdieľať. Podrobný postup a aktuálny stav overenia sú v [návode pre iPhone](docs/IPHONE.md). Natívne zostavenie a podpisovanie vyžadujú macOS/Xcode; v Linuxe zatiaľ neboli overené.

## Bezplatné nasadenie na GitHub Pages

Aktívny cieľ projektu je webová aplikácia. V repozitári nastavte **Settings → Pages → Source → GitHub Actions**. Workflow `Nasadenie webovej aplikácie` po každom pushi do `main` nainštaluje závislosti, spustí testy, zostaví `dist/` a publikuje ho do Pages. Spustiť sa dá aj ručne v záložke Actions. Relatívne cesty assetov fungujú aj pod cestou `/flit-flat/`. Vlastná doména nie je potrebná. Výslednú URL ukáže úspešný deploy a Settings → Pages.

Web môžete na iPhone pridať na plochu cez Safari → Zdieľať → Pridať na plochu. Táto verzia nemá garantované spustenie bez internetu. Lokálny režim má údaje v prehliadači a nová doména má samostatné úložisko. Cloudový režim načíta údaje rovnakého účtu zo Supabase. Natívny iOS projekt ostáva voliteľný; jeho kontrola v Actions sa teraz spúšťa len ručne.


## Detail bytu: cena, dokumenty, fotografie a pôdorys

Kliknutím na kartu bytu otvoríte detail so sekciami dokumentov, fotografií a pôdorysu. Voliteľnú cenu (napríklad kúpnu) nastavíte pri pridaní alebo úprave nehnuteľnosti. Je to evidenčná hodnota a nemení mesačný zisk.

- Dokumenty: PDF, DOC/DOCX, XLS/XLSX, TXT a obrázky. PDF a obrázky sa zobrazujú priamo; ostatné formáty sa sťahujú.
- Fotografie a podklad pôdorysu: JPG/JPEG, PNG, WebP; maximálne 20 MB na súbor. HEIC exportujte ako JPG.
- Pôdorys: môžete nahrať podklad alebo pridať miestnosti na prázdnu mriežku. Je to orientačný nákres bez mierky, nie CAD editor. Nábytok sa dá presúvať prstom/myšou a upravovať posuvníkmi, vrátane otočenia, počtu kusov a poznámky o stave či sériovom čísle. Zmeny treba potvrdiť cez **Uložiť pôdorys a inventár**. Najviac 300 položiek.
- ZIP záloha obsahuje `backup.json` a binárne prílohy. Limit zálohy aj rozbaleného obsahu je 150 MB. V Nastaveniach môžete zálohu obnoviť; obnova nahrádza všetky dáta aj súbory. Starý JSON súbor obnoví iba dáta, bez príloh. Pred obnovou si vytvorte kompletnú ZIP zálohu. Lokálna obnova prebehne v jednej databázovej transakcii. Cloudová obnova najprv nahrá prílohy a potom atomicky uloží dáta a ich manifest s kontrolou verzie.
- Odstránením bytu sa vo webovej verzii odstránia aj jeho prílohy. Súbory sa neukladajú do GitHubu. V cloude sú súkromne v Supabase Storage; v lokálnom režime sú iba v prehliadači, kde zmena zariadenia vyžaduje prenos zálohy a vymazanie údajov webu odstráni aj súbory.


## Grafy nájomného a nákladov

V Prehľade aj v Nehnuteľnostiach je ročný graf celého portfólia a samostatný graf každého bytu. Zobrazuje 12 mesiacov, dohodnuté nájomné, splatné náklady a rozdiel. Kliknutie na mesiac ukáže presné sumy; mesačné hodnoty možno zobraziť aj ako tabuľku. Prepínač umožňuje zobraziť iba platby označené ako uhradené. Úhrady sú vedené podľa mesiaca splatnosti, nie podľa dátumu bankového prevodu. Nájomné ani opakované náklady nemajú historické verzie: graf používa aktuálne predpisy aj pre predchádzajúce a nasledujúce roky a nepredstavuje potvrdené príjmy z banky.

Nové kategórie sú **Údržba**, **Oprava** a **Nové spotrebiče**. Opakovanie **Jednorazovo** vyžaduje konkrétny mesiac a rok. Výdavok sa zobrazí iba tam, nevznikne automaticky v ďalšom roku. Voliteľný popis pomôže evidovať napríklad konkrétnu opravu alebo kúpu chladničky. V grafoch sa ročné a kvartálne platby započítajú celé v mesiaci splatnosti. Pravidelný mesačný priemer a plánovaný zisk na karte bytu stále rozpočítavajú opakované platby a nezahŕňajú jednorazové výdavky; tie sa odčítajú v rozdiele za konkrétny mesiac grafu.


### Stránka detailu nehnuteľnosti

Dokumenty, fotografie a pôdorys sa otvárajú na samostatnej stránke v rámci aplikácie, nie v modálnom okne. V záhlaví sú základné údaje bytu a odkaz späť na nehnuteľnosti. Sekcie majú vlastné odkazy `#property/<id>/documents`, `photos` a `layout`; obnovenie stránky zachová otvorený byt a sekciu. Na GitHub Pages tieto hash odkazy nepotrebujú serverové presmerovanie. Odkaz neprenáša osobné údaje ani prílohy do iného zariadenia. Pred opustením neuloženého pôdorysu aplikácia vyžiada potvrdenie, vrátane navigácie v menu a tlačidla Späť v prehliadači.

### Začiatok štatistík

Každý byt má pole **Začiatok evidencie (mesiac)**, predvolene mesiac pridania. Grafy zobrazujú iba mesiace od tohto dátumu a započítajú aj náklady až od začiatku evidencie príslušného bytu. Celkové štatistiky začínajú najskorším začiatkom evidencie zo súčasných nehnuteľností. Ročné súčty sú iba za zobrazené obdobie, prvý mesiac sa nekráti na dni. Skoršie roky nie je možné vybrať. Pôvodná verzia neukladala dátum registrácie: záznamom bez tohto poľa sa pri prvom načítaní novej verzie priradí aktuálny mesiac a uloží sa, aby sa pri ďalších otvoreniach neposúval. Starší skutočný začiatok môžete nastaviť v úprave bytu. Existujúce dátumy v zálohách sa nemenia, staré zálohy bez dátumu sa doplnia aktuálnym mesiacom. Splatné platby mimo štatistického obdobia ostávajú v evidencii platieb; obdobie obmedzuje iba grafy.

### Karty bytov a ukážkové portfólio

Nehnuteľnosti majú po jednej karte na celý riadok. Kliknutie na kartu otvorí detail s kartami Energie a platby, Dokumenty, Fotografie a Pôdorys a nábytok. Energie zobrazujú všetky predpisy daného bytu a úhrady za zvolený mesiac; platby možno pridávať, upravovať aj odstrániť. Byt možno odstrániť z prehľadu alebo detailu po potvrdení.

Pri ukážkových bytoch je banner **Ukončiť ukážku**. Potvrdenie odstráni uvedené ukážkové byty, ich platby a prílohy, ostatné nehnuteľnosti zachová. Rozpoznajú sa aj pôvodné nezmenené ukážkové byty zo staršej verzie. Ak ste starý ukážkový byt premenovali na vlastný, odstráňte ho jednotlivo iba vtedy, keď ho už nepotrebujete. Chyba pri odstraňovaní sa zobrazuje priamo v potvrdzovacom okne.

### Náhľad karty a prijaté nájomné

V Platbách alebo v detaile bytu v sekcii Energie a platby vyberte mesiac a kliknite na **Označiť prijaté nájomné**. Opätovné kliknutie označenie zruší iba za zvolený mesiac. Ide o manuálnu evidenciu prijatia; plánovaný zisk a graf dohodnutého nájomného sa nemenia.

**Náhľad karty** v sekciách Fotografie a Pôdorys umožňuje pôvodnú ilustráciu, konkrétnu nahratú fotku alebo pôdorys (nahratý obrázok, prípadne uložený nákres). Pri chýbajúcom súbore sa zobrazí ilustrácia. Fotky pridáte otvorením karty a výberom sekcie Fotografie. Pôvodné tlačidlo „Dokumenty, fotky a pôdorys“ bolo odstránené; sekcie sú naďalej dostupné v detaile bytu. Nastavenie náhľadu a mesačné označenia sa ukladajú spolu s existujúcimi údajmi a zálohami, v cloudovom režime cez rovnakú revíznu ochranu Supabase. Databázová migrácia nie je potrebná.

Grafy predvolene zobrazujú skutočnosť: iba mesiace označené ako prijaté nájomné a uhradené náklady. Prepínač Plán zobrazí dohodnuté nájomné a splatné náklady aj do budúcnosti. Graf konkrétneho bytu je aj v jeho detaile v sekcii Energie a platby. Hypotéku zadáte ako kategóriu platby; celá splátka je v prehľade výdavkov.

### Vylepšený editor pôdorysu

V sekcii Pôdorys vyberte predvoľbu miestnosti alebo nábytku a kliknite na Pridať. Prvky presuniete myšou alebo prstom; vybraný neotočený prvok zväčšíte úchytom v pravom dolnom rohu. Zapnúť možno prichytávanie po 2 % plochy a mriežku, priblíženie je 100–200 %. Zoznam všetkých prvkov umožní vybrať aj prekrytú miestnosť. V paneli upravíte názov, polohu a rozmery v percentách, otočenie, kópiu, počet kusov a poznámku. Šípky posúvajú zameraný prvok o 1 %, so Shiftom o 5 %. Posledných 50 zmien možno vrátiť tlačidlami Späť a Znova; odstránenie možno takisto vrátiť. Zmeny potvrďte cez Uložiť pôdorys. Nákres je orientačný, bez fyzickej mierky. Existujúce položky, podklady, zálohy a ukladanie v Supabase ostávajú kompatibilné.

V editore možno pred pridaním alebo pri úprave existujúceho prvku vybrať aj tvar L, T, U alebo kruh/ovál. Šírka a výška určujú ohraničujúci rozmer; otočením zmeníte orientáciu výrezu. Tvary sú pripravené predvoľby, nie voľné kreslenie vrcholov. Zobrazujú sa aj v náhľade karty a zachovávajú sa pri kopírovaní, ukladaní a zálohovaní. Pôvodné prvky bez údaja o tvare zostávajú obdĺžnikové.
