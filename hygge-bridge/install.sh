#!/usr/bin/env bash
# Installeert of werkt de Hygge-bridge bij op een Raspberry Pi (of een andere Debian/Ubuntu-machine).
#
# Gebruik op de Pi:
#   bash <(curl -fsSL https://raw.githubusercontent.com/yzyr7tqr5t-rgb/morning-dashboard/refs/heads/claude/hygge-bridge/hygge-bridge/install.sh)
#
# Opnieuw uitvoeren werkt de code bij en houdt je instellingen (.env) bij.
# Met --opnieuw-instellen worden je gegevens opnieuw gevraagd.

set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/yzyr7tqr5t-rgb/morning-dashboard.git}"
BRANCH="${BRANCH:-claude/hygge-bridge}"
TARGET="${TARGET:-$HOME/morning-dashboard}"
INPUT="${INPUT:-/dev/tty}"          # vragen lezen van het toetsenbord, ook als het script gepijpt wordt
SKIP_SYSTEMD="${SKIP_SYSTEMD:-0}"   # 1 = geen dienst installeren (voor testen)
RECONFIGURE=0
[[ "${1:-}" == "--opnieuw-instellen" ]] && RECONFIGURE=1

bold() { printf '\n\033[1m%s\033[0m\n' "$*"; }
info() { printf '  %s\n' "$*"; }
fail() { printf '\n\033[31mFOUT:\033[0m %s\n' "$*" >&2; exit 1; }

exec 3<"$INPUT" # één keer openen, zodat elke vraag de volgende regel leest
ask() { # ask "Vraag" "standaard" -> antwoord op stdout
  local answer=""
  if [[ -n "$2" ]]; then printf '  %s [%s]: ' "$1" "$2" >&2; else printf '  %s: ' "$1" >&2; fi
  IFS= read -r -u 3 answer || true
  [[ "$INPUT" == /dev/tty ]] || printf '%s\n' "$answer" >&2 # testinvoer zichtbaar maken
  printf '%s' "${answer:-$2}"
}

node_major() { command -v node >/dev/null 2>&1 && node -p 'process.versions.node.split(".")[0]' || echo 0; }

SUDO=""
if [[ $EUID -ne 0 ]]; then SUDO="sudo"; fi

