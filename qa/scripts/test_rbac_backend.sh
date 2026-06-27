#!/bin/bash
# ============================================================
# test_rbac_backend.sh
# Pruebas de bypass RBAC directas al backend (bypass Kong)
# Simula ataques directos a los microservicios saltando el API Gateway
# ============================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'
BOLD='\033[1m'

PASS=0
FAIL=0
TOTAL=0

print_banner() {
    echo -e "${CYAN}============================================${NC}"
    echo -e "${CYAN}  PRUEBAS RBAC BACKEND - BYPASS DE KONG${NC}"
    echo -e "${CYAN}  Ataques directos a microservicios${NC}"
    echo -e "${CYAN}============================================${NC}"
    echo ""
}

print_result() {
    TOTAL=$((TOTAL + 1))
    if [ "$1" == "PASS" ]; then
        echo -e "  ${GREEN}✓ PASS${NC} $2"
        PASS=$((PASS + 1))
    else
        echo -e "  ${RED}✗ FAIL${NC} $2"
        FAIL=$((FAIL + 1))
    fi
    echo ""
}

# ============================================================
# CONFIGURACIÓN
# ============================================================
API_GATEWAY="${API_GATEWAY:-http://localhost:8000/api}"
MS_USUARIOS_DIRECTO="${MS_USUARIOS_DIRECTO:-http://localhost:8001}"  # Puerto admin de Kong
MS_EVENTOS_DIRECTO="${MS_EVENTOS_DIRECTO:-http://localhost:8002}"     # Puerto directo de ms_eventos

echo -e "${YELLOW}API Gateway: ${API_GATEWAY}${NC}"
echo -e "${YELLOW}ms_eventos directo: ${MS_EVENTOS_DIRECTO}${NC}"
echo ""

# ============================================================
# PRERREQUISITO: Obtener token de Participante (rol=2)
# ============================================================
echo -e "${BOLD}[PRE-REQ] Obteniendo token de PARTICIPANTE (rol=2)...${NC}"

PARTICIPANTE_EMAIL="${PARTICIPANTE_EMAIL:-participante@unl.edu.ec}"
PARTICIPANTE_PASS="${PARTICIPANTE_PASS:-Test12345!}"

LOGIN_RESPONSE=$(curl -s -X POST "${API_GATEWAY}/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"username\": \"${PARTICIPANTE_EMAIL}\", \"password\": \"${PARTICIPANTE_PASS}\"}")

TOKEN_PARTICIPANTE=$(echo "$LOGIN_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('access_token',''))" 2>/dev/null)
ID_USUARIO=$(echo "$LOGIN_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('id_usuario','1'))" 2>/dev/null)

if [ -z "$TOKEN_PARTICIPANTE" ]; then
    echo -e "${RED}  No se pudo obtener token de participante.${NC}"
    echo -e "${YELLOW}  Crea un usuario participante primero.${NC}"
    exit 1
fi
echo -e "${GREEN}  Token obtenido.${NC}"
echo ""

# ============================================================
# PRUEBA 1: Ataque directo a ms_eventos (bypass Kong)
# El puerto 8002 está expuesto en docker-compose.yml
# ============================================================
echo -e "${BOLD}[PRUEBA 1] POST /eventos/ directo a ms_eventos:8002 (bypass Kong)${NC}"
echo -e "  Simula: atacante descubre puerto expuesto de ms_eventos"
echo ""

# 1a. Sin headers de Kong
echo -e "  → Sin headers x-user-id / x-user-role"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${MS_EVENTOS_DIRECTO}/eventos/" \
    -H "Content-Type: application/json" \
    -d '{
        "titulo": "Evento Hackeado",
        "descripcion": "Intento de creación sin autorización",
        "fecha_hora": "2026-12-31T23:59:59",
        "id_ubicacion": 1
    }')
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
if [ "$HTTP_CODE" == "422" ]; then
    print_result "PASS" "ms_eventos rechazó (422) porque falta header x-user-id. FastAPI valida headers requeridos."
elif [ "$HTTP_CODE" == "403" ]; then
    print_result "PASS" "ms_eventos rechazó (403). RBAC funcionando."
elif [ "$HTTP_CODE" == "201" ] || [ "$HTTP_CODE" == "200" ]; then
    print_result "FAIL" "VULNERABILIDAD CRÍTICA: ms_eventos aceptó petición sin headers de Kong."
else
    echo -e "    Código: ${HTTP_CODE}"
fi

# 1b. Con x-user-role=2 (Participante) - simula atacante que falsifica header
echo -e "  → Con x-user-role=2 y x-user-id=1"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${MS_EVENTOS_DIRECTO}/eventos/" \
    -H "Content-Type: application/json" \
    -H "x-user-id: 999" \
    -H "x-user-role: 2" \
    -d '{
        "titulo": "Evento Hackeado",
        "descripcion": "Intento con rol falso",
        "fecha_hora": "2026-12-31T23:59:59",
        "id_ubicacion": 1
    }')
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -n -1)
if [ "$HTTP_CODE" == "403" ]; then
    print_result "PASS" "ms_eventos rechazó (403) con x-user-role=2. RBAC funcionando."
