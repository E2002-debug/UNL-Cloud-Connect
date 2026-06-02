import smtplib
from email.mime.text import MIMEText

# Configuración basada en tu .env
sender = "miguel.a.luna@unl.edu.ec"
password = "hnnvtyexjxmjfved"
receiver = "miguel.a.luna@unl.edu.ec"  # Enviártelo a ti mismo para probar

msg = MIMEText("¡Si lees esto, la configuración de Gmail funciona perfectamente!")
msg['Subject'] = 'Prueba de Conexión UNL Cloud'
msg['From'] = sender
msg['To'] = receiver

try:
    print("Conectando con Google...")
    # Usamos puerto 587 con STARTTLS tal como lo tienes
    server = smtplib.SMTP('smtp.gmail.com', 587)
    server.starttls() 
    
    print("Iniciando sesión...")
    server.login(sender, password)
    
    print("Enviando correo...")
    server.sendmail(sender, [receiver], msg.as_string())
    server.quit()
    print("✅ ¡Correo enviado con éxito! Revisa tu bandeja.")
except Exception as e:
    print(f"❌ Error al enviar: {e}")