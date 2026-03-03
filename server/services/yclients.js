const YCLIENTS_BEARER_TOKEN = process.env.YCLIENTS_BEARER_TOKEN || '';
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

async function ycFetch(formId, path) {
  const url = `https://${formId}.yclients.com/api/v1${path}`;
  const headers = {
    'Accept': 'application/vnd.yclients.v2+json',
    'Accept-Language': 'ru',
  };
  if (YCLIENTS_BEARER_TOKEN) {
    headers['Authorization'] = `Bearer ${YCLIENTS_BEARER_TOKEN}`;
  }
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`YClients API ${res.status}`);
  const json = await res.json();
  if (json.success === false) throw new Error(json.meta?.message || 'YClients error');
  return json.data || json;
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