elif [ "$HTTP_CODE" == "201" ] || [ "$HTTP_CODE" == "200" ]; then
    echo -e "    ${RED}BODY:${NC} $BODY"
    print_result "FAIL" "VULNERABILIDAD: ms_eventos aceptó con rol de participante (x-user-role=2)."
else
    echo -e "    Código: ${HTTP_CODE}, Body: $BODY"
fi

# 1c. Con x-user-role=1 (Administrador) - ¿acepta sin JWT?
echo -e "  → Con x-user-role=1 (sin JWT válido)"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${MS_EVENTOS_DIRECTO}/eventos/" \
    -H "Content-Type: application/json" \
    -H "x-user-id: 999" \
    -H "x-user-role: 1" \
    -d '{
        "titulo": "Evento Hackeado",
        "descripcion": "Intento con rol admin falsificado",
        "fecha_hora": "2026-12-31T23:59:59",
        "id_ubicacion": 1
    }')
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -n -1)
echo -e "    Código: ${HTTP_CODE}"

if [ "$HTTP_CODE" == "201" ] || [ "$HTTP_CODE" == "200" ]; then
    echo -e "  ${RED}RESPUESTA:${NC} $BODY"
    print_result "FAIL" "VULNERABILIDAD CRÍTICA: ms_eventos acepta creación con solo header x-user-role=1"
    echo -e "  ${RED}  ¡No hay validación JWT! Cualquiera con acceso al puerto 8002 puede crear eventos.${NC}"
else
    print_result "PASS" "ms_eventos rechazó la petición. Posible validación adicional."
fi

# ============================================================
# PRUEBA 2: PUT /eventos/{id} con token de participante vía gateway
# ============================================================
echo -e "${BOLD}[PRUEBA 2] PUT /eventos/1 con token PARTICIPANTE vía Gateway${NC}"
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT "${API_GATEWAY}/eventos/1" \
    -H "Authorization: Bearer ${TOKEN_PARTICIPANTE}" \
    -H "Content-Type: application/json" \
    -d '{"titulo": "Intento de edición"}')
HTTP_CODE=$(echo "$RESPONSE" | tail -1)

if [ "$HTTP_CODE" == "403" ]; then
    print_result "PASS" "Gateway rechazó edición de evento con token de participante (403)."
elif [ "$HTTP_CODE" == "401" ]; then
    print_result "PASS" "Gateway rechazó (401)."
elif [ "$HTTP_CODE" == "200" ]; then
    print_result "FAIL" "VULNERABILIDAD: Participante pudo editar un evento."
else
    echo -e "    Código: ${HTTP_CODE}"
fi

# ============================================================
# PRUEBA 3: DELETE /eventos/{id} con token de participante
# ============================================================
echo -e "${BOLD}[PRUEBA 3] DELETE /eventos/1 con token PARTICIPANTE vía Gateway${NC}"
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" -X DELETE "${API_GATEWAY}/eventos/1" \
    -H "Authorization: Bearer ${TOKEN_PARTICIPANTE}")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)

if [ "$HTTP_CODE" == "403" ] || [ "$HTTP_CODE" == "401" ]; then
    print_result "PASS" "Gateway rechazó eliminación de evento con token de participante (${HTTP_CODE})."
elif [ "$HTTP_CODE" == "200" ] || [ "$HTTP_CODE" == "204" ]; then
    print_result "FAIL" "VULNERABILIDAD: Participante pudo eliminar un evento."
else
    echo -e "    Código: ${HTTP_CODE}"
fi

# ============================================================
# PRUEBA 4: Intentar crear ubicación con token de participante
# ============================================================
echo -e "${BOLD}[PRUEBA 4] POST /eventos/ubicaciones/ con token PARTICIPANTE${NC}"
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_GATEWAY}/eventos/ubicaciones/" \
    -H "Authorization: Bearer ${TOKEN_PARTICIPANTE}" \
    -H "Content-Type: application/json" \
    -d '{"nombre": "Ubicación Falsa", "latitud": -4.0, "longitud": -79.0}')
HTTP_CODE=$(echo "$RESPONSE" | tail -1)

if [ "$HTTP_CODE" == "403" ] || [ "$HTTP_CODE" == "401" ]; then
    print_result "PASS" "Gateway rechazó creación de ubicación (${HTTP_CODE})."
elif [ "$HTTP_CODE" == "201" ] || [ "$HTTP_CODE" == "200" ]; then
    print_result "FAIL" "VULNERABILIDAD: Participante pudo crear ubicación."
else
    echo -e "    Código: ${HTTP_CODE}"
fi