# --- 1. Benodigde programma's ---------------------------------------------------
bold "1/5  Programma's controleren"
need_apt=()
command -v git >/dev/null 2>&1 || need_apt+=(git)
if (( $(node_major) < 18 )); then need_apt+=(nodejs npm); fi
command -v npm >/dev/null 2>&1 || need_apt+=(npm)
if (( ${#need_apt[@]} )); then
  info "Installeren: ${need_apt[*]} (dit kan enkele minuten duren)"
  $SUDO apt-get update -qq
  $SUDO apt-get install -y -qq "${need_apt[@]}" >/dev/null
fi
(( $(node_major) >= 18 )) || fail "Node.js 18 of nieuwer is nodig, gevonden: $(node -v 2>/dev/null || echo geen). \
Werk je Pi bij naar Raspberry Pi OS Bookworm, of installeer Node.js via https://nodejs.org."
info "git $(git --version | awk '{print $3}'), Node.js $(node -v)"

# --- 2. Code ophalen ------------------------------------------------------------
bold "2/5  Code ophalen"
if [[ -d "$TARGET/.git" ]]; then
  git -C "$TARGET" fetch -q --depth 1 origin "$BRANCH"
  git -C "$TARGET" checkout -q -B "$BRANCH" FETCH_HEAD
  info "Bijgewerkt in $TARGET"
else
  git clone -q --depth 1 --branch "$BRANCH" "$REPO_URL" "$TARGET"
  info "Opgehaald naar $TARGET"
fi
APP="$TARGET/hygge-bridge"
cd "$APP"
npm ci --omit=dev --no-audit --no-fund --loglevel=error
info "Onderdelen geïnstalleerd"

# --- 3. Instellingen (.env) -------------------------------------------------------
set_env() { # set_env SLEUTEL waarde  (past .env aan, zonder de rest te wijzigen)
  node -e '
    const fs = require("fs");
    const [key, value] = process.argv.slice(1);
    const lines = fs.readFileSync(".env", "utf8").split("\n");
    const i = lines.findIndex((l) => l.startsWith(key + "="));
    if (i >= 0) lines[i] = key + "=" + value; else lines.push(key + "=" + value);
    fs.writeFileSync(".env", lines.join("\n"), { mode: 0o600 });
  ' "$1" "$2"
}
get_env() { grep -E "^$1=" .env 2>/dev/null | tail -n1 | cut -d= -f2- || true; }

bold "3/5  Instellingen"
if [[ -f .env && $RECONFIGURE -eq 0 ]]; then
  info "Bestaande instellingen behouden (.env). Opnieuw invullen: voeg --opnieuw-instellen toe."
else
  [[ -f .env ]] || install -m 600 .env.example .env
  info "Plak telkens de waarde en druk op Enter. Enter zonder iets = waarde tussen [ ] behouden."
  set_env NIKO_HOST  "$(ask 'IP-adres van je Niko Connected Controller' "$(get_env NIKO_HOST)")"
  set_env NIKO_TOKEN "$(ask 'Niko Hobby API-token' "$(get_env NIKO_TOKEN)")"
  set_env IFTTT_KEY  "$(ask 'IFTTT Webhooks-sleutel' "$(get_env IFTTT_KEY)")"

  bold "     Niko-sensoren zoeken…"
  if ! timeout 30 node src/list-devices.js; then
    info "Kon de sensoren niet ophalen. Controleer het IP-adres en het token; je kan dit later opnieuw doen"
    info "met:  cd $APP && npm run devices"
  fi
  set_env NIKO_SENSOR_NAME "$(ask 'Naam van de sensor die je wilt tonen (zoals in de lijst)' "$(get_env NIKO_SENSOR_NAME)")"

  dry="$(ask 'Eerst testen zonder iets naar de Hygge te sturen? (j/n)' 'j')"
  if [[ "$dry" =~ ^[nN] ]]; then set_env DRY_RUN false; else set_env DRY_RUN true; fi
fi
chmod 600 .env

# --- 4. Dienst die automatisch start ---------------------------------------------
bold "4/5  Automatisch starten"
if [[ "$SKIP_SYSTEMD" == "1" ]]; then
  info "Overgeslagen (SKIP_SYSTEMD=1)"
else
  $SUDO tee /etc/systemd/system/hygge-bridge.service >/dev/null <<EOF
[Unit]
Description=Hygge-bridge (Niko-temperatuur tonen, Seitron Hygge bedienen)
After=network-online.target
Wants=network-online.target

[Service]
User=$(id -un)
WorkingDirectory=$APP
ExecStart=$(command -v node) src/index.js
Restart=always
RestartSec=30

[Install]
WantedBy=multi-user.target
EOF
  $SUDO systemctl daemon-reload
  $SUDO systemctl enable -q hygge-bridge
  $SUDO systemctl restart hygge-bridge
  sleep 3
  if systemctl is-active -q hygge-bridge; then
    info "Draait, en start voortaan vanzelf na een herstart van de Pi"
  else
    info "Start niet goed. Bekijk wat er misloopt met:  journalctl -u hygge-bridge -n 30"
  fi
fi

# --- 5. Klaar --------------------------------------------------------------------
bold "5/5  Klaar"
ip="$(hostname -I 2>/dev/null | awk '{print $1}')"
port="$(get_env WEB_PORT)"; port="${port:-8080}"
info "Open op je iPhone (op hetzelfde wifi-netwerk):"
info "    http://${ip:-<ip-van-de-pi>}:$port"
info "    of http://$(hostname).local:$port"
if [[ "$(get_env DRY_RUN)" == "true" ]]; then
  info ""
  info "Testmodus staat aan: er gaat nog niets naar de Hygge."
  info "Alles in orde? Zet de testmodus uit met:"
  info "    sed -i 's/^DRY_RUN=.*/DRY_RUN=false/' $APP/.env && sudo systemctl restart hygge-bridge"
fi
info ""
info "Logboek volgen:  journalctl -u hygge-bridge -f"
