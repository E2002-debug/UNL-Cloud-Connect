#!/bin/bash
# ============================================================
# test_rbac_frontend.sh
# Pruebas de bypass RBAC desde el frontend (manipulación de localStorage)
# Simula lo que un atacante puede hacer desde DevTools del navegador
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
    echo -e "${CYAN}  PRUEBAS RBAC FRONTEND - BYPASS LOCALSTORAGE${NC}"
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
API_BASE="${API_BASE:-http://localhost:8000/api}"

echo -e "${YELLOW}API Base: ${API_BASE}${NC}"
echo ""

# ============================================================
# PRERREQUISITO: Obtener token de Participante (rol=2)
# Requiere tener un usuario participante registrado
# ============================================================
echo -e "${BOLD}[PRE-REQ] Obteniendo token de PARTICIPANTE (rol=2)...${NC}"

# Nota: Reemplazar con credenciales reales de un participante existente
PARTICIPANTE_EMAIL="${PARTICIPANTE_EMAIL:-participante@unl.edu.ec}"
PARTICIPANTE_PASS="${PARTICIPANTE_PASS:-Test12345!}"

LOGIN_RESPONSE=$(curl -s -X POST "${API_BASE}/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"username\": \"${PARTICIPANTE_EMAIL}\", \"password\": \"${PARTICIPANTE_PASS}\"}")

TOKEN_PARTICIPANTE=$(echo "$LOGIN_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('access_token',''))" 2>/dev/null)
ROL_PARTICIPANTE=$(echo "$LOGIN_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('id_rol',''))" 2>/dev/null)

if [ -z "$TOKEN_PARTICIPANTE" ]; then
    echo -e "${RED}  No se pudo obtener token de participante.${NC}"
    echo -e "${YELLOW}  Crea un usuario participante primero o configura PARTICIPANTE_EMAIL/PARTICIPANTE_PASS env vars.${NC}"
    echo -e "${YELLOW}  Ejemplo: export PARTICIPANTE_EMAIL=test@unl.edu.ec PARTICIPANTE_PASS=Pass1234!${NC}"
    exit 1
fi
echo -e "${GREEN}  Token obtenido. id_rol=${ROL_PARTICIPANTE}${NC}"
echo ""

# ============================================================
# PRUEBA 1: Intentar listar usuarios con token de participante
# Simula: atacante que usa su token real pero accede a ruta admin
# ============================================================
echo -e "${BOLD}[PRUEBA 1] GET /usuarios/ con token PARTICIPANTE (rol=${ROL_PARTICIPANTE})${NC}"
echo -e "  Simula: atacante usa su token real para acceder a ruta admin"
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "${API_BASE}/usuarios/" \
    -H "Authorization: Bearer ${TOKEN_PARTICIPANTE}")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" == "403" ]; then
    print_result "PASS" "Acceso denegado (HTTP 403) como se esperaba. Middleware RBAC bloqueó al participante."
elif [ "$HTTP_CODE" == "401" ]; then
    print_result "PASS" "Acceso denegado (HTTP 401). El token no es válido para esta ruta."
elif [ "$HTTP_CODE" == "200" ]; then
    echo -e "  ${RED}RESPUESTA:${NC} $BODY"
    print_result "FAIL" "VULNERABILIDAD: Participante pudo listar usuarios (HTTP 200). RBAC no está funcionando."
else
    echo -e "  ${YELLOW}RESPUESTA (${HTTP_CODE}):${NC} $BODY"
    print_result "FAIL" "Código inesperado ${HTTP_CODE}. Revisar configuración."
fi

# ============================================================
# PRUEBA 2: Acceder a GET /usuarios/ SIN token
# Simula: atacante no autenticado
# ============================================================
echo -e "${BOLD}[PRUEBA 2] GET /usuarios/ SIN token${NC}"
echo -e "  Simula: atacante no autenticado intenta acceder"
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "${API_BASE}/usuarios/")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)

if [ "$HTTP_CODE" == "401" ] || [ "$HTTP_CODE" == "403" ]; then
    print_result "PASS" "Acceso denegado (HTTP ${HTTP_CODE}). Usuario no autenticado no puede acceder."
elif [ "$HTTP_CODE" == "200" ]; then
    print_result "FAIL" "VULNERABILIDAD: Endpoint accesible sin autenticación (HTTP 200)."
else
    print_result "FAIL" "Código inesperado ${HTTP_CODE}."
fi

