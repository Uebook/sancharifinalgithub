#!/usr/bin/env bash
# ==============================================================================
# Sanchari Production Server Setup Script (Google Compute Engine)
# Sets up MongoDB, Redis, Node.js 20, PM2, Nginx, Backend API & Admin Panel
# ==============================================================================
set -e

echo "🚀 Starting Sanchari Production Setup on GCP VM..."

# 1. Update system packages
echo "📦 Updating packages..."
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl gnupg lsb-release ca-certificates git build-essential nginx redis-server

# 2. Setup 2GB Swap (prevents out-of-memory errors during build)
if [ ! -f /swapfile ]; then
    echo "💾 Creating 2GB swap file..."
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
fi

# 3. Install MongoDB 7.0
echo "🍃 Installing MongoDB..."
if ! command -v mongod &> /dev/null; then
    DISTRO_CODENAME=$(lsb_release -cs 2>/dev/null || echo "jammy")
    # For Ubuntu 24.04 (noble) or newer, fall back to jammy repo if noble repo is pending
    if [ "$DISTRO_CODENAME" = "noble" ]; then
        DISTRO_CODENAME="jammy"
    fi
    curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
       sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor --yes
    echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu ${DISTRO_CODENAME}/mongodb-org/7.0 multiverse" | \
       sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
    sudo apt update
    sudo apt install -y mongodb-org
fi

sudo systemctl enable --now mongod
sudo systemctl enable --now redis-server

# 4. Install Node.js 20 LTS & PM2
echo "🟢 Installing Node.js 20 LTS & PM2..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
fi
sudo npm install -g pm2

# 5. Prepare application directory
echo "📂 Setting up /var/www/sanchari..."
sudo mkdir -p /var/www/sanchari
sudo chown -R $USER:$USER /var/www/sanchari
cd /var/www/sanchari

if [ ! -d "repo" ]; then
    git clone https://github.com/Uebook/sancharifinalgithub.git repo
else
    cd repo && git pull && cd ..
fi

# 6. Configure Backend
echo "⚙️ Configuring sancharibackend..."
cd /var/www/sanchari/repo/sancharibackend
npm install --production

if [ ! -f .env ]; then
cat << 'EOF' > .env
PORT=5001
NODE_ENV=production
MONGO_URI=mongodb+srv://shubham_dubey:SO3t7fTGROvXNng2@cluster0.vakdouu.mongodb.net/?appName=Cluster0
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
JWT_SECRET=hybridride_secure_production_secret_2026
BASE_URL=https://api.sanchari.io
BYPASS_OTP=false

# SMS Gateway
SMS_API_KEY=372|TtJCM9AvQPzyW7eVgITm9sS2E4XXu42uIv3DDzlf87008799
SMS_BASE_URL=https://multichannel.buddyinfotech.in/api/v1/sms/sendMessage
SMS_SENDER_ID=SSGSPT
SMS_TEMPLATE_ID=23379

# WhatsApp
WHATSAPP_PHONE_ID=934236323117293
WHATSAPP_WABA_ID=1262892999101476
WHATSAPP_TEMPLATE_NAME=otp_login

# Razorpay
RAZORPAY_KEY_ID=rzp_test_SL458wxzG3ZY4b
RAZORPAY_KEY_SECRET=bUCdFj8lPRFqKyHGCYa3ldMP

# Mail
MAIL_MAILER=smtp
MAIL_HOST=smtp.hostinger.com
MAIL_PORT=465
MAIL_USERNAME=test.mail@argosmob.uk
MAIL_PASSWORD="Testmain@123"
MAIL_ENCRYPTION=ssl
MAIL_FROM_ADDRESS="test.mail@argosmob.uk"
EOF
fi

# Seed Super Admin
node seedAdmin.js || true

# Start / Restart with PM2
pm2 delete sanchari-backend 2>/dev/null || true
pm2 start server.js --name "sanchari-backend"
pm2 startup | tail -n 1 | sudo bash || true
pm2 save

# 7. Build Admin Panel
echo "💻 Building sanchariadmin..."
cd /var/www/sanchari/repo/sanchariadmin
echo "VITE_API_BASE_URL=https://api.sanchari.io" > .env.production
npm install
npm run build

# 8. Configure Nginx
echo "🌐 Configuring Nginx..."
sudo tee /etc/nginx/sites-available/sanchari.conf > /dev/null << 'EOF'
server {
    listen 80;
    server_name admin.sanchari.io;

    root /var/www/sanchari/repo/sanchariadmin/dist;
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }
}

server {
    listen 80;
    server_name api.sanchari.io;
    client_max_body_size 25M;

    location / {
        proxy_pass http://127.0.0.1:5001;
        proxy_http_version 1.1;

        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/sanchari.conf /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

# 9. SSL Certbot
sudo apt install -y certbot python3-certbot-nginx

echo ""
echo "=================================================================="
echo "🎉 Setup Complete!"
echo "Backend is running on PM2 (Port 5001)."
echo "Admin panel built in /var/www/sanchari/repo/sanchariadmin/dist."
echo "Nginx configured for api.sanchari.io and admin.sanchari.io."
echo ""
echo "To enable HTTPS/SSL, run:"
echo "sudo certbot --nginx -d api.sanchari.io -d admin.sanchari.io"
echo "=================================================================="
