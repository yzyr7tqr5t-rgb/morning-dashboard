# Hygge-bridge

Een kleine webpagina voor je gsm die:

- de **Seitron Hygge**-thermostaat (via de **Hygge Way**-gateway) **bedient**: op een temperatuur zetten of
  terug naar zijn weekprogramma, en
- ter info de temperatuur van een sensor in **Niko Home Control II** toont (er gebeurt verder niets mee).

De Hygge regelt de ketel zelf, op zijn eigen thermometer.

```
 Niko-sensor ──MQTT/TLS──▶ hygge-bridge ──▶ webpagina op je gsm   (temperatuur tonen)
                                │
       webpagina: − / + ────────┴──HTTPS──▶ IFTTT ──▶ Seitron-cloud ──▶ Hygge Way ──▶ Hygge ──▶ ketel
```

## De pagina

| Onderdeel            | Wat het doet                                                               |
|----------------------|----------------------------------------------------------------------------|
| **Hygge-thermostaat**| Huidige stand: *Manueel · 21,0 °C*, *Weekprogramma* of *Nog geen opdracht* |
| **− / +**            | Zet de Hygge manueel op die temperatuur (stappen van 0,5 °C)               |
| **Weekprogramma**    | Aan: Hygge volgt zijn programma uit de Seitron-app. Uit: terug naar de gekozen temperatuur |
| **Niko (ter info)**  | Temperatuur van je Niko-sensor en hoe lang geleden gemeten                 |
| **Grafiek**          | Wat er de laatste 24 u op de Hygge is ingesteld (manueel of weekprogramma) |

Goed om te weten:

- De pagina weet alleen wat **zij zelf** naar de Hygge stuurde. Pas je de Hygge aan op het toestel of in de
  Seitron Smart-app, dan ziet de pagina dat niet. Seitron heeft geen koppeling om de stand uit te lezen.
- "Verstuurd" betekent dat IFTTT de opdracht aannam. Het kan enkele seconden tot een minuut duren voor de
  Hygge ze uitvoert.
- Bij het opstarten stuurt de bridge **niets** naar de Hygge; enkel wanneer jij op de pagina iets kiest.
  De laatst gekozen stand en de opdrachten voor de grafiek worden bewaard in `state.json`.
- De pagina heeft geen wachtwoord: gebruik ze alleen in je thuisnetwerk en zet poort 8080 **niet** open in je router.

## Home Assistant-add-on (aanbevolen als je Home Assistant hebt)

1. In Home Assistant: **Instellingen → Add-ons** (in nieuwere versies **Apps**) **→ winkel → ⋮ → Repositories**, en voeg toe:
   `https://github.com/yzyr7tqr5t-rgb/morning-dashboard#claude/hygge-bridge`
2. Zoek **Verwarming (Hygge)** in de winkel, installeer en volg het tabblad *Documentatie* (zie ook [DOCS.md](DOCS.md)).

De rest van deze README gaat over de installatie zonder Home Assistant.

## Wat heb je nodig

- Niko Home Control **II** met Connected Controller, softwareversie 2.17 of nieuwer
- Seitron Hygge Home-kit met Hygge Way-gateway, gekoppeld in de **Seitron Smart**-app
- Een **IFTTT Pro**-abonnement: de Webhooks-dienst van IFTTT is niet beschikbaar in het gratis plan
- Een toestel dat altijd aan staat in je thuisnetwerk, bv. een **Raspberry Pi** (Node.js 18 of nieuwer; het installatiescript regelt dat)

## Installatie

### 1. Niko Hobby API activeren

