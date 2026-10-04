import os
import sys
import json
import time
import threading
import socket
import http.server
import functools
import ctypes
import webview
import pystray
from PIL import Image, ImageDraw

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

def is_position_visible(x, y, min_visible_w=100, min_visible_h=50):
    """Check if the given (x, y) coordinates intersect with any active display."""
    if x is None or y is None:
        return False
    # Filter out minimized or extreme off-screen coordinate markers (like -32000 in Win32)
    if x <= -10000 or y <= -10000:
        return False
    try:
        user32 = ctypes.windll.user32
        # SM_XVIRTUALSCREEN = 76, SM_YVIRTUALSCREEN = 77, SM_CXVIRTUALSCREEN = 78, SM_CYVIRTUALSCREEN = 79
        vx = user32.GetSystemMetrics(76)
        vy = user32.GetSystemMetrics(77)
        vw = user32.GetSystemMetrics(78)
        vh = user32.GetSystemMetrics(79)
        # Verify that at least a corner of the window title bar is within the virtual screen
        if (x + min_visible_w > vx) and (x < vx + vw) and (y + min_visible_h > vy) and (y < vy + vh):
            return True
        return False
    except Exception:
        return 0 <= x < 20000 and 0 <= y < 20000

def get_window_hwnd():
    """Retrieve the native Win32 window HWND handle."""
    global main_window
    if not main_window:
        return None
    try:
        import webview.platforms.winforms as wf
        inst = wf.BrowserView.instances.get(main_window.uid)
        if inst and hasattr(inst, "Handle"):
            return inst.Handle.ToInt32()
    except Exception:
        pass
    try:
        user32 = ctypes.windll.user32
        hwnd = user32.FindWindowW(None, "langtool - Desktop Assistant")
        if hwnd:
            return hwnd
    except Exception:
        pass
    return None

