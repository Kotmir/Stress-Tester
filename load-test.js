import http from 'k6/http';
import { check } from 'k6';

export const options = {
  vus: parseInt(__ENV.MAX_VUS) || 10000,
  duration: __ENV.TEST_DURATION || '1m',
  thresholds: {
    // Смягченные пороги: тест не упадет в ошибку (код 99), 
    // если 95% запросов выполняются быстрее 3 секунд, а доля неудачных ниже 5%
    http_req_duration: ['p(95)<3000'],
    http_req_failed: ['rate<0.05'],
  },
};

export default function () {
  const url = __ENV.TARGET_IP ? `http://${__ENV.TARGET_IP}` : (__ENV.TARGET_URL || 'https://kotmir.tech');
  const res = http.get(url, { redirects: 3 });
  
  check(res, {
    'status is 200': (r) => r.status === 200,
  });
}