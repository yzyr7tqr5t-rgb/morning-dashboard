# Verwarming (Hygge)

Bedien je **Seitron Hygge**-thermostaat vanuit Home Assistant en zie ter info de temperatuur van
een sensor in **Niko Home Control II**. De pagina staat in de zijbalk onder **Verwarming** en werkt ook in
de Home Assistant-app op je iPhone.

- **− / +** zet de Hygge manueel op een temperatuur (stappen van 0,5 °C).
- **Weekprogramma** laat de Hygge zijn eigen programma uit de Seitron-app volgen.
- De **grafiek** toont wat er de laatste 24 uur op de Hygge is ingesteld.
- Onderaan staat **ter info** de Niko-temperatuur. Daar gebeurt verder niets mee: de Hygge regelt de
  ketel zelf, op zijn eigen thermometer.

## Wat heb je nodig

- **IFTTT Pro.** Seitron heeft geen eigen koppeling; de add-on stuurt de Hygge via IFTTT, en de
  Webhooks-dienst van IFTTT is alleen beschikbaar met een betalend abonnement.
- **Niko Home Control II** met Connected Controller, softwareversie 2.17 of nieuwer.
- De Hygge gekoppeld in de **Seitron Smart**-app (via de Hygge Way).

## 1. Niko Hobby API

1. Log in op [mynikohomecontrol.niko.eu](https://mynikohomecontrol.niko.eu) en kies je installatie.
2. Activeer de **Hobby API** en kopieer het **token** (één jaar geldig — zet een herinnering).
3. Zoek het IP-adres van je Connected Controller (in je router of de Niko-app) en geef het best een vast adres.

## 2. IFTTT-applets

1. Verbind in IFTTT **Seitron Smart** (met je Seitron Smart-account) en **Webhooks**.
2. Kopieer je sleutel via [ifttt.com/maker_webhooks/settings](https://ifttt.com/maker_webhooks/settings):
   het stuk na `https://maker.ifttt.com/use/`.
3. Applet 1 — *If* Webhooks **Receive a web request**, event `hygge_set_temperature` —
   *Then* Seitron Smart **Set temperature**, temperatuur = **`{{Value1}}`**.
4. Applet 2 — *If* Webhooks **Receive a web request**, event `hygge_auto` —
   *Then* Seitron Smart **Switch to scheduled mode**.

## 3. Configuratie van de add-on

Vul op het tabblad **Configuratie** in:

| Optie | Wat |
|---|---|
| IP-adres Niko-controller | bv. `192.168.1.50` |
| Niko Hobby API-token | het token uit stap 1 |
| Naam van de Niko-sensor | zoals in Niko, bv. `Woonkamer` |
| IFTTT Webhooks-sleutel | de sleutel uit stap 2 |
| Testmodus | laat eerst **aan**: er gaat dan niets naar de Hygge |

Start de add-on en kijk op het tabblad **Logboek**. Daar staat welke Niko-sensoren er zijn, bv.
`Niko-toestellen met temperatuur: Woonkamer (20.4 °C), Badkamer (22.1 °C)`. Klopt de naam niet, pas ze aan
en herstart de add-on.

Werkt de pagina goed? Zet **Testmodus** uit en herstart. Druk dan op **+** of **−** en controleer in de
Seitron Smart-app of de Hygge de nieuwe temperatuur kreeg (dat duurt enkele seconden tot een minuut).

## Goed om te weten

- De pagina weet alleen wat zij zelf naar de Hygge stuurde. Pas je de Hygge aan op het toestel of in de
  Seitron-app, dan ziet de pagina dat niet: Seitron biedt geen manier om de stand uit te lezen.
- "Verstuurd" betekent dat IFTTT de opdracht aannam, niet dat de Hygge ze al uitvoerde.
- Bij het opstarten stuurt de add-on niets naar de Hygge; enkel wanneer jij op de pagina iets kiest.
- Je laatste keuze en de grafiek blijven bewaard bij een herstart of update.

## Problemen

| Logboek | Oplossing |
|---|---|
| `Connection refused: Not authorized` | Niko-token verkeerd of verlopen: maak een nieuw op mynikohomecontrol. |
| `connect ECONNREFUSED` / `ETIMEDOUT` | IP-adres van de Niko-controller klopt niet, of de Hobby API staat uit. |
| `Sensor "…" niet gevonden` | Neem een naam over uit de regel eronder. |
| `IFTTT antwoordde 401` | IFTTT-sleutel verkeerd: kopieer ze opnieuw. |
| "Verstuurd", maar de Hygge verandert niet | Kijk in IFTTT bij de applet onder *Activity*: staat hij aan, is Seitron Smart nog verbonden, en heb je IFTTT Pro? |
