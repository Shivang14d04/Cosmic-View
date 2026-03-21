#!/bin/bash

set -e

echo "Updating system..."
sudo apt update -y

echo "Installing Java 21..."
sudo apt install -y fontconfig openjdk-21-jre

java -version

echo "Installing Jenkins..."
sudo mkdir -p /etc/apt/keyrings

sudo wget -O /etc/apt/keyrings/jenkins-keyring.asc \
  https://pkg.jenkins.io/debian-stable/jenkins.io-2026.key

echo "deb [signed-by=/etc/apt/keyrings/jenkins-keyring.asc] \
https://pkg.jenkins.io/debian-stable binary/" | \
sudo tee /etc/apt/sources.list.d/jenkins.list > /dev/null

sudo apt update -y
sudo apt install -y jenkins

echo "Installing Docker..."
sudo apt install -y docker.io

sudo systemctl start docker
sudo systemctl enable docker

echo "Adding users to docker group..."
sudo usermod -aG docker ubuntu
sudo usermod -aG docker jenkins

echo "Updating system..."
sudo apt update -y

echo "Installing required packages..."
sudo apt install -y unzip curl

# -----------------------------
# Install AWS CLI v2
# -----------------------------
echo "Downloading AWS CLI v2..."
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"

echo "Unzipping AWS CLI..."
unzip -o awscliv2.zip

echo "Installing AWS CLI..."
sudo ./aws/install

echo "Verifying AWS CLI..."
aws --version

# -----------------------------
# Install kubectl
# -----------------------------
echo "Downloading kubectl..."
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"

echo "Installing kubectl..."
chmod +x kubectl
sudo mv kubectl /usr/local/bin/

echo "Verifying kubectl..."
kubectl version --client

# -----------------------------
# Cleanup
# -----------------------------
echo "Cleaning up..."
rm -rf aws awscliv2.zip kubectl

echo "Jenkins setup complete!"
echo "Get password for jenkins using:"
echo "sudo cat /var/lib/jenkins/secrets/initialAdminPassword"