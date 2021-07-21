
echo "bye" | sftp -oHostKeyAlgorithms=+ssh-dss -b - sshacs@dxresources.ssh.upload.akamai.com:/prod/alloy

