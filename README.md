# 🚀 Destygo Chat Load Testing Suite

A comprehensive load testing suite for Destygo Chat applications, designed to simulate multiple virtual users and measure performance under various load conditions.

## 🎯 Test Types

### 1. Message Load Test (`send-messages-test.js`)
Simulates virtual users sending messages simultaneously to test message processing capacity.

**Key Features:**
- 1 virtual user = 1 session = 1 conversation = 1 message
- Messages sent simultaneously over exactly 1 second
- Measures message processing performance
- Configurable number of users and custom messages

### 2. Connection Load Test (`connection-load-test.js`) ⭐ NEW
Tests the URL's capacity to handle concurrent connections without sending messages.

**Key Features:**
- Establishes concurrent browser connections
- Maintains connections for a specified duration
- Measures connection capacity (connections/second)
- No message sending - pure connection stress test

### 3. Access Test (`test-puppeteer-access.js`)
Simple connectivity test to verify Puppeteer can access the target URL.

### 4. Web Interface (`server.js` + `index.html`) ⭐ NEW
Modern web interface for running tests through a browser with real-time logs and statistics.

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- npm or yarn
- Chrome/Chromium browser

### Installation
```bash
# Clone and setup
git clone <repository>
cd destygo-chat-performance-test
npm install

# Configure environment (Interactive setup)
npm run setup
```

### Basic Usage

#### Message Load Tests
```bash
# Quick test (5 users)
npm run test:quick

# Medium test (20 users)
npm run test:medium

# Large test (40 users)
npm run test:large

# Custom test (uses .env variables)
npm run test
```

#### Connection Load Tests ⭐ NEW
```bash
# Quick connection test (10 users, 30 seconds)
npm run test:connection:quick

# Medium connection test (50 users, 60 seconds)
npm run test:connection:medium

# Large connection test (100 users, 120 seconds)
npm run test:connection:large

# Custom connection test (uses .env variables)
npm run test:connection
```

#### Web Interface ⭐ NEW
```bash
# Start web interface
npm start
# or
npm run web

# Access at http://localhost:3000
```

#### Other Tests
```bash
# Test Puppeteer access
npm run test:access

# Development mode with auto-restart
npm run test:dev

# Interactive environment setup
npm run setup
```

### Using the Shell Script
```bash
# Make executable
chmod +x start-performance-test.sh

# Interactive setup
./start-performance-test.sh setup

# Run tests
./start-performance-test.sh quick
./start-performance-test.sh connection:medium
./start-performance-test.sh custom
```

### 🐳 Using Docker
```bash
# Quick start with Docker
docker-compose --profile quick up --build

# Connection test with Docker
docker-compose --profile connection-quick up --build

# Web interface with Docker
docker-compose up --build

# Custom test with environment variables
DESTYGO_TEST_URL="your-url" docker-compose up --build
```

## 📁 Project Structure

```
destygo-chat-performance-test/
├── send-messages-test.js          # Main message load test
├── connection-load-test.js        # Connection load test
├── test-puppeteer-access.js       # Connectivity check
├── server.js                      # Web interface server
├── index.html                     # Web interface UI
├── setup-env.js                   # Interactive environment setup
├── start-performance-test.sh      # Shell script launcher
├── docker-compose.yml             # Docker services configuration
├── Dockerfile                     # Docker image definition
├── env.example                    # Configuration template
├── package.json                   # Dependencies and scripts
├── WEB_INTERFACE.md              # Web interface documentation
├── DOCUMENTATION_TECHNIQUE.md    # Technical documentation
└── README.md                     # This file
```

## ⚙️ Configuration

### Interactive Setup (Recommended)

The easiest way to configure your environment is using the interactive setup:

```bash
npm run setup
```

This will guide you through:
- **Target URL** - Your Destygo Chat application URL
- **Virtual Users** - Number of users to simulate (1-1000)
- **Test Duration** - How long to run connection tests (10-3600s)
- **Custom Message** - Optional custom message template
- **Advanced Settings** - Timeouts and other options

Example interactive session:
```
================================
  Destygo Chat Load Test - Environment Setup
================================
[INFO] Welcome! Let's configure your load testing environment.

Enter your target application URL (default: http://iris-staging.in.viasay.io/widget/preview/production/index.html?environment=default&token=835fead4-8114-d280-d7f5-eb4970fa4b0f): http://my-app.com/widget
Enter number of virtual users (1-1000) (default: 40): 25
Enter test duration in seconds (10-3600) (default: 60): 120
Enter custom message template (optional, press Enter to skip): Hello from ${USER} at ${TIME}

[INFO] Advanced Configuration (optional):
Enter navigation timeout in milliseconds (5000-120000) (default: 30000): 45000
Enter DestygoChat wait timeout in milliseconds (5000-60000) (default: 15000): 20000

================================
  Configuration Summary
================================
Target URL: http://my-app.com/widget
Virtual Users: 25
Test Duration: 120 seconds
Custom Message: Hello from ${USER} at ${TIME}
Navigation Timeout: 45000ms
Chat Timeout: 20000ms

Do you want to save this configuration? (y/N) (default: y): y
[INFO] Configuration saved to .env file!
```

### Manual Configuration

