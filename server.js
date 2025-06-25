// const { ElevenLabsClient } = require('elevenlabs');
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const OpenAI = require('openai');
const VoximplantApiClient = require('@voximplant/apiclient-nodejs').default;
const axios = require('axios');
const fs = require('fs');

// --- Configuration ---
// !!! ВАЖНО: Вставьте ваши ключи и настройки прямо сюда.

// --- Voximplant ---
// 1. Зайдите в ваш аккаунт Voximplant.
// 2. Создайте API-ключ в разделе "API-ключи" и вставьте его в отдельный файл voximplant_key.json (одна строка, без пробелов).
const VOX_API_KEY_FILE = './voximplant_key.json';
// 3. Ваш Account ID можно найти в правом верхнем углу панели управления.
const VOX_ACCOUNT_ID = "9742417";
// 4. ID правила, которое будет запускать сценарий. Мы создадим его позже.
const VOX_RULE_ID = 7920680; 
// 5. Номер, с которого будет идти звонок (нужно купить или подтвердить в Voximplant)
const CALLER_ID = "+79011475134";


// --- OpenAI & ElevenLabs ---
const OPENAI_API_KEY = "sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"; // <-- ВАШ OPENAI КЛЮЧ
const ELEVENLABS_API_KEY = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"; // <-- ВАШ ELEVENLABS КЛЮЧ
const ELEVENLABS_VOICE_ID = "N2lVSenRfGfgHY8BJJnt"; // ID голоса

const PORT = process.env.PORT || 3000;

// --- Initialize Clients ---
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
// const elevenlabs = new ElevenLabsClient({ apiKey: ELEVENLABS_API_KEY });

// --- Voximplant API Client ---
const voxClient = new VoximplantApiClient(VOX_API_KEY_FILE);
// Не нужно вызывать setApiKey или setAccountId

// Получаем API-ключ из voximplant_key.json
const VOX_API_KEY = JSON.parse(fs.readFileSync('./voximplant_key.json', 'utf8')).apiKey;

// --- Middleware ---
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- WebSockets Connection Handler ---
// Этот обработчик будет принимать аудио от сценария Voximplant
wss.on('connection', (ws) => {
    console.log('New WebSocket connection from Voximplant scenario initiated.');
    // Тут будет логика обработки аудио, общения с GPT и ElevenLabs
    // и отправки аудио обратно в сценарий.
    // Для MVP оставим это пустым, чтобы проверить сам факт звонка.
});


// --- Express Routes ---

// 1. Frontend POSTs to this endpoint to start the call
app.post('/call', async (req, res) => {
    const { phoneNumber, systemPrompt } = req.body;

    if (!phoneNumber) {
        return res.status(400).json({ success: false, message: 'Phone number is required.' });
    }

    try {
        const customData = { phoneNumber, systemPrompt };
        console.log('Sending to Voximplant:', JSON.stringify(customData));

        const response = await axios.post('https://api.voximplant.com/platform_api/StartScenarios/', null, {
            params: {
                account_id: VOX_ACCOUNT_ID,
                api_key: VOX_API_KEY,
                rule_id: VOX_RULE_ID,
                caller: CALLER_ID,
                destination: phoneNumber,
                custom_data: JSON.stringify(customData)
            }
        });

        console.log("Voximplant StartScenarios result:", response.data);
        res.json({ success: true, message: 'Call initiated via Voximplant.' });

    } catch (error) {
        console.error('Error initiating call via Voximplant:', error);
        res.status(500).json({ success: false, message: 'Failed to initiate call.' });
    }
});


// --- Server Startup ---
server.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});

// This initial MVP focuses on setting up the call and the infrastructure.
// The next steps would be to:
// 1. Properly handle the incoming audio stream on the WebSocket.
// 2. Transcribe the audio with Whisper.
// 3. Send the transcript to GPT-4.
// 4. Get the response and send it to the `/speak` logic to be synthesized.
// 5. Stream the synthesized audio back into the call via the WebSocket.
// This example sets up the foundation for you to build upon. 