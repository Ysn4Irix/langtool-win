import os
import sys
import threading
import socket
import http.server
import functools
import webview
import pystray
from PIL import Image

# Global references
main_window = None
tray_icon = None
force_exit = False

def get_free_port():
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(('127.0.0.1', 0))
        return s.getsockname()[1]

def start_static_server(port, directory):
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=directory)
    # Silent logging to keep console clean
    handler.log_message = lambda *args: None
    httpd = http.server.ThreadingHTTPServer(('127.0.0.1', port), handler)
    thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    thread.start()
    return httpd

def show_window():
    global main_window
    if main_window:
        try:
            main_window.show()
            main_window.restore()
        except Exception as e:
            print("Error showing window:", e)

def hide_window():
    global main_window
    if main_window:
        try:
            main_window.hide()
        except Exception as e:
            print("Error hiding window:", e)

def on_closing():
    global force_exit
    if force_exit:
        return True  # Proceed with closing
    # Minimize to tray instead of quitting
    hide_window()
    return False  # Cancel window destruction

def quit_app():
    global force_exit, main_window, tray_icon
    force_exit = True
    if tray_icon:
        try:
            tray_icon.stop()
        except Exception:
            pass
    if main_window:
        try:
            main_window.destroy()
        except Exception:
            pass
    os._exit(0)

def setup_system_tray(icon_path):
    global tray_icon
    try:
        if os.path.exists(icon_path):
            image = Image.open(icon_path)
        else:
            # Fallback 32x32 gradient icon if file missing
            image = Image.new('RGB', (32, 32), color=(14, 165, 233))

        menu = pystray.Menu(
            pystray.MenuItem("Open LanguageTool", lambda icon, item: show_window(), default=True),
            pystray.MenuItem("Hide to Tray", lambda icon, item: hide_window()),
            pystray.Menu.SEPARATOR,
            pystray.MenuItem("API: langtool.ysnirix.xyz", lambda icon, item: None, enabled=False),
            pystray.Menu.SEPARATOR,
            pystray.MenuItem("Exit", lambda icon, item: quit_app())
        )

        tray_icon = pystray.Icon("LanguageTool", image, "LanguageTool Desktop", menu)
        tray_thread = threading.Thread(target=tray_icon.run, daemon=True)
        tray_thread.start()
    except Exception as e:
        print("System tray initialization warning:", e)

def setup_global_hotkey():
    try:
        import keyboard
        # Register Ctrl+Shift+L to summon app anywhere
        keyboard.add_hotkey('ctrl+shift+l', show_window)
    except Exception as e:
        print("Global hotkey warning (may require elevated privileges on some systems):", e)

def main():
    global main_window

    base_dir = os.path.dirname(os.path.abspath(__file__))
    dist_dir = os.path.join(base_dir, "dist")
    icon_path = os.path.join(base_dir, "src-tauri", "icons", "32x32.png")

    if not os.path.exists(os.path.join(dist_dir, "index.html")):
        print("Dist folder not found. Running build...")
        os.system("npm run build")

    port = get_free_port()
    start_static_server(port, dist_dir)
    app_url = f"http://127.0.0.1:{port}"

    setup_system_tray(icon_path)
    setup_global_hotkey()

    main_window = webview.create_window(
        title="LanguageTool - Desktop Assistant",
        url=app_url,
        width=1020,
        height=720,
        min_size=(760, 520),
        background_color="#0f172a",
        text_select=True,
    )

    main_window.events.closing += on_closing

    # Start Edge WebView2 on Windows
    webview.start(gui='mshtml' if False else None, debug=False)

if __name__ == "__main__":
    main()
