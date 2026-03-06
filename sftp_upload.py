#!/usr/bin/env python3
"""
Deploy static Vite build (dist/) to web hosting via SFTP.
Cleans old web files before uploading fresh build.
"""

import os
import sys
import paramiko
import stat as stat_mod

HOST = "ssh.cw7emdng8.service.one"
PORT = 22
USER = "cw7emdng8_ssh"
PASSWORD = "Spitfire1337"
LOCAL_DIR = "./dist"
REMOTE_DIR = "."

# Files/dirs to preserve on the server (never delete these)
KEEP = {"webroots", ".ssh", ".bash_history", "api", "aiarne.png", "aiarne2.png"}

# Extensions/names that indicate old build artifacts to clean
CLEAN_PATTERNS = {"assets", "_next", "out", ".htaccess",
                  "index.html", "projects.html", "about.html",
                  "contact.html", "ai-blog.html", "404.html",
                  "config.json", "favicon.ico"}


def remote_remove(sftp: paramiko.SFTPClient, path: str):
    """Recursively remove a remote file or directory."""
    try:
        st = sftp.lstat(path)
        if stat_mod.S_ISDIR(st.st_mode):
            for entry in sftp.listdir(path):
                remote_remove(sftp, f"{path}/{entry}")
            sftp.rmdir(path)
        else:
            sftp.remove(path)
    except Exception:
        pass


def clean_remote(sftp: paramiko.SFTPClient):
    """Remove old build artifacts from web root."""
    print("Cleaning old files...")
    for entry in sftp.listdir(REMOTE_DIR):
        if entry in KEEP or entry.startswith("."):
            continue
        if entry in CLEAN_PATTERNS or entry.startswith("__next"):
            remote_remove(sftp, f"{REMOTE_DIR}/{entry}")
            print(f"  🗑  removed {entry}")


def ensure_remote_dir(sftp: paramiko.SFTPClient, path: str):
    try:
        sftp.stat(path)
    except FileNotFoundError:
        sftp.mkdir(path)


def upload_dir(sftp: paramiko.SFTPClient, local_path: str, remote_path: str):
    ensure_remote_dir(sftp, remote_path)
    for entry in sorted(os.listdir(local_path)):
        local_entry = os.path.join(local_path, entry)
        remote_entry = f"{remote_path.rstrip('/')}/{entry}"
        if os.path.isdir(local_entry):
            upload_dir(sftp, local_entry, remote_entry)
        else:
            sftp.put(local_entry, remote_entry)
            print(f"  ✓ {remote_entry}")


def main():
    if not os.path.isdir(LOCAL_DIR):
        print(f"❌ '{LOCAL_DIR}' not found. Run 'npm run build' first.")
        sys.exit(1)

    print(f"Connecting to {HOST}...")
    transport = paramiko.Transport((HOST, PORT))
    transport.connect(username=USER, password=PASSWORD)
    sftp = paramiko.SFTPClient.from_transport(transport)

    clean_remote(sftp)
    print(f"\nUploading '{LOCAL_DIR}' → web root ...\n")
    upload_dir(sftp, LOCAL_DIR, REMOTE_DIR)

    sftp.close()
    transport.close()
    print("\n✅ Upload complete!")


if __name__ == "__main__":
    main()