Alternatively, you can manually edit the `.env` file:

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DESTYGO_TEST_URL` | Target application URL | - | ✅ |
| `DESTYGO_NUMBER_OF_USERS` | Number of virtual users | 40 | ✅ |
| `DESTYGO_TEST_DURATION` | Test duration in seconds (connection test) | 60 | ❌ |
| `DESTYGO_TEST_MESSAGE` | Custom message template | Auto-generated | ❌ |
| `DESTYGO_NAVIGATION_TIMEOUT` | Browser navigation timeout (ms) | 30000 | ❌ |
| `DESTYGO_CHAT_TIMEOUT` | Chat widget wait timeout (ms) | 15000 | ❌ |

### Message Template Variables
- `${USER}` - User identifier (User_01, User_02, etc.)
- `${TESTID}` - Unique test identifier
- `${TIME}` - Current timestamp

### Example Configuration
```bash
# .env file
DESTYGO_TEST_URL=http://your-app.com/widget?token=abc123
DESTYGO_NUMBER_OF_USERS=40
DESTYGO_TEST_DURATION=60
DESTYGO_TEST_MESSAGE=Hello from ${USER} at ${TIME}
DESTYGO_NAVIGATION_TIMEOUT=45000
DESTYGO_CHAT_TIMEOUT=20000
```

## 🌐 Web Interface

The project includes a modern web interface for running tests through a browser:

### Features
- **Modern UI** with responsive design
- **Real-time logs** with syntax highlighting
- **Visual statistics** and results
- **Test management** (start/stop)
- **Parameter validation**
- **Log export** functionality

### Usage
```bash
# Start the web interface
npm start

# Access at http://localhost:3000
```

See [WEB_INTERFACE.md](WEB_INTERFACE.md) for complete web interface documentation.

## 📊 Test Results

### Message Load Test Output
```
📊 ==================== TEST REPORT ==================== 📊
📈 Total messages attempted: 40
✅ Success: 40
❌ Errors: 0
⏱️ Total duration: 15.23 seconds
🚀 Message send duration: 1.00 seconds
📊 Success rate: 100.00%
🎉 Test completed
```

### Connection Load Test Output ⭐ NEW
```
📊 ==================== CONNECTION LOAD TEST REPORT ==================== 📊
📈 Total connections attempted: 50
✅ Successful connections: 48
❌ Failed connections: 2
⏱️ Total test duration: 65.45 seconds
🚀 Connections per second: 0.73
📊 Connection success rate: 96.00%
🎯 URL capacity: 0.73 connections/second
🎉 Connection load test completed
```

## 🔧 Advanced Usage

### Custom Test Parameters
```bash
# Custom message test
DESTYGO_NUMBER_OF_USERS=25 DESTYGO_TEST_URL="your-url" npm run test

# Custom connection test
DESTYGO_NUMBER_OF_USERS=75 DESTYGO_TEST_DURATION=90 npm run test:connection
```

### Development Mode
```bash
# Auto-restart on file changes
npm run test:dev
```

### Docker Commands
```bash
# Build Docker image
npm run docker:build

# Run quick test with Docker
npm run docker:quick

# Run connection test with Docker
npm run docker:connection:quick

# Run custom test with Docker
npm run docker:custom
```

## 📈 Performance Metrics

### Message Load Test Metrics
- **Total Duration**: Complete test execution time
- **Message Send Duration**: Time to send all messages (target: 1.00s)
- **Success Rate**: Percentage of successful message sends
- **Messages/Second**: Throughput measurement

### Connection Load Test Metrics ⭐ NEW
- **Connections/Second**: URL connection capacity
- **Connection Success Rate**: Percentage of successful connections
- **Total Test Duration**: Complete test execution time
- **URL Capacity**: Maximum connections the URL can handle per second

## 🐳 Docker Support

The load testing suite is fully containerized for consistent, isolated environments.

### Available Docker Services
- `viasay-chat-test` - Web interface service
- `quick-test` - Quick message test (5 users)
- `connection-quick-test` - Quick connection test (10 users, 30s)
- `connection-medium-test` - Medium connection test (50 users, 60s)
- `connection-large-test` - Large connection test (100 users, 120s)
- `access-test` - Connectivity check
- `custom-test` - Custom test with environment variables

### Docker Benefits
- ✅ **Consistent Environment** - Same setup across all machines
- ✅ **Isolation** - No conflicts with local dependencies
- ✅ **Portability** - Run anywhere Docker is available
- ✅ **CI/CD Ready** - Perfect for automated testing

## 🛠️ Troubleshooting

### Common Issues
1. **Puppeteer timeout**: Increase `DESTYGO_NAVIGATION_TIMEOUT`
2. **Connection failures**: Check network connectivity and URL accessibility
3. **Memory issues**: Reduce `DESTYGO_NUMBER_OF_USERS`
4. **Browser crashes**: Ensure Chrome/Chromium is installed

### Debug Mode
```bash
# Enable detailed logging
DEBUG_MODE=true npm run test

# Test Puppeteer connectivity first
npm run test:access
```

## 📚 Documentation

- [Web Interface Guide](WEB_INTERFACE.md) - Complete web interface documentation
- [Technical Documentation](DOCUMENTATION_TECHNIQUE.md) - Technical implementation details
- [Environment Configuration](env.example) - Complete configuration reference

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🎯 Use Cases

- **Performance Validation:** Ensure system can handle target load
- **Capacity Planning:** Determine maximum concurrent users
- **Regression Testing:** Validate performance after deployments
- **Stress Testing:** Identify breaking points under load

## 🔍 Troubleshooting

### Common Issues

1. **SSL/HTTPS Errors:** Ensure URL protocol matches (HTTP vs HTTPS)
2. **Timeout Errors:** Check network connectivity and target URL
3. **Memory Issues:** Reduce number of virtual users
4. **Browser Crashes:** Update Puppeteer or reduce concurrency

### Debug Mode

```bash
# Test Puppeteer connectivity first
npm run test:access
```

## 📊 Performance Benchmarks

Based on recent tests:
- **40 VUs:** 42.59 msg/s (106.47% of target)
- **Success Rate:** 100%
- **Memory Usage:** ~200MB total
- **Execution Time:** ~10 seconds

---

**Ready to test your Destygo Chat performance?** Run `npm start` to use the web interface or `npm run test` for command line testing!
