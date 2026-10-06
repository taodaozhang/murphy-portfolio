(() => {
  'use strict';
  const dialog = document.querySelector('#feedback-dialog');
  const launch = document.querySelector('.feedback-launch');
  const form = document.querySelector('#feedback-form');
  const fields = document.querySelector('#feedback-fields');
  const status = document.querySelector('#feedback-status');
  const message = document.querySelector('#feedback-message');
  const submit = document.querySelector('.feedback-submit');
  const success = document.querySelector('#feedback-success');
  const config = window.MURPHY_FEEDBACK || {};
  let endpoint = null;
  // Accept only the public key format. Privileged or legacy JWT keys are rejected.
  try {
    const url = new URL(config.supabaseUrl);
    if (url.protocol === 'https:' && /^[a-z0-9-]+\.supabase\.co$/.test(url.hostname)
        && !url.username && !url.password && (url.pathname === '/' || url.pathname === '')
        && !url.search && !url.hash && !url.port
        && /^sb_publishable_[A-Za-z0-9_-]+$/.test(config.publishableKey)) {
      endpoint = new URL('/rest/v1/feedback', url).href;
    }
  } catch (_) { /* The unconfigured form stays explicitly unavailable. */ }
  let pending = false;
  let previousFocus;
  let requestId;
  let signature;
  const setStatus = (text, tone = 'info') => {
    status.textContent = text;
    status.dataset.tone = tone;
  };
  if (!endpoint) setStatus('暂未开放反馈。你可以通过页面中的电话与我联系。');
  fields.disabled = !endpoint;
  launch.hidden = false;
  launch.addEventListener('click', () => {
    previousFocus = document.activeElement;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    document.querySelector('.feedback-close').focus();
  });
  document.querySelector('.feedback-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    document.body.style.overflow = '';
    previousFocus?.focus();
  });
  message.addEventListener('input', () => {
    message.setCustomValidity('');
    document.querySelector('#feedback-count').textContent = `${message.value.length} / 2000`;
  });
  document.querySelector('.feedback-again').addEventListener('click', () => {
    success.hidden = true;
    form.hidden = false;
    setStatus('');
    document.querySelector('#feedback-name').focus();
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (pending || !endpoint) return;
    message.setCustomValidity(message.value.trim().length < 5 ? '请至少填写 5 个非空白字符。' : '');
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const payload = {
      name: String(data.get('name') || '').trim() || null,
      relation: data.get('relation'), device: data.get('device'),
      message: message.value.trim(), version: 'V3'
    };
    const nextSignature = JSON.stringify(payload);
    if (!requestId || signature !== nextSignature) {
      requestId = crypto.randomUUID();
      signature = nextSignature;
    }
    payload.submission_id = requestId;
    pending = true;
    fields.disabled = true;
    form.setAttribute('aria-busy', 'true');
    submit.textContent = '正在提交…';
    setStatus('正在发送，请稍候。');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch(endpoint, {
        method: 'POST', signal: controller.signal, credentials: 'omit',
        headers: { 'Content-Type': 'application/json', apikey: config.publishableKey, Prefer: 'return=minimal' },
        body: JSON.stringify(payload)
      });
      if (response.status !== 201) {
        const error = await response.json().catch(() => ({}));
        if (response.status === 409 && error.code === '23505') {
          throw new Error('这次反馈可能已收到，请勿重复发送。内容已保留；如需确认，请通过电话联系我。');
        }
        if (response.status === 429) throw new Error('提交较频繁，请稍后再试。你填写的内容已保留。');
        throw new Error('暂时无法提交，请稍后重试。你填写的内容已保留。');
      }
      form.reset();
      document.querySelector('#feedback-count').textContent = '0 / 2000';
      requestId = signature = undefined;
      form.hidden = true;
      success.hidden = false;
      setStatus('反馈已提交，谢谢你的建议。');
      document.querySelector('.feedback-again').focus();
    } catch (error) {
      const text = error.name === 'AbortError' || error instanceof TypeError
        ? '网络中断或等待超时，暂时无法确认是否收到。内容已保留，可稍后重试。'
        : error.message;
      setStatus(text, 'error');
    } finally {
      clearTimeout(timeout);
      pending = false;
      fields.disabled = !endpoint;
      form.removeAttribute('aria-busy');
      submit.innerHTML = '提交反馈 <span aria-hidden="true">↗</span>';
    }
  });
})();
