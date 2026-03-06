#!/usr/bin/env python3
import pexpect
import sys

HOST = "ssh.cw7emdng8.service.one"
USER = "cw7emdng8_ssh"
PASSWORD = "Spitfire1337"
PORT = "22"

child = pexpect.spawn(f'sftp -o StrictHostKeyChecking=no -P {PORT} {USER}@{HOST}',
                      encoding='utf-8', timeout=60)
child.logfile = sys.stdout

child.expect(['[Pp]assword:', pexpect.EOF, pexpect.TIMEOUT])
child.sendline(PASSWORD)
child.expect('sftp>')

# List directories
child.sendline('pwd')
child.expect('sftp>')

child.sendline('ls -la')
child.expect('sftp>')

child.sendline('bye')
child.expect(pexpect.EOF)
