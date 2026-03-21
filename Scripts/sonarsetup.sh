#!/bin/bash

set -e

echo "Updating system..."
sudo apt update -y

echo "Installing Docker..."
sudo apt install -y docker.io

sudo systemctl start docker
sudo systemctl enable docker

sudo usermod -aG docker ubuntu

echo "Setting kernel parameters for SonarQube..."
sudo sysctl -w vm.max_map_count=262144
sudo sysctl -w fs.file-max=65536

echo "vm.max_map_count=262144" | sudo tee -a /etc/sysctl.conf
echo "fs.file-max=65536" | sudo tee -a /etc/sysctl.conf

echo "Running SonarQube (internal only)..."
docker run -d \
  --name sonarqube \
  -p 127.0.0.1:9000:9000 \
  -v sonarqube_data:/opt/sonarqube/data \
  -v sonarqube_logs:/opt/sonarqube/logs \
  -v sonarqube_extensions:/opt/sonarqube/extensions \
  sonarqube:lts-community

docker update --restart=always sonarqube

echo "Installing Nginx..."
sudo apt install -y nginx

echo "Configuring Nginx..."
sudo rm -f /etc/nginx/sites-enabled/default

sudo tee /etc/nginx/sites-available/sonarqube > /dev/null <<EOF
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:9000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }
}
EOF

sudo ln -s /etc/nginx/sites-available/sonarqube /etc/nginx/sites-enabled/

sudo nginx -t
sudo systemctl restart nginx

echo "SonarQube setup complete!"
echo "Access SonarQube at: http://<EC2-PUBLIC-IP>"