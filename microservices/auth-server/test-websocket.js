const WebSocket = require('ws');

async function testWebSocket() {
    console.log('Testing WebSocket connection to ws://localhost:3303');

    const ws = new WebSocket('ws://localhost:3303');

    return new Promise((resolve, reject) => {
        ws.on('open', () => {
            console.log('✓ WebSocket connected');

            // Test authentication
            console.log('Sending authentication message...');
            ws.send(JSON.stringify({
                type: 'auth',
                userName: 'testuser',
                secret: 'test123'
            }));
        });

        ws.on('message', (data) => {
            const message = JSON.parse(data.toString());
            console.log('Received message:', message);

            if (message.type === 'authenticated') {
                console.log('✓ Authentication successful');

                // Test subscription
                console.log('Testing subscription...');
                ws.send(JSON.stringify({
                    type: 'subscribe',
                    path: 'inventory/testuser',
                    event: 'child_added',
                    listenerId: 'test-listener-123'
                }));
            } else if (message.type === 'subscribed') {
                console.log('✓ Subscription successful');
                console.log(`  - Path: ${message.path}`);
                console.log(`  - Event: ${message.event}`);

                // Test unsubscribe
                console.log('Testing unsubscribe...');
                ws.send(JSON.stringify({
                    type: 'unsubscribe',
                    listenerId: 'test-listener-123'
                }));
            } else if (message.type === 'unsubscribed') {
                console.log('✓ Unsubscribe successful');

                // Test ping
                console.log('Testing ping...');
                ws.send(JSON.stringify({
                    type: 'ping'
                }));
            } else if (message.type === 'pong') {
                console.log('✓ Ping/pong successful');

                // All tests passed
                console.log('\n✅ All WebSocket tests passed!');
                ws.close();
                resolve();
            }
        });

        ws.on('error', (error) => {
            console.error('✗ WebSocket error:', error);
            reject(error);
        });

        ws.on('close', () => {
            console.log('WebSocket closed');
        });

        // Timeout after 5 seconds
        setTimeout(() => {
            console.error('✗ Test timeout');
            ws.close();
            reject(new Error('Test timeout'));
        }, 5000);
    });
}

// Run test
testWebSocket()
    .then(() => {
        console.log('Tests completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Tests failed:', error);
        process.exit(1);
    });