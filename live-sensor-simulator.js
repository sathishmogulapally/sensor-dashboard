const axios = require('axios');

// Function to generate random float within range
const getRandomFloat = (min, max, decimals = 1) => {
    return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
};

// Function to send fake data
const sendFakeSensorData = async () => {
    const data = {
        temperature: getRandomFloat(24, 30),
        humidity: getRandomFloat(40, 70),
        air_quality: getRandomFloat(80, 150, 0)
    };

    try {
        const response = await axios.post('http://localhost:3000/api/data', data);
        console.log(`✅ Sent:`, data);
    } catch (error) {
        console.error('❌ Failed to send data:', error.message);
    }
};

// Send every 2 seconds
setInterval(sendFakeSensorData, 2000);
