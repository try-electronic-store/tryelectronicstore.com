// netlify/functions/listener-log.js
const { getStore } = require('@netlify/blobs');

const appliances = [
    'Microwave', 'Blender', 'Toaster', 'Coffee Machine', 'Dishwasher', 'Vacuum Cleaner',
    'Rice Cooker', 'Air Fryer', 'Food Processor', 'Electric Kettle', 'Washing Machine',
    'Dryer', 'Refrigerator', 'Oven', 'Stand Mixer', 'Juicer', 'Slow Cooker', 
    'Pressure Cooker', 'Electric Grill', 'Bread Machine', 'Ice Maker', 'Garbage Disposal',
    'Electric Can Opener', 'Dehydrator', 'Waffle Iron', 'Electric Skillet', 'Hot Plate',
    'Electric Griddle', 'Pasta Machine', 'Yogurt Maker', 'Popcorn Maker', 'Electric Wok'
];

const locations = [
    'Tokyo', 'Brooklyn', 'Berlin', 'Portland', 'Montreal', 'Austin', 'Melbourne',
    'Amsterdam', 'San Francisco', 'London', 'Barcelona', 'Seattle', 'Copenhagen',
    'Tel Aviv', 'Stockholm', 'Prague', 'Vancouver', 'Toronto', 'Los Angeles',
    'Chicago', 'Detroit', 'Philadelphia', 'Miami', 'Denver', 'Minneapolis',
    'Nashville', 'Atlanta', 'Phoenix', 'San Diego', 'Boston', 'Pittsburgh',
    'New Orleans', 'Manchester', 'Edinburgh', 'Dublin', 'Oslo', 'Helsinki',
    'Reykjavik', 'Vienna', 'Zurich', 'Geneva', 'Milan', 'Rome', 'Florence',
    'Venice', 'Madrid', 'Lisbon', 'Porto', 'Paris', 'Lyon', 'Nice', 'Brussels'
];

function getRandomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    const store = getStore('listener-log');

    try {
        if (event.httpMethod === 'GET') {
            // Get current log entries
            let logData = await store.get('entries', { type: 'json' });
            
            if (!logData) {
                // Initialize with sample data
                logData = [
                    { name: 'Microwave', location: 'Tokyo', timestamp: Date.now() - 300000 },
                    { name: 'Blender', location: 'Brooklyn', timestamp: Date.now() - 240000 },
                    { name: 'Toaster', location: 'Berlin', timestamp: Date.now() - 180000 },
                    { name: 'Coffee Machine', location: 'Portland', timestamp: Date.now() - 120000 }
                ];
                await store.set('entries', logData);
            }

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ entries: logData })
            };

        } else if (event.httpMethod === 'POST') {
            // Add new log entry
            const body = JSON.parse(event.body);
            const { customName, customLocation, email } = body;

            let name, location;

            // Validate email if custom data is provided
            if ((customName || customLocation) && (!email || !isValidEmail(email))) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ 
                        error: 'Valid email required for custom name/location' 
                    })
                };
            }

            // Use custom or random values
            name = (email && customName) ? customName : getRandomElement(appliances);
            location = (email && customLocation) ? customLocation : getRandomElement(locations);

            // Get current entries
            let logData = await store.get('entries', { type: 'json' }) || [];

            // Add new entry at the beginning
            const newEntry = {
                name,
                location,
                timestamp: Date.now()
            };
            logData.unshift(newEntry);

            // Keep only last 100 entries
            if (logData.length > 100) {
                logData = logData.slice(0, 100);
            }

            // Save updated entries
            await store.set('entries', logData);

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ 
                    success: true, 
                    entry: newEntry,
                    entries: logData 
                })
            };
        }

    } catch (error) {
        console.error('Function error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }

    return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: 'Method not allowed' })
    };
};
