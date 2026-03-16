require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const feishuAuthRoutes = require('./routes/feishuAuth');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

app.use('/api', feishuAuthRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => {
  console.log(`[GooseArt] 服务已启动: http://localhost:${PORT}`);
  console.log(`[GooseArt] 飞书 App ID: ${process.env.FEISHU_APP_ID}`);
});
