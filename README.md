# Flit Flat

Jednoduchá aplikácia v slovenčine na správu investičných bytov. React + Vite, bez backendu a bez potrebných API kľúčov. Vyžaduje Node.js 22.12+ (overené s 24.19) a npm.

## Spustenie

```sh
cd /workspace/flit-flat
npm ci
npm run dev -- --port 5173
```

Použite existujúci checkout; cloudová úloha je už izolovaná a nepotrebuje ďalší Git worktree.

## Funkcie

- Pridanie, úprava a odstránenie nehnuteľností, údaje nájomníkov a dohodnuté nájomné.
- Mesačné predpisy za elektrinu, plyn, vodu, spoločné priestory, internet, poistenie a ostatné služby.
- Manuálne označenie úhrady pre konkrétny mesiac, prehľad splatnosti a filtrovanie podľa bytu alebo stavu.
- Export a obnovenie JSON zálohy s validáciou vstupných údajov.
- Voliteľné fiktívne ukážkové portfólio, responzívne rozhranie pre mobil aj počítač.

Začína prázdnym portfóliom. Všetky údaje sa ukladajú do localStorage tohto prehliadača pod kľúčom `flit-flat-v1`. Záloha obsahuje osobné údaje: uchovávajte ju bezpečne. Dáta sa neposielajú na server a nesynchronizujú medzi zariadeniami. Vymazanie úložiska prehliadača odstráni údaje; predtým ich exportujte v Nastaveniach. Rôzne domény a porty používajú odlišné úložisko.

Platby sú výhradne **mesačne opakované predpisy**. Zmena sumy či splatnosti sa prejaví vo všetkých mesiacoch; aplikácia neuchováva históriu predpisov. Deň 29–31 sa v kratšom mesiaci posunie na jeho posledný deň. Po splatnosti je platba až deň nasledujúci po dni splatnosti, podľa lokálneho času zariadenia. Označenie úhrady platí iba pre zvolený mesiac. Vymazanie predpisu vymaže všetky jeho úhrady. Odstránenie bytu odstráni aj jeho nájomníka a platby, po potvrdení.

Táto prvá verzia sa nepripája k banke ani dodávateľom. Nájomné je dohodnutá suma, nie potvrdený príjem. Ročné platby, vyúčtovanie spotreby, história nájomníkov, prílohy a prihlasovanie zatiaľ nie sú implementované. Zámerne neobsahuje skutočné osobné ani bankové údaje.

## Overenie a produkčné zostavenie

```sh
npm test
npm run build
npm run preview -- --port 4173
```

Doménové testy overujú kratšie mesiace, priestupný rok, stavy úhrad po mesiacoch a validáciu záloh. Pri vývoji bol v Chromium overený aj celý používateľský tok: pridanie bytu/platby, úhrada, obnovenie stránky, zmena mesiaca, nájomníci, export/import, odmietnutie chybnej zálohy, odstránenie bytu s platbami a mobilná navigácia.

`dist/` obsahuje statickú aplikáciu vhodnú na statický hosting. Fonty aj ikony sú súčasťou zostavenia; aplikácia nepotrebuje externé API. Verejné nasadenie nie je súčasťou vytvorenia projektu.