1. Log in op [mynikohomecontrol.niko.eu](https://mynikohomecontrol.niko.eu) en ga naar je installatie.
2. Activeer de **Hobby API** (onder *Connected services*) en kopieer het **token** (een lange JWT; één jaar geldig — zet een herinnering om het te vernieuwen).
3. Zoek het IP-adres van je Connected Controller (in je router of de Niko-app). Geef het best een vast IP.

### 2. Seitron koppelen via IFTTT

Seitron heeft geen publieke API; de officiële koppeling voor derden is de
[Seitron Smart-service op IFTTT](https://ifttt.com/seitronsmart).

1. Verbind in IFTTT de services **Seitron Smart** (log in met je Seitron Smart-account) en **Webhooks**.
2. Haal je Webhooks-sleutel op via [ifttt.com/maker_webhooks/settings](https://ifttt.com/maker_webhooks/settings) — het stuk na `https://maker.ifttt.com/use/`.
3. Maak **applet 1**:
   - *If*: Webhooks → **Receive a web request**, event name `hygge_set_temperature`
   - *Then*: Seitron Smart → **Set temperature**, kies je Hygge-thermostaat en vul bij de temperatuur het ingrediënt **`{{Value1}}`** in.
4. Maak **applet 2**:
   - *If*: Webhooks → **Receive a web request**, event name `hygge_auto`
   - *Then*: Seitron Smart → **Switch to scheduled mode** (terug naar het weekprogramma).

### 3. Installeren op de Raspberry Pi

Log in op de Pi (bv. met een SSH-app op je iPhone) en voer uit:

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/yzyr7tqr5t-rgb/morning-dashboard/refs/heads/claude/hygge-bridge/hygge-bridge/install.sh)
```

Het script:

1. installeert git en Node.js als die ontbreken;
2. haalt de code op naar `~/morning-dashboard` (of werkt ze bij);
3. vraagt het IP-adres van je Niko-controller, het Niko-token en je IFTTT-sleutel;
4. toont je Niko-sensoren en vraagt welke je wilt zien;
5. zet de bridge op als dienst die vanzelf start, standaard eerst in **testmodus** (`DRY_RUN=true`);
6. toont het adres voor je iPhone, bv. `http://192.168.1.20:8080`.

Later bijwerken: dezelfde opdracht opnieuw uitvoeren (je instellingen blijven). Gegevens opnieuw invullen:
voeg `--opnieuw-instellen` toe na de opdracht.

Testmodus uitzetten zodra de pagina goed werkt:

```bash
sed -i 's/^DRY_RUN=.*/DRY_RUN=false/' ~/morning-dashboard/hygge-bridge/.env && sudo systemctl restart hygge-bridge
```

Logboek volgen: `journalctl -u hygge-bridge -f`

Tip: in Safari via *Deel → Zet op beginscherm* krijg je een icoon voor de pagina.
Eerst uitproberen zonder Niko of Seitron? `DEMO=true npm start` in `~/morning-dashboard/hygge-bridge`.

### Handmatig installeren (andere computer)

```bash
cd hygge-bridge
npm install
cp .env.example .env     # en vul NIKO_HOST, NIKO_TOKEN, IFTTT_KEY en NIKO_SENSOR_NAME in
npm run devices          # toont alle Niko-toestellen met een temperatuur
DRY_RUN=true npm start   # logt wat er naar de Hygge zou gaan, verstuurt niets
```

Open daarna `http://<ip-van-dit-toestel>:8080`.

## Instellingen (`.env`)

| Variabele          | Standaard | Betekenis                                                  |
|--------------------|-----------|------------------------------------------------------------|
| `NIKO_SENSOR_NAME` | –         | Naam van de Niko-sensor die getoond wordt (of `NIKO_SENSOR_UUID`) |
| `DEFAULT_SETPOINT` | 20        | Temperatuur die de pagina voorstelt zolang je niets koos   |
| `MIN_SETPOINT`     | 10        | Laagste temperatuur die je kunt kiezen                     |
| `MAX_SETPOINT`     | 28        | Hoogste temperatuur die je kunt kiezen                     |
| `WEB_PORT`         | 8080      | Poort van de webpagina (0 = uit)                           |
| `DRY_RUN`          | false     | `true` = niets naar de Hygge sturen, enkel loggen          |
| `DEMO`             | false     | `true` = gesimuleerde Niko-sensor, niets versturen         |

Kommagetallen mogen met komma of punt (`20,5` of `20.5`).

## Testen

```bash
npm test
```
