# Súkromná synchronizácia cez Supabase

## Jednorazové nastavenie projektu

1. V projekte Supabase otvorte **SQL Editor → New query**, vložte celý obsah [supabase/setup.sql](../supabase/setup.sql) a stlačte **Run**. Skript možno spustiť opakovane. Vytvorí tabuľku, funkciu na ukladanie a súkromné úložisko `flit-private` s pravidlami prístupu.
2. V **Authentication → URL Configuration** nastavte **Site URL** na `https://simonpapso.github.io/flit-flat/` a rovnakú adresu pridajte do **Redirect URLs**. Pre lokálny vývoj povoľte aj konkrétnu lokálnu adresu.
3. V Authentication povoľte poskytovateľa Email. Pri zapnutom potvrdzovaní e-mailu musí používateľ potvrdiť správu pred prihlásením. Doručovanie a limity e-mailov riadi Supabase; pre pravidelnú prevádzku možno nastaviť vlastné SMTP.
4. Otvorte aplikáciu, zvoľte **Vytvoriť účet v aplikácii**, zadajte svoj e-mail a nové heslo. Toto je samostatný účet, nie účet správcu Supabase. Potvrďte e-mail a prihláste sa.

Verejná konfigurácia projektu je v `src/supabase-config.js`. Publishable kľúč je určený pre prehliadač; prístup chráni prihlásenie a RLS. Nikdy sem nepridávajte service-role, secret kľúč ani heslo databázy. MCP konektor je voliteľný nástroj pre vývojára; aplikácia ho na synchronizáciu nepoužíva.

## Prenos existujúcich údajov

Na notebooku, kde už máte byty, si najprv v Nastaveniach stiahnite kompletnú ZIP zálohu. Prihláste sa v aplikácii. Ak je cloudový účet prázdny, aplikácia ponúkne **Preniesť údaje z tohto zariadenia**. Po potvrdení prenesie byty, platby aj prílohy. Miestna kópia zostane zachovaná. Prenos sa neponúka ako zlúčenie s už naplneným cloudom.

Na ďalšom počítači alebo iPhone otvorte tú istú adresu a prihláste sa rovnakým účtom. Zmeny sa ukladajú do cloudu okamžite po potvrdení formulára. Druhé zariadenie ich načíta pri prihlásení alebo cez **Načítať aktuálne údaje**. Živé automatické obnovovanie nie je zapnuté. Pred obnovením dokončite úpravy.

Ak sa dve zariadenia pokúsia uložiť zmeny zo starej verzie, druhé uloženie sa odmietne. Zrušte formulár, načítajte aktuálne údaje a úpravu zopakujte. Pri nejasnom výsledku sieťovej chyby najprv načítajte stav, aby ste neopakovali už uloženú operáciu.

## Úložisko a ochrana údajov

Každý prihlásený používateľ vidí iba vlastný pracovný priestor a súbory. Tabuľka má RLS a zápisy prebiehajú cez funkciu, ktorá kontroluje používateľa aj verziu. Súbory sú v súkromnom buckete pod priečinkom používateľa; nemajú verejné odkazy. Prílohy majú limit 20 MB, manifest 2000 súborov a dáta portfólia 5 MB. Celkovú kapacitu a poplatky určuje plán Supabase.

Cloudové portfólio sa neukladá do lokálnej databázy prehliadača, vyžaduje pripojenie. Prihlasovacia relácia zostáva v prehliadači; na zdieľanom počítači sa odhláste. Pôvodná miestna kópia po migrácii zostáva na pôvodnom zariadení aj po odhlásení. Režim **Pokračovať iba s údajmi v tomto zariadení** používa samostatnú lokálnu databázu a nesynchronizuje zmeny do cloudu.

ZIP export funguje aj v cloude a sťahuje súkromné prílohy. Obnovenie zálohy nahrádza aktuálne portfólio aj jeho manifest súborov. Súbory sa najprv nahrajú, následne sa dáta a odkazy uložia spoločne s kontrolou verzie. Staré súbory sa odstránia následne; pri prerušení spojenia môžu zostať súkromné nepoužívané objekty v Storage. Pri neznámom výsledku uloženia sa nové objekty zachovajú, aby sa nevymazali prílohy už potvrdené serverom.

## Overenie

`npm test` zahŕňa dva simulované klienty a vykonanie SQL v PostgreSQL cez PGlite: izoláciu účtov, RLS, pravidlá súborov, konflikt verzií a opakované spustenie migrácie. Tieto testy nenahrádzajú skúšku konkrétneho živého projektu. Po nastavení overte prihlásenie, prenos a otvorenie dokumentu na druhom zariadení. Ak SQL nie je nainštalované alebo pripojenie zlyhá, aplikácia oznámi chybu a neprepne automaticky na prázdne lokálne portfólio.
