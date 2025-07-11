// index.js
const express = require('express');
const OpenAI = require('openai'); // Kiểm tra lại nếu cần thư viện khác từ xAI
const bodyParser = require('body-parser');
const app = express();

// Middleware CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, HEAD, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(bodyParser.json());

// Xử lý HEAD request
app.head('/grok', (req, res) => {
  res.sendStatus(200);
});

// Lấy API Key từ biến môi trường, loại bỏ key mặc định
const apiKey = process.env.XAI_API_KEY;
if (!apiKey) {
  console.error('XAI_API_KEY is not set in environment variables');
  process.exit(1); // Thoát nếu không có API Key
}
const client = new OpenAI({
  apiKey: apiKey,
  baseURL: 'https://api.x.ai/v1', // Xác nhận lại với tài liệu xAI
});

let lastMessage = { message: '', timestamp: 0 };

// Xử lý POST request
app.post('/grok', async (req, res) => {
  console.log('Received request:', req.body);
  const { message, context } = req.body;
  if (!message) {
    console.log('Error: Missing message');
    return res.status(400).json({ error: 'Missing message' });
  }

  const currentTime = Date.now();
  const timeThreshold = 60000; // 60 giây

  const selfPatterns = [
    /^Cảm ơn bạn đã/,
    /^Không nhầm đâu bạn/,
    /^Chào bạn!/,
    /^Nếu bạn cần/,
    /New Rele Premium Corner Angle Finder/,
    /thép không gỉ cao cấp/,
    /^Xin lỗi bạn/,
    /^Đúng vậy, sản phẩm này/,
    /^Cảm ơn thông tin,/,
    /^Cảm ơn bạn đã thông cảm/,
    /thời gian ship hàng/,
    /xuất xứ từ Trung Quốc/
  ];
  if (selfPatterns.some(pattern => pattern.test(message)) ||
      (lastMessage.message === message && (currentTime - lastMessage.timestamp) < timeThreshold)) {
    console.log('Skipping self-generated or repeated message');
    return res.json({ role: 'assistant', content: '', refusal: null });
  }

  lastMessage = { message, timestamp: currentTime };

  try {
    const completion = await client.chat.completions.create({
      model: 'grok-3-latest',
      messages: [
        { role: 'system', content: context },
        { role: 'user', content: message }
      ],
      max_tokens: 100,
      temperature: 0,
      stream: false
    });
    console.log('API response:', completion.choices[0].message);
    res.json(completion.choices[0].message);
  } catch (error) {
    console.error('Lỗi khi gọi API xAI:', error.response ? error.response.data : error.message);
    res.status(error.response ? error.response.status : 500).json({ error: error.response ? error.response.data : error.message });
  }
});

// Reset lastMessage sau 5 phút không hoạt động
setInterval(() => {
  if (lastMessage && (Date.now() - lastMessage.timestamp) > 300000) {
    console.log('Reset lastMessage due to inactivity');
    lastMessage = { message: '', timestamp: 0 };
  }
}, 60000);

// Lắng nghe cổng từ Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Proxy running on port ${PORT} at http://0.0.0.0:${PORT}`);
});
