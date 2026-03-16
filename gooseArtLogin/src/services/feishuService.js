const axios = require('axios');
const crypto = require('crypto');

const FEISHU_BASE = 'https://open.feishu.cn/open-apis';

let cachedAppToken = null;
let appTokenExpiresAt = 0;
let cachedTenantToken = null;
let tenantTokenExpiresAt = 0;

async function getAppAccessToken(appId, appSecret) {
  if (cachedAppToken && Date.now() < appTokenExpiresAt) {
    return cachedAppToken;
  }

  const res = await axios.post(`${FEISHU_BASE}/auth/v3/app_access_token/internal`, {
    app_id: appId,
    app_secret: appSecret,
  });

  if (res.data.code !== 0) {
    throw new Error(`获取 app_access_token 失败: ${res.data.msg}`);
  }

  cachedAppToken = res.data.app_access_token;
  appTokenExpiresAt = Date.now() + (res.data.expire - 300) * 1000;
  return cachedAppToken;
}

async function getTenantAccessToken(appId, appSecret) {
  if (cachedTenantToken && Date.now() < tenantTokenExpiresAt) {
    return cachedTenantToken;
  }

  const res = await axios.post(`${FEISHU_BASE}/auth/v3/tenant_access_token/internal`, {
    app_id: appId,
    app_secret: appSecret,
  });

  if (res.data.code !== 0) {
    throw new Error(`获取 tenant_access_token 失败: ${res.data.msg}`);
  }

  cachedTenantToken = res.data.tenant_access_token;
  tenantTokenExpiresAt = Date.now() + (res.data.expire - 300) * 1000;
  return cachedTenantToken;
}

async function getUserAccessToken(appAccessToken, code) {
  const res = await axios.post(
    `${FEISHU_BASE}/authen/v1/access_token`,
    { grant_type: 'authorization_code', code },
    { headers: { Authorization: `Bearer ${appAccessToken}` } }
  );

  if (res.data.code !== 0) {
    throw new Error(`code 换取 user_access_token 失败: ${res.data.msg}`);
  }

  return res.data.data.access_token;
}

async function getUserInfo(userAccessToken) {
  const res = await axios.get(`${FEISHU_BASE}/authen/v1/user_info`, {
    headers: { Authorization: `Bearer ${userAccessToken}` },
  });

  if (res.data.code !== 0) {
    throw new Error(`获取用户信息失败: ${res.data.msg}`);
  }

  const d = res.data.data;
  return {
    open_id: d.open_id,
    user_id: d.user_id,
    name: d.name,
    email: d.enterprise_email || d.email,
    mobile: d.mobile,
    avatar_url: d.avatar_url,
  };
}

async function getJsapiTicket(tenantAccessToken) {
  const res = await axios.post(
    `${FEISHU_BASE}/jssdk/ticket/get`,
    {},
    { headers: { Authorization: `Bearer ${tenantAccessToken}` } }
  );

  if (res.data.code !== 0) {
    throw new Error(`获取 jsapi_ticket 失败: ${res.data.msg}`);
  }

  return res.data.data.ticket;
}

function generateJsapiSignature(ticket, nonceStr, timestamp, url) {
  const params = `jsapi_ticket=${ticket}&noncestr=${nonceStr}&timestamp=${timestamp}&url=${url}`;
  return crypto.createHash('sha256').update(params).digest('hex');
}

module.exports = {
  getAppAccessToken,
  getTenantAccessToken,
  getUserAccessToken,
  getUserInfo,
  getJsapiTicket,
  generateJsapiSignature,
};