def force_activate_window(hwnd):
    """Restore and bring the window to the foreground on Windows."""
    if not hwnd:
        return
    try:
        user32 = ctypes.windll.user32
        kernel32 = ctypes.windll.kernel32

        # SW_RESTORE = 9, SW_SHOW = 5
        if user32.IsIconic(hwnd):
            user32.ShowWindow(hwnd, 9)
        else:
            user32.ShowWindow(hwnd, 5)

        # AttachThreadInput bypass to ensure window can take foreground from background tray
        fg_hwnd = user32.GetForegroundWindow()
        if fg_hwnd and fg_hwnd != hwnd:
            fg_thread = user32.GetWindowThreadProcessId(fg_hwnd, None)
            cur_thread = kernel32.GetCurrentThreadId()
            if fg_thread != cur_thread and fg_thread != 0:
                user32.AttachThreadInput(cur_thread, fg_thread, True)
                user32.SetForegroundWindow(hwnd)
                user32.BringWindowToTop(hwnd)
                user32.AttachThreadInput(cur_thread, fg_thread, False)
            else:
                user32.SetForegroundWindow(hwnd)
                user32.BringWindowToTop(hwnd)
        else:
            user32.SetForegroundWindow(hwnd)
            user32.BringWindowToTop(hwnd)
    except Exception as e:
        print("force_activate_window warning:", e)

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
                if x is not None and isinstance(x, (int, float)):
                    x = int(x)
                else:
                    x = None

                if y is not None and isinstance(y, (int, float)):
                    y = int(y)
                else:
                    y = None

                # Never load off-screen or minimized coordinates (-32000)
                if not is_position_visible(x, y):
                    x = None
                    y = None

                return {
                    "width": width,
                    "height": height,
                    "x": x,
                    "y": y,
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
            hwnd = get_window_hwnd()
            if hwnd:
                user32 = ctypes.windll.user32
                # If window is currently minimized (IsIconic), NEVER save position/size
                if user32.IsIconic(hwnd):
                    return

            state_file = get_state_file_path()
            current_data = {}
            if os.path.exists(state_file):
                try:
                    with open(state_file, "r", encoding="utf-8") as f:
                        current_data = json.load(f)
                except Exception:
                    pass

            is_maximized = False
            if hwnd:
                user32 = ctypes.windll.user32
                is_maximized = bool(user32.IsZoomed(hwnd))

            if not is_maximized:
                w = getattr(main_window, "width", None)
                h = getattr(main_window, "height", None)
                x = getattr(main_window, "x", None)
                y = getattr(main_window, "y", None)

                if w and w >= 760:
                    current_data["width"] = int(w)
                if h and h >= 520:
                    current_data["height"] = int(h)

                # Only save position if strictly visible and not offscreen / minimized
                if is_position_visible(x, y):
                    current_data["x"] = int(x)
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

def is_system_dark_theme():
    try:
        import winreg
        key = winreg.OpenKey(
            winreg.HKEY_CURRENT_USER,
            r"Software\Microsoft\Windows\CurrentVersion\Themes\Personalize",
            0,
            winreg.KEY_READ
        )
        val, _ = winreg.QueryValueEx(key, "AppsUseLightTheme")
        winreg.CloseKey(key)
        return val == 0
    except Exception:
        return False

DEFAULT_APP_PORT = 48123

def get_app_port():
    # Deterministic port ensures localStorage (theme, user draft, api url) persists across launches
    for port in (DEFAULT_APP_PORT, 48124, 48125, 48126):
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.bind(('127.0.0.1', port))
                return port
        except OSError:
            continue
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
    if not main_window:
        return

    try:
        hwnd = get_window_hwnd()
        user32 = ctypes.windll.user32

        # Step 1: Check if window position is offscreen (e.g. -32000) and bring it back
        try:
            curr_x = getattr(main_window, 'x', None)
            curr_y = getattr(main_window, 'y', None)
            if not is_position_visible(curr_x, curr_y):
                saved = load_window_state()
                tx = saved.get("x")
                ty = saved.get("y")
                if not is_position_visible(tx, ty):
                    # Center on primary monitor
                    sw = user32.GetSystemMetrics(0)
                    sh = user32.GetSystemMetrics(1)
                    ww = saved.get("width", 1020)
                    wh = saved.get("height", 720)
                    tx = max(80, (sw - ww) // 2)
                    ty = max(60, (sh - wh) // 2)
                main_window.move(int(tx), int(ty))
        except Exception as ex:
            print("Position verification warning:", ex)

        # Step 2: pywebview restore & show
        main_window.show()
        main_window.restore()

        # Step 3: Windows foreground activation
        if hwnd:
            force_activate_window(hwnd)

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

def make_rounded_icon(image):
    try:
        img = image.convert("RGBA")
        w, h = img.size
        # 4x supersampling for smooth antialiased circular edges
        mask = Image.new("L", (w * 4, h * 4), 0)
        draw = ImageDraw.Draw(mask)
        draw.ellipse((0, 0, w * 4, h * 4), fill=255)
        mask = mask.resize((w, h), Image.Resampling.LANCZOS)

        rounded = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        rounded.paste(img, (0, 0), mask)
        return rounded
    except Exception:
        return image

def setup_system_tray(icon_path):
    global tray_icon
    try:
        if os.path.exists(icon_path):
            image = Image.open(icon_path)
        else:
            image = Image.new('RGBA', (32, 32), color=(14, 165, 233, 255))

        # Ensure icon is smoothly rounded with transparent edges
        image = make_rounded_icon(image)

        menu = pystray.Menu(
            pystray.MenuItem("Open langtool", lambda icon, item: show_window(), default=True),
            pystray.MenuItem("Hide to Tray", lambda icon, item: hide_window()),
            pystray.Menu.SEPARATOR,
            pystray.MenuItem("langtool API: langtool.ysnirix.xyz", lambda icon, item: None, enabled=False),
            pystray.Menu.SEPARATOR,
            pystray.MenuItem("Exit", lambda icon, item: quit_app())
        )

        tray_icon = pystray.Icon("langtool", image, "langtool Desktop", menu)
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

    port = get_app_port()
    start_static_server(port, dist_dir)
    app_url = f"http://127.0.0.1:{port}"

    saved_state = load_window_state()

    setup_system_tray(icon_path)
    setup_global_hotkey()

    system_is_dark = is_system_dark_theme()
    initial_bg = "#0f172a" if system_is_dark else "#f8fafc"

    window_kwargs = {
        "title": "langtool - Desktop Assistant",
        "url": app_url,
        "width": saved_state["width"],
        "height": saved_state["height"],
        "min_size": (760, 520),
        "background_color": initial_bg,
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
        hwnd = get_window_hwnd()
        if hwnd:
            force_activate_window(hwnd)

    main_window.events.shown += on_shown

    # Persistent storage folder for WebView2 local storage and cookies
    appdata = os.environ.get("APPDATA")
    storage_path = os.path.join(appdata, "LanguageToolWin", "web_cache") if appdata else None
    if storage_path:
        os.makedirs(storage_path, exist_ok=True)

    # Start Edge WebView2 with persistent storage and cookies enabled
    webview.start(debug=False, private_mode=False, storage_path=storage_path)

if __name__ == "__main__":
    main()
