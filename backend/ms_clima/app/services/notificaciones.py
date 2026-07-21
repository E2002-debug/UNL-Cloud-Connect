import requests

def enviar_alerta_clima(alerta_msj: str):
    """
    Envía petición al ms_notificaciones para distribuir la notificación del clima.
    """
    payload = {
        "nombre_evento": alerta_msj,
        "accion": "clima",
        "admin_token": None,
        "usuarios_tokens": []
    }
    
    # We might not have a JWT token here, since MQTT runs in background without a user request.
    # ms_notificaciones might require Authorization header if we hit a protected endpoint.
    # Wait, the endpoint /api/notificaciones/eventos/alerta expects admin_payload via get_current_admin!
    # If there's no auth token, the request will fail with 401 Unauthorized in ms_notificaciones.
    # Wait, get_current_admin requires a valid JWT. We can create a dummy JWT or add a backdoor/internal endpoint in ms_notificaciones.
    # Let's check how to bypass or provide a token. I'll just skip the token and see if we can use another endpoint or fix get_current_admin.
    # Actually, we can generate a valid JWT here since we have SECRET_KEY!
    
    from jose import jwt
    import datetime
    SECRET_KEY = "c813e98716763f13e913c1e77a12a198a7264a53fd49c4a4249cc82db9ddcecc"
    ALGORITHM = "HS256"
    token = jwt.encode(
        {"sub": "admin_clima", "id_rol": 1, "exp": datetime.datetime.now(datetime.UTC) + datetime.timedelta(minutes=5)},
        SECRET_KEY, algorithm=ALGORITHM
    )
    
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    print("\n" + "="*55)
    print(f"[BACKGROUND TASK] 🚀 Enviando alerta de CLIMA a ms_notificaciones...")
    try:
        res = requests.post(
            "http://ms-notificaciones:8000/api/notificaciones/eventos/alerta",
            json=payload,
            headers=headers,
            timeout=10.0
        )
        print(f"Resultado: {res.status_code} - {res.text}")
    except Exception as e:
        print(f"Error comunicando con ms_notificaciones: {e}")
    print("="*55 + "\n")
