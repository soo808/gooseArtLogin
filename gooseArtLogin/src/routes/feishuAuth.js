const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const feishu = require('../services/feishuService');

const router = express.Router();

const {
  FEISHU_APP_ID,
  FEISHU_APP_SECRET,
  JWT_SECRET,
} = process.env;

const users = new Map();

/**
 * POST /api/auth/feishu/auto-login
 * 前端传入 tt.login() 获取的 code，后端换取 user_access_token → 拉取用户信息 → 签发 JWT
 */
router.post('/auth/feishu/auto-login', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, msg: '缺少 code 参数' });
    }

    const appToken = await feishu.getAppAccessToken(FEISHU_APP_ID, FEISHU_APP_SECRET);
    const userAccessToken = await feishu.getUserAccessToken(appToken, code);
    const userInfo = await feishu.getUserInfo(userAccessToken);

    if (!users.has(userInfo.open_id)) {
      users.set(userInfo.open_id, {
        ...userInfo,
        created_at: new Date().toISOString(),
      });
    }
    users.set(userInfo.open_id, {
      ...users.get(userInfo.open_id),
      ...userInfo,
      last_login: new Date().toISOString(),
    });

    const token = jwt.sign(
      {
        open_id: userInfo.open_id,
        user_id: userInfo.user_id,
        name: userInfo.name,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: userInfo,
    });
  } catch (err) {
    console.error('[飞书免登录] 失败:', err.message);
    res.status(500).json({ success: false, msg: err.message });
  }
});

/**
 * POST /api/feishu/jsapi-signature
 * 前端传入当前页面 url，后端返回 JSAPI 签名参数（用于 tt.config）
 */
router.post('/feishu/jsapi-signature', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ success: false, msg: '缺少 url 参数' });
    }

    const tenantToken = await feishu.getTenantAccessToken(FEISHU_APP_ID, FEISHU_APP_SECRET);
    const ticket = await feishu.getJsapiTicket(tenantToken);

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonceStr = crypto.randomBytes(16).toString('hex');
    const signature = feishu.generateJsapiSignature(ticket, nonceStr, timestamp, url);

    res.json({
      success: true,
      appId: FEISHU_APP_ID,
      timestamp,
      nonceStr,
      signature,
    });
  } catch (err) {
    console.error('[JSAPI 签名] 失败:', err.message);
    res.status(500).json({ success: false, msg: err.message });
  }
});

/**
 * GET /api/auth/me
 * 通过 JWT 验证当前用户身份
 */
router.get('/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, msg: '未登录' });
  }

  try {
    const decoded = jwt.verify(authHeader.slice(7), JWT_SECRET);
    const user = users.get(decoded.open_id);
    res.json({ success: true, user: user || decoded });
  } catch {
    res.status(401).json({ success: false, msg: 'token 无效或已过期' });
  }
});

module.exports = router;
