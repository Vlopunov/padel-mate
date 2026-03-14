const YCLIENTS_BEARER_TOKEN = process.env.YCLIENTS_BEARER_TOKEN || 'padelgo';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 min
const cache = new Map();

function getCached(key) {
  const entry = cache.get(key);
  if (entry && entry.expiry > Date.now()) return entry.data;
  cache.delete(key);
  return null;
}

function setCache(key, data) {
  cache.set(key, { data, expiry: Date.now() + CACHE_TTL_MS });
}

async function ycFetch(formId, path, retries = 2) {
  const url = `https://api.yclients.com/api/v1${path}`;
  const headers = {
    'Accept': 'application/vnd.yclients.v2+json',
    'Accept-Language': 'ru',
    'Authorization': `Bearer ${YCLIENTS_BEARER_TOKEN}`,
  };
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { headers, signal: AbortSignal.timeout(10000) });
      if (!res.ok) throw new Error(`YClients API ${res.status}`);
      const json = await res.json();
      if (json.success === false) throw new Error(json.meta?.message || 'YClients error');
      return json.data || json;
    } catch (err) {
      if (attempt < retries) {
        console.warn(`YClients fetch retry ${attempt + 1}/${retries}: ${err.message}`);
        await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
        continue;
      }
      throw err;
    }
  }
}

async function getServices(formId, companyId) {
  const key = `svc:${companyId}`;
  const cached = getCached(key);
  if (cached) return cached;
  const data = await ycFetch(formId, `/book_services/${companyId}`);
  setCache(key, data);
  return data;
}

async function getStaff(formId, companyId, serviceIds = []) {
  const params = serviceIds.map(id => `service_ids[]=${id}`).join('&');
  const key = `staff:${companyId}:${params}`;
  const cached = getCached(key);
  if (cached) return cached;
  const data = await ycFetch(formId, `/book_staff/${companyId}${params ? '?' + params : ''}`);
  setCache(key, data);
  return data;
}

async function getDates(formId, companyId, staffId, serviceIds = []) {
  const params = new URLSearchParams();
  if (staffId) params.set('staff_id', staffId);
  serviceIds.forEach(id => params.append('service_ids[]', id));
  const qs = params.toString();
  const key = `dates:${companyId}:${qs}`;
  const cached = getCached(key);
  if (cached) return cached;
  const data = await ycFetch(formId, `/book_dates/${companyId}${qs ? '?' + qs : ''}`);
  setCache(key, data);
  return data;
}

async function getTimes(formId, companyId, staffId, day, serviceIds = []) {
  const params = serviceIds.map(id => `service_ids[]=${id}`).join('&');
  const key = `times:${companyId}:${staffId}:${day}:${params}`;
  const cached = getCached(key);
  if (cached) return cached;
  const data = await ycFetch(formId, `/book_times/${companyId}/${staffId}/${day}${params ? '?' + params : ''}`);
  setCache(key, data);
  return data;
}

module.exports = { getServices, getStaff, getDates, getTimes };
