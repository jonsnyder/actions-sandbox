echo "$CDN_PRIVATE_KEY" > id_rsa

echo "bye" | sftp -i ./id_rsa -oHostKeyAlgorithms=+ssh-dss -b - sshacs@dxresources.ssh.upload.akamai.com:/prod/alloy