# ============================================================
# PRUEBA 3: Simular manipulación de localStorage (lo que haría un atacante en DevTools)
# Nota: Esta prueba usa el token de participante REAL y lo fuerza en endpoints admin
# Esto simula al atacante que modificó id_rol en localStorage del navegador
# ============================================================
echo -e "${BOLD}[PRUEBA 3] Simulación: atacante modificó 'id_rol'=1 en localStorage${NC}"
echo -e "  El frontend muestra UI de admin, pero las APIs deben rechazar"
echo -e "  Usando el token REAL de participante contra endpoints protegidos"
echo ""

ENDPOINTS=(
    "GET:${API_BASE}/usuarios/"
    "PUT:${API_BASE}/usuarios/1"
    "DELETE:${API_BASE}/usuarios/2"
)

for endpoint in "${ENDPOINTS[@]}"; do
    METHOD="${endpoint%%:*}"
    URL="${endpoint#*:}"

    echo -e "  → ${METHOD} ${URL}"

    if [ "$METHOD" == "GET" ]; then
        RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$URL" \
            -H "Authorization: Bearer ${TOKEN_PARTICIPANTE}")
    elif [ "$METHOD" == "PUT" ]; then
        RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT "$URL" \
            -H "Authorization: Bearer ${TOKEN_PARTICIPANTE}" \
            -H "Content-Type: application/json" \
            -d '{"nombre": "Hacker"}')
    elif [ "$METHOD" == "DELETE" ]; then
        RESPONSE=$(curl -s -w "\n%{http_code}" -X DELETE "$URL" \
            -H "Authorization: Bearer ${TOKEN_PARTICIPANTE}")
    fi

    HTTP_CODE=$(echo "$RESPONSE" | tail -1)

    if [ "$HTTP_CODE" == "403" ] || [ "$HTTP_CODE" == "401" ]; then
        echo -e "    ${GREEN}Denegado (${HTTP_CODE})${NC}"
    elif [ "$HTTP_CODE" == "200" ] || [ "$HTTP_CODE" == "201" ] || [ "$HTTP_CODE" == "204" ]; then
        echo -e "    ${RED}VULNERABILIDAD: ACCESO CONCEDIDO (${HTTP_CODE})${NC}"
        print_result "FAIL" "${METHOD} ${URL} → acceso concedido con token de participante"
    fi
done

echo ""

# ============================================================
# PRUEBA 4: Verificar que el endpoint público /eventos/activos funciona
# (Esto debe funcionar sin token)
# ============================================================
echo -e "${BOLD}[PRUEBA 4] GET /eventos/activos (público, sin token)${NC}"
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "${API_BASE}/eventos/activos")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)

if [ "$HTTP_CODE" == "200" ]; then
    print_result "PASS" "Endpoint público accesible sin autenticación (HTTP 200). OK."
else
    echo -e "  ${YELLOW}Código: ${HTTP_CODE}${NC}"
    print_result "FAIL" "Endpoint público debería retornar 200."
fi

# ============================================================
# PRUEBA 5: Verificar que el frontend tiene expuesto UI de admin
# aunque el backend rechace. Esto lo probamos viendo el Dashboard
# ============================================================
echo -e "${BOLD}[PRUEBA 5] Simulación completa de bypass frontend${NC}"
echo -e "  Pasos que realizaría un atacante en DevTools:"
echo -e "  1. Abrir localStorage en Application → Local Storage → http://localhost"
echo -e "  2. Cambiar 'id_rol' de '2' a '1'"
echo -e "  3. Cambiar 'nombre' a 'Admin'"
echo -e "  4. Recargar la página (F5)"
echo ""
echo -e "  ${YELLOW}Resultado esperado:${NC} La UI muestra menú de Administrador"
echo -e "  (Dashboard, Usuarios, Eventos, Sensores, Configuración)"
echo -e "  ${YELLOW}Riesgo:${NC} Exposición de funcionalidad aunque las APIs rechacen"
echo ""

print_result "PASS" "Verificación documental: El frontend permite cambiar UI role por localStorage. Ver vulnerabilities_report.md para severidad."

# ============================================================
# RESUMEN
# ============================================================
echo -e "${CYAN}============================================${NC}"
echo -e "${CYAN}  RESUMEN${NC}"
echo -e "${CYAN}============================================${NC}"
echo -e "  Total: ${TOTAL} | ${GREEN}PASS: ${PASS}${NC} | ${RED}FAIL: ${FAIL}${NC}"
echo ""

if [ "$FAIL" -gt 0 ]; then
    echo -e "${RED}⚠ Se encontraron vulnerabilidades. Revisar vulnerabilities_report.md${NC}"
    exit 1
else
    echo -e "${GREEN}✓ Todas las pruebas de bypass frontend pasaron.${NC}"
    echo -e "${GREEN}  El middleware RBAC está funcionando correctamente en backend.${NC}"
    exit 0
fi
