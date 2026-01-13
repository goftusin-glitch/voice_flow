# Troubleshooting: Network Removal Error

## Error You're Seeing

```
ERROR: error while removing network: network voiceflow_voice_flow_network has active endpoints
```

## Quick Fix - Use These Commands Instead

### Method 1: Force Stop All Containers First

```bash
# Stop all containers forcefully
docker stop $(docker ps -aq) 2>/dev/null || true

# Remove all stopped containers
docker rm $(docker ps -aq) 2>/dev/null || true

# Now try docker-compose down
docker-compose down

# If network still exists, remove it manually
docker network rm voiceflow_voice_flow_network 2>/dev/null || true

# Pull latest code
git pull origin master

# Rebuild and restart
docker-compose build frontend
docker-compose up -d
```

### Method 2: Use Docker Compose Stop First

```bash
# Stop containers using docker-compose
docker-compose stop

# Remove containers
docker-compose rm -f

# Remove the network manually
docker network rm voiceflow_voice_flow_network

# Pull latest code
git pull origin master

# Rebuild and restart
docker-compose build frontend
docker-compose up -d
```

### Method 3: Nuclear Option (If Above Don't Work)

```bash
# List all containers
docker ps -a

# Manually stop specific containers
docker stop voice_flow_frontend voice_flow_backend voice_flow_mysql

# Manually remove specific containers
docker rm voice_flow_frontend voice_flow_backend voice_flow_mysql

# Remove the network
docker network rm voiceflow_voice_flow_network

# Pull latest code
git pull origin master

# Rebuild and restart
docker-compose build frontend
docker-compose up -d
```

## Complete Update Process (Fixed)

Here's the corrected update process:

```bash
# Step 1: Navigate to project directory
cd /opt/voice_flow

# Step 2: Stop containers properly
docker-compose stop

# Step 3: Remove containers
docker-compose rm -f

# Step 4: Pull latest code
git pull origin master

# Step 5: Start with build (this will recreate network automatically)
docker-compose up -d --build

# Or if you want to build only frontend:
docker-compose build frontend
docker-compose up -d
```

## Verification Commands

After running the update:

```bash
# Check container status
docker-compose ps

# Check if network exists
docker network ls | grep voice_flow

# Check logs if needed
docker-compose logs -f frontend
```

## Why This Happened

The error occurs because:
1. `docker-compose down` tries to remove the network
2. But some containers are still attached to it
3. Docker won't remove a network with active endpoints

The solution is to stop containers BEFORE trying to remove the network, or just use `docker-compose up -d --build` which handles everything automatically.

## Best Practice Command for Updates

For future updates, use this single command sequence:

```bash
cd /opt/voice_flow && \
git pull origin master && \
docker-compose stop && \
docker-compose rm -f && \
docker-compose up -d --build
```

Or even simpler:

```bash
cd /opt/voice_flow && \
git pull origin master && \
docker-compose up -d --build
```

The `--build` flag will rebuild changed containers and `docker-compose up -d` will handle stopping/restarting automatically.
