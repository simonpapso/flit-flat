# Mesačný e-mailový report

Workflow `.github/workflows/monthly-report.yml` odošle 20. deň mesiaca ráno report
na `simonpapso@gmail.com` a `janahorkova39@gmail.com`. Číta aktuálny cloudový
záznam jedného konkrétneho účtu; nemení platby ani údaje aplikácie. Funguje aj
pri zatvorenej aplikácii. Dáta uložené v režime **Iba toto zariadenie** nie sú
dostupné: najprv ich preneste do súkromného cloudu a zapisujte platby tam.

Report uvádza pri každom byte prijaté nájomné a splatné energie/služby s označením
úhrady, spolu so súčtami prijatého nájomného a uhradených energií. Energie zahŕňajú
elektrinu, plyn, vodu, spoločné priestory a internet; ostatné kategórie výdavkov
nezahŕňa. Používa existujúce mesačné značky `paidMonths` a `rentReceivedMonths`
a pravidlá mesačných, kvartálnych, ročných a jednorazových predpisov. Ukážkové byty
a byty pred začiatkom evidencie vynechá. Report je snímkou aktuálneho mesiaca
v čase odoslania, nie výpisom prevodov ani konečným vyúčtovaním celého mesiaca.

## Aktivácia

1. Zmeny musia byť v predvolenej vetve GitHub repozitára. V **Actions** povoľte
   workflow, ak je spúšťanie vypnuté.
2. Vytvorte účet v Resend a overte vlastnú odosielaciu doménu. Produkčné odoslanie
   na obe adresy vyžaduje overenú doménu; testovacia adresa poskytovateľa nestačí.
3. V repozitári otvorte **Settings → Secrets and variables → Actions** a pridajte:

   | Repository secret | Hodnota |
   | --- | --- |
   | `SUPABASE_SERVICE_ROLE_KEY` | Serverový kľúč projektu Supabase nakonfigurovaného v `src/supabase-config.js`. |
   | `REPORT_USER_ID` | UUID vlastníka údajov z **Supabase → Authentication → Users**. Vyberte účet, do ktorého zapisujete platby; nejde o e-mail príjemcu. |
   | `RESEND_API_KEY` | Kľúč Resend s oprávnením posielať e-maily. |
   | `REPORT_FROM` | Napr. `Flit Flat <report@vasa-overena-domena.sk>`. |

Serverový Supabase kľúč obchádza RLS a patrí výlučne do Secrets; nikdy ho
nevkladajte do klienta, zdrojového kódu, chatu ani premennej s prefixom `VITE_`.
Skript načítava iba `data` pre explicitné `REPORT_USER_ID`, nie prílohy ani iné účty.
Finančný obsah reportu sa odošle službe Resend na doručenie obom príjemcom.

## Čas a overenie

Cron je `17 8 20 * *` (08:17 UTC), teda 09:17 v zime alebo 10:17 v lete podľa
Europe/Berlin. GitHub môže spustenie oneskoriť. Workflow v neaktívnom verejnom
repozitári môže GitHub po 60 dňoch vypnúť; skontrolujte stav v Actions.
Ručné **Run workflow** odošle report iba 20. deň; v iné dni bezpečne skončí bez
odoslania. Lokálne testy `npm test` používajú falošné dáta a nič neposielajú.

Pri chýbajúcich Secrets, neplatných dátach alebo chýbajúcom cloudovom účte workflow
zlyhá bez odoslania. Úspešný beh potvrdzuje prijatie e-mailovou službou; doručenie
overte v Resend. Kľúč idempotencie podľa účtu a mesiaca chráni pred duplicitným
odoslaním počas 24-hodinového okna Resend. Zmenený obsah pri opakovaní s tým istým
kľúčom môže Resend odmietnuť; po skončení okna môže ručné opakovanie poslať duplikát.
Workflow preto opakujte len pri overenom neúspešnom odoslaní. Logy neobsahujú
finančné údaje ani text odpovedí poskytovateľa.
