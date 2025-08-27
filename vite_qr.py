import subprocess
import sys
import os
#TENER LA LIBRERIA pip install qrcode[pil]
def main():
    npm_path = r"C:\Program Files\nodejs\npm.cmd"  # Ajusta según tu instalación
    project_dir = r"C:\wamp64\www\CalorEase"       # Carpeta donde está tu package.json

    # Cambiar a la carpeta del proyecto
    os.chdir(project_dir)

    print("🚀 Iniciando servidor Vite...")

    try:
        # Arranca Vite con --host y clear-screen deshabilitado
        process = subprocess.Popen(
            [npm_path, "run", "dev", "--", "--host", "--", "--clear-screen", "false"],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True
        )
    except Exception as e:
        print(f"❌ Error al arrancar Vite: {e}")
        sys.exit(1)

    print("✅ Vite arrancado correctamente.\n")

    # Ejecutar qr.py mientras Vite corre
    try:
        subprocess.run([sys.executable, "qr.py"])
    except Exception as e:
        print(f"❌ Error al ejecutar qr.py: {e}")

    # Mantener el servidor Vite corriendo
    try:
        process.wait()
    except KeyboardInterrupt:
        print("\n🛑 Servidor detenido manualmente.")

if __name__ == "__main__":
    main()