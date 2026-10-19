# Flit Flat pre iPhone

Projekt obsahuje iOS aplikáciu vytvorenú cez Capacitor 8. Rozhranie React je pribalené k aplikácii a zobrazuje sa v systémovom WKWebView. Po inštalácii na bežnú správu bytov nepotrebuje Vercel ani internetové pripojenie. Nie je to odkaz na vzdialenú webstránku. Nie je to však ani rozhranie prepísané do SwiftUI.

## Čo je pripravené

- Projekt `ios/App/App.xcodeproj`, názov Flit Flat, predvolený identifikátor `sk.flitflat.app`.
- Minimálny iOS 15.4 (systémové dialógy a bezpečné UUID), lokálne pribalené obrazovky, fonty a ikony.
- Údaje uložené cez Capacitor Preferences v UserDefaults aplikácie.
- Export JSON zálohy cez systémovú ponuku Zdieľať, napríklad do Súborov alebo cez AirDrop.
- Import zálohy výberom JSON súboru. Import nahrádza dáta po potvrdení.
- Priestor pre výrez displeja a spodný indikátor, svetlý vzhľad, vlastná ikona a privacy manifest pre používané API.

Webová verzia ostáva funkčná a používa pôvodné localStorage. Web a iOS majú samostatné dáta. Existujúce údaje z webu preneste exportom a importom zálohy. Aplikácia nemá cloudovú synchronizáciu. Odinštalovanie vymaže lokálne údaje. Zálohy sú nešifrované JSON súbory obsahujúce aj údaje nájomníkov; ukladajte ich bezpečne.

## Inštalácia na vlastný iPhone cez Mac

Potrebujete Mac s Xcode 26 alebo novším, Node.js 22.12+ (overené 24.19), Apple účet a pripojený iPhone s iOS 15.4+. Xcode musí mať nainštalovanú podporu iOS; pri prvom spustení dokončite jeho ponúkanú inštaláciu.

1. Na Macu stiahnite alebo naklonujte repozitár a otvorte v ňom Terminál.
2. Spustite:

   ```sh
   npm ci
   npm run ios:sync
   npm run ios:open
   ```

3. V Xcode vyberte projekt **App**, target **App** a kartu **Signing & Capabilities**.
4. Zapnite **Automatically manage signing**. V poli **Team** vyberte vlastný účet. Apple účet pridáte v Xcode → Settings → Accounts. Predvolený Bundle Identifier zmeňte na jedinečný, ak ho vaša podpisová konfigurácia neprijme; rovnakú zmenu urobte v `capacitor.config.json`.
5. Pripojte iPhone, povoľte dôveru počítaču a podľa výzvy zapnite **Developer Mode** v Settings → Privacy & Security. Ako cieľ spustenia vyberte svoj iPhone.
6. Kliknite na **Run ▶**. Xcode aplikáciu zostaví, podpíše a nainštaluje. Prípadnú výzvu na dôverovanie vývojárskemu profilu dokončite v Settings → General → VPN & Device Management.

Osobný Apple účet umožňuje vývojové testovanie na vlastnom zariadení, ale má obmedzenia; bezplatný podpis má typicky platnosť 7 dní a aplikáciu treba znovu podpísať cez Xcode. Na trvalejšiu distribúciu cez TestFlight alebo App Store potrebujete členstvo Apple Developer Program, podpisovanie a App Store Connect. Schválenie App Store nie je zaručené. Certifikáty a prihlasovacie údaje sa do GitHubu ani do chatu neukladajú.

Ak Mac nemáte, zostavenie môže zabezpečiť vývojár alebo cloudový macOS build. Samotný ZIP z GitHubu sa do iPhonu nenainštaluje a nepodpísaný `.ipa` nenahrádza Apple podpisovanie.

## Vývoj a overenie

Po každej zmene rozhrania spustite `npm run ios:sync`, aby sa aktuálny obsah `dist/` skopíroval do iOS projektu. `npm run ios:open` iba otvorí Xcode; nič nevytvorí ani nenahrá do App Store. Generované súbory `ios/App/App/public` a `capacitor.config.json` sú ignorované Gitom a vytvára ich sync. Swift balíky sa načítajú pri otvorení/zostavení v Xcode.

```sh
npm test
npm run ios:sync
```

Na Macu môžete overiť kompiláciu pre simulátor bez podpisového účtu:

```sh
xcodebuild -project ios/App/App.xcodeproj -scheme App \
  -configuration Debug -destination 'generic/platform=iOS Simulator' \
  -derivedDataPath ios/DerivedData CODE_SIGNING_ALLOWED=NO build
```

Tento posledný príkaz vytvára iba simulátorovú zostavu, ktorú nemožno nainštalovať na fyzický iPhone. V Linux cloudovom prostredí bola overená synchronizácia iOS projektu a webové zostavenie; natívna kompilácia, podpisovanie ani test na zariadení tu neprebehli.

Pred reálnym používaním v iPhone overte: pridanie bytu a platby; úhradu a zachovanie údajov po ukončení a opätovnom otvorení aplikácie; odlišný stav ďalšieho mesiaca; export do Súborov a obnovenie tejto zálohy; používanie bez pripojenia; ovládanie pri výreze displeja a otvorenej klávesnici.

## Bez vlastného Macu

Workflow [Overenie iPhone aplikácie](../.github/workflows/ios.yml) používa macOS runner na GitHube a spúšťa sa pri zmenách hlavnej vetvy alebo ručne v záložke Actions. Výsledný artefakt je určený **iba pre simulátor**, nedá sa nainštalovať do iPhonu. Workflow neobsahuje podpisovanie ani nahrávanie do TestFlight. Pri súkromnom repozitári spotrebúva minúty GitHub Actions podľa vášho plánu.

Pre inštaláciu bez vlastného Macu je ďalším krokom cloudové podpisovanie a TestFlight: vyžaduje vaše členstvo Apple Developer Program, registráciu aplikácie v App Store Connect a bezpečné nastavenie podpisových oprávnení v zvolenom build systéme. Apple účet ani certifikáty nie sú súčasťou projektu. Alternatívou na skúšanie je dočasný prístup k Macu a vývojová inštalácia podľa návodu vyššie.
