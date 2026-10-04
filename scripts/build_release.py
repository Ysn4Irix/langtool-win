#!/usr/bin/env python3
"""
Production Release Packaging Script for langtool Windows
Builds frontend, compiles PyInstaller standalone bundle, creates a portable ZIP,
and calculates SHA256 checksums.
"""

import os
import sys
import shutil
import zipfile
import hashlib
import subprocess
import json

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST_APP_DIR = os.path.join(ROOT_DIR, "dist-app")
BUILD_DIR = os.path.join(ROOT_DIR, "build")
SPEC_FILE = os.path.join(ROOT_DIR, "langtool.spec")

def get_app_version():
    pkg_json = os.path.join(ROOT_DIR, "package.json")
    if os.path.exists(pkg_json):
        try:
            with open(pkg_json, "r", encoding="utf-8") as f:
                data = json.load(f)
                return data.get("version", "0.1.0")
        except Exception:
            pass
    return "0.1.0"

def calculate_sha256(filepath):
    sha = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(65536):
            sha.update(chunk)
    return sha.hexdigest()

def clean_build_artifacts():
    print("[1/5] Cleaning old build artifacts...")
    for folder in [DIST_APP_DIR, BUILD_DIR]:
        if os.path.exists(folder):
            print(f"  Removing {os.path.basename(folder)}/...")
            shutil.rmtree(folder, ignore_errors=True)

def build_frontend():
    print("\n[2/5] Building frontend (Vite + Tailwind)...")
    npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"
    cmd = [npm_cmd, "run", "build"]
    ret = subprocess.run(cmd, cwd=ROOT_DIR)
    if ret.returncode != 0:
        print("ERROR: Frontend build failed!")
        sys.exit(1)

def run_pyinstaller():
    print("\n[3/5] Running PyInstaller standalone packaging...")
    cmd = [
        sys.executable,
        "-m",
        "PyInstaller",
        "--distpath",
        DIST_APP_DIR,
        "--workpath",
        BUILD_DIR,
        "--noconfirm",
        "--clean",
        SPEC_FILE,
    ]
    ret = subprocess.run(cmd, cwd=ROOT_DIR)
    if ret.returncode != 0:
        print("ERROR: PyInstaller compilation failed!")
        sys.exit(1)

def create_portable_zip(version):
    print("\n[4/5] Creating portable distribution ZIP...")
    source_dir = os.path.join(DIST_APP_DIR, "langtool")
    if not os.path.exists(source_dir):
        print(f"ERROR: Build folder {source_dir} does not exist!")
        sys.exit(1)

    zip_filename = f"langtool-v{version}-windows-x64-portable.zip"
    zip_path = os.path.join(DIST_APP_DIR, zip_filename)

    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for root, _, files in os.walk(source_dir):
            for file in files:
                abs_path = os.path.join(root, file)
                rel_path = os.path.relpath(abs_path, DIST_APP_DIR)
                zf.write(abs_path, rel_path)

    zip_size_mb = os.path.getsize(zip_path) / (1024 * 1024)
    print(f"  Created: {zip_filename} ({zip_size_mb:.2f} MB)")
    return zip_path, zip_filename

def generate_checksums(zip_path, zip_filename):
    print("\n[5/5] Generating SHA256 checksums...")
    checksum = calculate_sha256(zip_path)
    checksum_file = os.path.join(DIST_APP_DIR, "checksums.txt")
    with open(checksum_file, "w", encoding="utf-8") as f:
        f.write(f"{checksum}  {zip_filename}\n")
    print(f"  SHA256: {checksum}")
    print(f"  Saved to: {checksum_file}")

def main():
    version = get_app_version()
    print("=" * 60)
    print(f"  langtool Production Release Builder (v{version})")
    print("=" * 60)

    clean_build_artifacts()
    build_frontend()
    run_pyinstaller()
    zip_path, zip_filename = create_portable_zip(version)
    generate_checksums(zip_path, zip_filename)

    print("\n" + "=" * 60)
    print("  Release build finished successfully!")
    print(f"  Executable: dist-app/langtool/langtool.exe")
    print(f"  Portable ZIP: dist-app/{zip_filename}")
    print("=" * 60)

if __name__ == "__main__":
    main()
