# Packaging and Production Releases

This document explains how **langtool for Windows** is packaged into a standalone, portable desktop distribution and automated via GitHub Actions.

---

## 🚀 Quick Start (Local Build)

You can build the production release locally with a single command:

```powershell
npm run release
```

*Or directly via Python:*
```powershell
python scripts/build_release.py
```

### What this does:
1. **Cleans** previous build artifacts (`dist-app/`, `build/`).
2. **Builds Frontend:** Runs `npm run build` (`tsc && vite build`) to generate the optimized web assets in `dist/`.
3. **Compiles Standalone Windows App:** Runs PyInstaller using [`langtool.spec`](file:///c:/Users/lenovo/Desktop/Projects/antigravity/langtool-win/langtool.spec) with `--noconsole` (windowed GUI mode), bundling the Python backend, Edge WebView2 bindings, system tray integration, and native Win32 window management into `dist-app/langtool/`.
4. **Packages Portable ZIP:** Automatically zips the entire portable distribution into `dist-app/langtool-v<version>-windows-x64-portable.zip` (~35 MB).
5. **Calculates SHA256 Checksums:** Computes cryptographic hashes and writes them to `dist-app/checksums.txt`.

---

## 📦 Distribution Artifacts

After running the build, artifacts are located in `dist-app/`:

| Artifact | Description |
| :--- | :--- |
| `dist-app/langtool/langtool.exe` | Standalone executable (launches immediately with 0 console windows). |
| `dist-app/langtool/` | Full portable directory containing `langtool.exe` and runtime assets. |
| `dist-app/langtool-v*-windows-x64-portable.zip` | Single-archive zip distribution ready to distribute to users. |
| `dist-app/checksums.txt` | SHA256 verification hash. |

### End-User Experience
End users do **not** need Python, Node.js, or any package managers installed:
1. Download `langtool-v*-windows-x64-portable.zip`.
2. Extract anywhere (e.g. `C:\Users\<user>\AppData\Local\Programs\langtool`, Desktop, or USB).
3. Double-click `langtool.exe`.
4. The app starts cleanly into the system tray and main workspace with **no CMD window**.

---

## 🤖 Automated CI/CD via GitHub Actions

The workflow is defined in [`.github/workflows/release.yml`](file:///c:/Users/lenovo/Desktop/Projects/antigravity/langtool-win/.github/workflows/release.yml).

### Automatic Trigger (Git Tag)
Pushing a version tag automatically triggers the build and publishes a GitHub Release:

```bash
git tag v0.1.0
git push origin v0.1.0
```

### Manual Trigger
You can also trigger a release manually anytime from GitHub:
1. Navigate to your repository on GitHub.
2. Go to **Actions** → **Release Windows Desktop**.
3. Click **Run workflow** and optionally specify a release tag name.

### Workflow Steps:
1. Sets up `windows-latest` runner.
2. Configures Node.js 20 and Python 3.12 with dependency caching.
3. Installs dependencies via `npm ci` and `pip install -r requirements.txt`.
4. Executes `python scripts/build_release.py`.
5. Publishes a new GitHub Release with automated changelogs and attaches:
   - `langtool-v*-windows-x64-portable.zip`
   - `checksums.txt`
