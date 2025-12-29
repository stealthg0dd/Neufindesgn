#!/bin/bash

# Neufin Deployment Script
# This script automates the deployment process

set -e

echo "🚀 Neufin Deployment Script"
echo "=================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo -e "${RED}❌ .env.production not found${NC}"
    echo "Please create .env.production with your configuration"
    echo "You can use .env.example as a template"
    exit 1
fi

if [ ! -f "backend/.env.production" ] && [ ! -f "backend/.env" ]; then
    echo -e "${RED}❌ backend/.env not found${NC}"
    echo "Please create backend/.env with your configuration"
    echo "You can use backend/.env.example as a template"
    exit 1
fi

echo -e "${GREEN}✅ Environment files found${NC}"

# Determine deployment method
echo ""
echo "Choose deployment method:"
echo "1) Docker Compose (Recommended)"
echo "2) Manual (Systemd services)"
echo "3) Manual (PM2)"
read -p "Enter choice (1-3): " DEPLOY_METHOD

case $DEPLOY_METHOD in
    1)
        echo -e "${YELLOW}📦 Docker Compose Deployment${NC}"
        
        # Check if Docker is installed
        if ! command -v docker &> /dev/null; then
            echo -e "${RED}❌ Docker not found. Please install Docker first.${NC}"
            exit 1
        fi
        
        if ! command -v docker-compose &> /dev/null; then
            echo -e "${RED}❌ Docker Compose not found. Please install Docker Compose first.${NC}"
            exit 1
        fi
        
        echo "Building Docker images..."
        docker-compose build
        
        echo "Starting services..."
        docker-compose up -d
        
        echo "Waiting for services to be healthy..."
        sleep 10
        
        echo "Running database migrations..."
        docker-compose exec -T backend npm run migrate
        
        echo -e "${GREEN}✅ Deployment complete!${NC}"
        echo ""
        echo "Services running:"
        docker-compose ps
        echo ""
        echo "Test endpoints:"
        echo "  Frontend: http://localhost:3000"
        echo "  Backend: http://localhost:3001/health"
        ;;
        
    2)
        echo -e "${YELLOW}🔧 Systemd Service Deployment${NC}"
        
        # Check if running as root
        if [ "$EUID" -ne 0 ]; then
            echo -e "${RED}❌ Systemd deployment requires sudo${NC}"
            exit 1
        fi
        
        DEPLOY_DIR="/opt/neufin"
        
        echo "Creating deployment directory at $DEPLOY_DIR..."
        mkdir -p $DEPLOY_DIR/backend
        
        echo "Installing dependencies..."
        cd backend
        npm ci --only=production
        npm run build
        cp .env /opt/neufin/backend/ || cp backend/.env.production /opt/neufin/backend/.env
        cd ..
        
        echo "Building frontend..."
        npm ci --only=production
        npm run build:prod
        
        echo "Copying files..."
        cp -r dist $DEPLOY_DIR/
        cp -r backend/dist $DEPLOY_DIR/backend/
        cp -r backend/migrations $DEPLOY_DIR/backend/
        cp -r backend/node_modules $DEPLOY_DIR/backend/
        
        echo "Installing systemd services..."
        cp neufin-backend.service /etc/systemd/system/
        cp neufin-frontend.service /etc/systemd/system/
        systemctl daemon-reload
        
        echo "Starting services..."
        systemctl enable neufin-backend neufin-frontend
        systemctl start neufin-backend neufin-frontend
        
        echo "Running database migrations..."
        systemctl start neufin-backend
        sleep 5
        systemctl stop neufin-backend
        cd $DEPLOY_DIR/backend
        npm run migrate
        cd -
        systemctl start neufin-backend
        
        echo -e "${GREEN}✅ Deployment complete!${NC}"
        echo ""
        echo "Service status:"
        systemctl status neufin-backend neufin-frontend --no-pager
        ;;
        
    3)
        echo -e "${YELLOW}📱 PM2 Deployment${NC}"
        
        # Check if PM2 is installed
        if ! command -v pm2 &> /dev/null; then
            echo "Installing PM2..."
            npm install -g pm2
        fi
        
        echo "Installing dependencies..."
        cd backend
        npm ci --only=production
        npm run build
        cd ..
        
        echo "Building frontend..."
        npm ci --only=production
        npm run build:prod
        
        echo "Starting services with PM2..."
        pm2 start backend/dist/server.js --name neufin-backend --env production
        pm2 start "serve -s dist -l 3000" --name neufin-frontend
        
        echo "Running database migrations..."
        cd backend
        npm run migrate
        cd ..
        
        echo "Saving PM2 configuration..."
        pm2 save
        pm2 startup
        
        echo -e "${GREEN}✅ Deployment complete!${NC}"
        echo ""
        echo "Process status:"
        pm2 list
        ;;
        
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}🎉 Neufin is deployed and running!${NC}"
echo ""
echo "Next steps:"
echo "1. Configure your reverse proxy (Nginx/Apache)"
echo "2. Set up SSL certificate"
echo "3. Update Supabase OAuth redirect URLs"
echo "4. Configure firewall rules"
echo "5. Set up monitoring and alerting"
echo ""
echo "See DEPLOYMENT.md for detailed instructions"
