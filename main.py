import os
import sys
import json
import time
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
save_timer = None
save_lock = threading.Lock()

def get_state_file_path():
    appdata = os.environ.get("APPDATA")
    if appdata:
        app_dir = os.path.join(appdata, "LanguageToolWin")
        os.makedirs(app_dir, exist_ok=True)
        return os.path.join(app_dir, "window_state.json")
    return os.path.join(os.path.dirname(os.path.abspath(__file__)), "window_state.json")

def load_window_state():
    state_file = get_state_file_path()
    if os.path.exists(state_file):
        try:
            with open(state_file, "r", encoding="utf-8") as f:
                data = json.load(f)
                width = max(int(data.get("width", 1020)), 760)
                height = max(int(data.get("height", 720)), 520)
                x = data.get("x")
                y = data.get("y")
                maximized = bool(data.get("maximized", False))

                # Ensure coordinates are reasonable numbers
                if x is not None and not isinstance(x, (int, float)):
                    x = None
                if y is not None and not isinstance(y, (int, float)):
                    y = None

                return {
                    "width": width,
                    "height": height,
                    "x": int(x) if x is not None else None,
                    "y": int(y) if y is not None else None,
                    "maximized": maximized
                }
        except Exception as e:
            print("Failed to read window_state.json:", e)

    return {
        "width": 1020,
        "height": 720,
        "x": None,
        "y": None,
        "maximized": False
    }

def save_window_state():
    global main_window
    if not main_window:
        return

    with save_lock:
        try:
            state_file = get_state_file_path()
            current_data = {}
            if os.path.exists(state_file):
                try:
                    with open(state_file, "r", encoding="utf-8") as f:
                        current_data = json.load(f)
                except Exception:
                    pass

            is_minimized = getattr(main_window, "minimized", False)
            is_maximized = getattr(main_window, "maximized", False)

            # Never overwrite dimensions if currently minimized
            if not is_minimized:
                if not is_maximized:
                    w = getattr(main_window, "width", None)
                    h = getattr(main_window, "height", None)
                    x = getattr(main_window, "x", None)
                    y = getattr(main_window, "y", None)

                    if w and w >= 760:
                        current_data["width"] = int(w)
                    if h and h >= 520:
                        current_data["height"] = int(h)
                    if x is not None:
                        current_data["x"] = int(x)
                    if y is not None:
                        current_data["y"] = int(y)

                current_data["maximized"] = is_maximized

            with open(state_file, "w", encoding="utf-8") as f:
                json.dump(current_data, f, indent=2)
        except Exception as e:
            print("Error saving window state:", e)

def debounced_save_state():
    global save_timer
    if save_timer and save_timer.is_alive():
        save_timer.cancel()
    save_timer = threading.Timer(0.4, save_window_state)
    save_timer.daemon = True
    save_timer.start()

def get_free_port():
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(('127.0.0.1', 0))
        return s.getsockname()[1]

def start_static_server(port, directory):
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=directory)
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
            save_window_state()
            main_window.hide()
        except Exception as e:
            print("Error hiding window:", e)

def on_closing():
    global force_exit
    save_window_state()
    if force_exit:
        return True  # Proceed with closing
    # Minimize to tray instead of quitting
    hide_window()
    return False  # Cancel window destruction

def quit_app():
    global force_exit, main_window, tray_icon
    force_exit = True
    save_window_state()
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
        keyboard.add_hotkey('ctrl+shift+l', show_window)
    except Exception as e:
        print("Global hotkey warning:", e)

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

    saved_state = load_window_state()

    setup_system_tray(icon_path)
    setup_global_hotkey()

    window_kwargs = {
        "title": "LanguageTool - Desktop Assistant",
        "url": app_url,
        "width": saved_state["width"],
        "height": saved_state["height"],
        "min_size": (760, 520),
        "background_color": "#0f172a",
        "text_select": True,
        "resizable": True,
    }

    if saved_state["x"] is not None and saved_state["y"] is not None:
        window_kwargs["x"] = saved_state["x"]
        window_kwargs["y"] = saved_state["y"]

    main_window = webview.create_window(**window_kwargs)

    # Attach lifecycle handlers
    main_window.events.closing += on_closing
    main_window.events.resized += lambda *args, **kwargs: debounced_save_state()
    main_window.events.moved += lambda *args, **kwargs: debounced_save_state()

    def on_shown():
        if saved_state.get("maximized"):
            try:
                time.sleep(0.1)
                main_window.maximize()
            except Exception:
                pass

    main_window.events.shown += on_shown

    # Start Edge WebView2
    webview.start(debug=False)

if __name__ == "__main__":
    main()
