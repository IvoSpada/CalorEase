import socket
import qrcode
import os
import re

def detectar_ip_lan():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
    finally:
        s.close()
    return ip

def actualizar_env(ip, env_path=".env"):
    # Leer archivo .env si existe
    if os.path.exists(env_path):
        with open(env_path, "r") as f:
            lines = f.readlines()
    else:
        lines = []

    # Reemplazar o agregar la variable VITE_LAN_IP
    found = False
    for i, line in enumerate(lines):
        if re.match(r"^VITE_LAN_IP=", line):
            lines[i] = f"VITE_LAN_IP={ip}\n"
            found = True
            break
    if not found:
        lines.append(f"VITE_LAN_IP={ip}\n")

    # Escribir de nuevo
    with open(env_path, "w") as f:
        f.writelines(lines)
    print(f"✅ .env actualizado con VITE_LAN_IP={ip}")

def main():
    ip = detectar_ip_lan()
    port = 8080
    url = f"http://{ip}:{port}"

    # Actualizar .env
    actualizar_env(ip)

    # Mostrar QR en consola
    qr = qrcode.QRCode()
    qr.add_data(url)
    qr.make(fit=True)

    print("\n📷 Escaneá este QR desde tu celular:\n")
    qr.print_ascii(invert=True)
    print(f"\n✅ URL de la aplicación: {url}\n")

if __name__ == "__main__":
    main()