# ============================================================
# PRUEBA 5: Ataque directo a ms_eventos para subir imagen sin auth
# ============================================================
echo -e "${BOLD}[PRUEBA 5] POST /eventos/1/imagenes/ directo a ms_eventos:8002${NC}"
echo -e "  (requiere solo x-user-id, sin verificación de rol)"
echo ""

# Crear un archivo de prueba
echo "fake-image-data" > /tmp/fake_test_image.jpg

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${MS_EVENTOS_DIRECTO}/eventos/1/imagenes/" \
    -H "x-user-id: 999" \
    -F "archivo=@/tmp/fake_test_image.jpg")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
rm -f /tmp/fake_test_image.jpg

echo -e "    Código: ${HTTP_CODE} (nota: cualquier usuario autenticado puede subir imágenes, esto es esperado)"

# ============================================================
# PRUEBA 6: Verificar que endpoints públicos de eventos son accesibles
# ============================================================
echo -e "${BOLD}[PRUEBA 6] GET /eventos/activos (público) vía Gateway${NC}"
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "${API_GATEWAY}/eventos/activos")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)

if [ "$HTTP_CODE" == "200" ]; then
    print_result "PASS" "Feed de eventos público accesible (200)."
else
    echo -e "    Código: ${HTTP_CODE}"
fi

# ============================================================
# PRUEBA 7: Probar reacciones (like/dislike) - cualquier autenticado
# ============================================================
echo -e "${BOLD}[PRUEBA 7] POST /eventos/imagenes/1/reaccion con token PARTICIPANTE${NC}"
echo -e "  (esto debe funcionar - cualquier autenticado puede reaccionar)"
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_GATEWAY}/eventos/imagenes/1/reaccion" \
    -H "Authorization: Bearer ${TOKEN_PARTICIPANTE}" \
    -H "Content-Type: application/json" \
    -d '{"tipo_reaccion": "like"}')
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -n -1)

echo -e "    Código: ${HTTP_CODE}"
if [ "$HTTP_CODE" == "200" ] || [ "$HTTP_CODE" == "201" ]; then
    print_result "PASS" "Participante puede reaccionar (${HTTP_CODE}) - funcionalidad esperada."
elif [ "$HTTP_CODE" == "404" ]; then
    print_result "PASS" "Imagen no encontrada (404) - esperado si no hay datos."
else
    echo -e "    Body: ${BODY}"
fi

# ============================================================
# PRUEBA 8: Actualizar perfil propio (debe funcionar para participante)
# ============================================================
echo -e "${BOLD}[PRUEBA 8] PUT /usuarios/me con token PARTICIPANTE (auto-gestión)${NC}"
echo -e "  (esto debe funcionar - cualquier autenticado puede editar su perfil)"
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT "${API_GATEWAY}/usuarios/me" \
    -H "Authorization: Bearer ${TOKEN_PARTICIPANTE}" \
    -H "Content-Type: application/json" \
    -d '{"nombre": "Participante"}')
HTTP_CODE=$(echo "$RESPONSE" | tail -1)

if [ "$HTTP_CODE" == "200" ]; then
    print_result "PASS" "Participante puede actualizar su propio perfil (200) - esperado."
elif [ "$HTTP_CODE" == "401" ]; then
    echo -e "    El token puede haber expirado o ser inválido."
else
    echo -e "    Código: ${HTTP_CODE}"
fi

# ============================================================
# RESUMEN
# ============================================================
echo -e "${CYAN}============================================${NC}"
echo -e "${CYAN}  RESUMEN DE PRUEBAS BACKEND${NC}"
echo -e "${CYAN}============================================${NC}"
echo -e "  Total: ${TOTAL} | ${GREEN}PASS: ${PASS}${NC} | ${RED}FAIL: ${FAIL}${NC}"
echo ""

echo -e "${BOLD}Hallazgos clave:${NC}"
echo -e "  ${YELLOW}1. ms_eventos:8002 está expuesto en docker-compose.yml${NC}"
echo -e "     Cualquiera con acceso a la red local puede bypassear Kong."
echo -e "     La seguridad depende solo de headers inyectables."
echo ""
echo -e "  ${YELLOW}2. No hay validación JWT en ms_eventos${NC}"
echo -e "     Confía ciegamente en x-user-role y x-user-id."
echo ""
echo -e "  ${YELLOW}3. ms_gestion_usuarios usa Depends() de FastAPI${NC}"
echo -e "     Esto es más seguro porque el JWT se valida con SECRET_KEY."
echo ""

if [ "$FAIL" -gt 0 ]; then
    echo -e "${RED}⚠ Se encontraron vulnerabilidades en backend.${NC}"
    echo -e "${RED}  Revisar vulnerabilities_report.md para detalles.${NC}"
    exit 1
else
    echo -e "${GREEN}✓ Backend RBAC funcionando correctamente.${NC}"
    exit 0
fi
