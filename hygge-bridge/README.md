# Hygge-bridge

Een kleine webpagina voor je gsm die:

- de temperatuur van een sensor in **Niko Home Control II** **toont** (alleen tonen, er gebeurt niets mee), en
- de **Seitron Hygge**-thermostaat (via de **Hygge Way**-gateway) **bedient**: op een temperatuur zetten of
  terug naar zijn weekprogramma.

De Hygge regelt de ketel zelf, op zijn eigen thermometer.

```
 Niko-sensor ──MQTT/TLS──▶ hygge-bridge ──▶ webpagina op je gsm   (temperatuur tonen)
                                │
       webpagina: − / + ────────┴──HTTPS──▶ IFTTT ──▶ Seitron-cloud ──▶ Hygge Way ──▶ Hygge ──▶ ketel
```

## De pagina

| Onderdeel            | Wat het doet                                                               |
|----------------------|----------------------------------------------------------------------------|
| **Niko**             | Temperatuur van je Niko-sensor en hoe lang geleden gemeten                 |
| **Hygge-thermostaat**| Huidige stand: *Manueel · 21,0 °C*, *Weekprogramma* of *Nog geen opdracht* |
| **− / +**            | Zet de Hygge manueel op die temperatuur (stappen van 0,5 °C)               |
| **Weekprogramma**    | Aan: Hygge volgt zijn programma uit de Seitron-app. Uit: terug naar de gekozen temperatuur |
| **Grafiek**          | Niko-temperatuur en de temperatuur die op de Hygge is ingesteld            |

Goed om te weten:

- De pagina weet alleen wat **zij zelf** naar de Hygge stuurde. Pas je de Hygge aan op het toestel of in de
  Seitron Smart-app, dan ziet de pagina dat niet. Seitron heeft geen koppeling om de stand uit te lezen.
- "Verstuurd" betekent dat IFTTT de opdracht aannam. Het kan enkele seconden tot een minuut duren voor de
  Hygge ze uitvoert.
- Bij het opstarten stuurt de bridge **niets** naar de Hygge; enkel wanneer jij op de pagina iets kiest.
  De laatst gekozen stand wordt bewaard in `state.json`.
- De pagina heeft geen wachtwoord: gebruik ze alleen in je thuisnetwerk en zet poort 8080 **niet** open in je router.

## Wat heb je nodig

- Niko Home Control **II** met Connected Controller, softwareversie 2.17 of nieuwer
- Seitron Hygge Home-kit met Hygge Way-gateway, gekoppeld in de **Seitron Smart**-app
- Een (gratis) **IFTTT**-account
- Een toestel dat altijd aan staat in je thuisnetwerk met **Node.js 20.6+** (Raspberry Pi, NAS, pc)

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

### 3. Bridge installeren

```bash
cd hygge-bridge
npm install
cp .env.example .env     # en vul NIKO_HOST, NIKO_TOKEN en IFTTT_KEY in
npm run devices          # toont alle Niko-toestellen met een temperatuur
```

Zet de juiste naam (of UUID) in `NIKO_SENSOR_NAME` / `NIKO_SENSOR_UUID`. Test daarna eerst droog:

```bash
DRY_RUN=true npm start   # logt wat er naar de Hygge zou gaan, verstuurt niets
npm start                # echt aansturen
```

Open op je iPhone (op hetzelfde wifi-netwerk) `http://<ip-van-dit-toestel>:8080`.
Tip: in Safari via *Deel → Zet op beginscherm* krijg je er een icoon voor.

Eerst uitproberen zonder Niko of Seitron? `npm run demo` start met een gesimuleerde Niko-sensor;
er gaat dan niets naar de Hygge.

### 4. Automatisch starten (Raspberry Pi / Linux)

```bash
sudo cp hygge-bridge.service /etc/systemd/system/   # pas User en WorkingDirectory aan
sudo systemctl enable --now hygge-bridge
journalctl -u hygge-bridge -f                        # logs volgen
```

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
