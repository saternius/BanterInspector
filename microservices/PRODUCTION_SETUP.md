# Production Setup Documentation

## Overview
All services have been successfully deployed to production on tippy.dev domain with HTTPS/SSL encryption.

## Live Services

### 1. App Service (File Server)
- **URL**: https://app.tippy.dev
- **Port**: 9909 (internal)
- **Service**: tippy-fileserver.service
- **Description**: Main application file server with GLB storage capabilities
- **Features**:
  - GLB file upload/download (max 20MB)
  - Firebase integration for metadata storage
  - CORS enabled for cross-origin requests

### 2. Auth Service
- **URL**: https://auth.tippy.dev
- **Port**: 3303 (internal)
- **Service**: tippy-auth.service
- **Description**: Firebase authentication service
- **Endpoints**:
  - `/test` - Health check
  - `/setclaims` - Set custom user claims

### 3. Refine Service (Statement Block Service)
- **URL**: https://refine.tippy.dev
- **Port**: 5000 (internal)
- **Service**: tippy-refine.service
- **Description**: AI-powered text processing service using Gemini
- **Endpoints**:
  - `/health` - Service health check
  - `/process-text` - Process unstructured text into statement blocks

## Infrastructure Details

### Server
- **IP Address**: 34.123.64.240
- **Platform**: Google Cloud VM Instance
- **OS**: Debian Linux

### DNS Configuration (SquareSpace)
```
A Record: app → 34.123.64.240
A Record: auth → 34.123.64.240
A Record: refine → 34.123.64.240
```

### SSL Certificates
- **Provider**: Let's Encrypt
- **Auto-renewal**: Enabled via certbot.timer
- **Expiry**: February 1, 2026
- **Certificate Locations**:
  - `/etc/letsencrypt/live/app.tippy.dev/`
  - `/etc/letsencrypt/live/auth.tippy.dev/`
  - `/etc/letsencrypt/live/refine.tippy.dev/`

### Nginx Configuration
- **Config Files**:
  - `/etc/nginx/sites-available/app.tippy.dev`
  - `/etc/nginx/sites-available/auth.tippy.dev`
  - `/etc/nginx/sites-available/refine.tippy.dev`
- All sites have HTTPS redirect enabled

### Systemd Services
All services are configured to:
- Auto-start on system boot
- Auto-restart on failure
- Log to `/var/log/tippy-*.log`

## Service Management Commands

### Check Service Status
```bash
sudo systemctl status tippy-auth tippy-fileserver tippy-refine
```

### Restart Services
```bash
sudo systemctl restart tippy-auth
sudo systemctl restart tippy-fileserver
sudo systemctl restart tippy-refine
```

### View Logs
```bash
# Auth service
sudo journalctl -u tippy-auth -f
tail -f /var/log/tippy-auth.log

# File server
sudo journalctl -u tippy-fileserver -f
tail -f /var/log/tippy-fileserver.log

# Refine service
sudo journalctl -u tippy-refine -f
tail -f /var/log/tippy-refine.log
```

### Nginx Management
```bash
# Test configuration
sudo nginx -t

# Reload configuration
sudo systemctl reload nginx

# Check Nginx logs
tail -f /var/log/nginx/app.tippy.dev.access.log
tail -f /var/log/nginx/auth.tippy.dev.access.log
tail -f /var/log/nginx/refine.tippy.dev.access.log
```

## Security Notes

1. **Firewall**: UFW is configured with necessary ports open
2. **HTTPS**: All services use SSL/TLS encryption
3. **Service Isolation**: Each service runs under the 'jason' user
4. **Rate Limiting**: Refine service has built-in rate limiting
5. **CORS**: Configured at Nginx level for proper cross-origin handling

## Monitoring

### Health Check Endpoints
```bash
# App service
curl https://app.tippy.dev/something-for-the-time

# Auth service
curl https://auth.tippy.dev/test

# Refine service
curl https://refine.tippy.dev/health
```

## Backup Recommendations

1. **Database**: Regularly backup Firebase data
2. **GLB Files**: Backup `/home/jason/BanterInspector/microservices/file-server/assets/glbs/`
3. **Configuration**: Keep copies of Nginx configs and systemd service files
4. **SSL Certificates**: Let's Encrypt handles this automatically

## Future Improvements

1. Consider implementing a CDN for static assets
2. Add monitoring/alerting (e.g., Prometheus, Grafana)
3. Implement log rotation for service logs
4. Consider containerization with Docker for easier deployment
5. Add health check monitoring with automatic alerts

## Troubleshooting

### Service Won't Start
1. Check logs: `sudo journalctl -u [service-name] -n 50`
2. Verify Python venv: Services use `/home/jason/BanterInspector/microservices/venv/`
3. Check port availability: `sudo netstat -tlnp | grep [port]`

### SSL Issues
1. Test renewal: `sudo certbot renew --dry-run`
2. Force renewal: `sudo certbot renew --force-renewal`

### Nginx Issues
1. Test config: `sudo nginx -t`
2. Check error log: `tail -f /var/log/nginx/error.log`

---
*Setup completed: November 3, 2025*