/* ===========================================================
   Maison Aurelle - Login & Form Validation System
   Pure JavaScript, no libraries. Users are stored in
   localStorage for demo purposes (a real app uses a server).
   =========================================================== */

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

const loginForm  = $('#loginForm');
const signupForm = $('#signupForm');
const welcome    = $('#welcome');
const tabLogin   = $('#tabLogin');
const tabSignup  = $('#tabSignup');
const tabBar     = $('#tabBar');

/* ---------- Validation rules ---------- */
const rules = {
  required: v => (v ? '' : 'Please enter your password.'),
  name: v => {
    if (!v.trim()) return 'Please enter your full name.';
    if (!/^[A-Za-z][A-Za-z\s'.-]{1,49}$/.test(v.trim())) return 'Use letters only, at least 2 characters.';
    return '';
  },
  email: v => {
    if (!v.trim()) return 'Please enter your email address.';
    if (!/^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(v.trim())) return 'Enter a valid email, like name@example.com.';
    return '';
  },
  phone: v => {
    if (!v.trim()) return 'Please enter your phone number.';
    if (!/^\+?[0-9\s-]{10,14}$/.test(v.trim())) return 'Enter 10 to 14 digits. A leading + is allowed.';
    return '';
  },
  password: v => {
    if (!v) return 'Please create a password.';
    if (v.length < 8) return 'Use at least 8 characters.';
    if (!/[A-Z]/.test(v)) return 'Add one uppercase letter.';
    if (!/[a-z]/.test(v)) return 'Add one lowercase letter.';
    if (!/[0-9]/.test(v)) return 'Add one number.';
    if (!/[^A-Za-z0-9]/.test(v)) return 'Add one special character, like ! or @.';
    return '';
  },
  confirm: v => {
    if (!v) return 'Please confirm your password.';
    return v !== $('#signPass').value ? 'Passwords do not match.' : '';
  },
  terms: (v, input) => (input.checked ? '' : 'You need to accept the terms to continue.')
};

/* ---------- Show / clear field state ---------- */
function validateField(input) {
  const rule = input.dataset.rule;
  if (!rule) return true;
  const error = rules[rule](input.value, input);
  const field = input.closest('.field');
  field.classList.toggle('invalid', !!error);
  field.classList.toggle('valid', !error && input.type !== 'checkbox');
  $('.msg', field).textContent = error;
  input.setAttribute('aria-invalid', !!error);
  return !error;
}

function validateForm(form) {
  const results = $$('[data-rule]', form).map(validateField);
  const ok = results.every(Boolean);
  if (!ok) {
    form.classList.remove('shake'); void form.offsetWidth; form.classList.add('shake');
    $$('.invalid input', form)[0]?.focus();
  }
  return ok;
}

/* Live validation: after first blur, re-check while typing */
$$('[data-rule]').forEach(input => {
  input.addEventListener('blur', () => { input.dataset.touched = '1'; validateField(input); });
  const live = () => {
    if (input.dataset.touched || input.type === 'checkbox') validateField(input);
    if (input.id === 'signPass') {
      updateMeter(input.value);
      if ($('#confirm').dataset.touched) validateField($('#confirm'));
    }
  };
  input.addEventListener('input', live);
  input.addEventListener('change', live);
});

/* ---------- Password strength meter ---------- */
function updateMeter(v) {
  let score = 0;
  if (v.length >= 8) score++;
  if (/[A-Z]/.test(v) && /[a-z]/.test(v)) score++;
  if (/[0-9]/.test(v)) score++;
  if (/[^A-Za-z0-9]/.test(v)) score++;
  if (!v) score = 0;
  const labels = ['Add a password', 'Weak', 'Fair', 'Good', 'Excellent'];
  const meter = $('.meter');
  meter.dataset.level = score;
  $('#meterText').textContent = labels[score];
}

/* ---------- Show / hide password ---------- */
$$('.eye').forEach(btn => btn.addEventListener('click', () => {
  const input = btn.parentElement.querySelector('input');
  const show = input.type === 'password';
  input.type = show ? 'text' : 'password';
  btn.textContent = show ? 'Hide' : 'Show';
  btn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
}));

/* ---------- Tabs ---------- */
function moveBar(tab) {
  tabBar.style.left = tab.offsetLeft + 'px';
  tabBar.style.width = tab.offsetWidth + 'px';
}
function switchTab(toSignup) {
  welcome.hidden = true;
  loginForm.hidden = toSignup;
  signupForm.hidden = !toSignup;
  tabLogin.classList.toggle('active', !toSignup);
  tabSignup.classList.toggle('active', toSignup);
  tabLogin.setAttribute('aria-selected', !toSignup);
  tabSignup.setAttribute('aria-selected', toSignup);
  moveBar(toSignup ? tabSignup : tabLogin);
}
tabLogin.onclick  = () => switchTab(false);
tabSignup.onclick = () => switchTab(true);
window.addEventListener('load', () => moveBar(tabLogin));
window.addEventListener('resize', () => moveBar(tabLogin.classList.contains('active') ? tabLogin : tabSignup));

/* ---------- Storage helpers ---------- */
const getUsers = () => JSON.parse(localStorage.getItem('aurelle_users') || '[]');
const saveUsers = u => localStorage.setItem('aurelle_users', JSON.stringify(u));

/* ---------- Button loading state ---------- */
function withLoading(form, done) {
  const btn = $('.cta', form);
  btn.classList.add('loading'); btn.disabled = true;
  setTimeout(() => { btn.classList.remove('loading'); btn.disabled = false; done(); }, 900);
}

/* ---------- Sign up ---------- */
signupForm.addEventListener('submit', e => {
  e.preventDefault();
  if (!validateForm(signupForm)) return;

  const email = $('#signEmail').value.trim().toLowerCase();
  const users = getUsers();
  if (users.some(u => u.email === email)) {
    const f = $('#signEmail').closest('.field');
    f.classList.replace('valid', 'invalid');
    $('.msg', f).textContent = 'This email is already registered. Try signing in.';
    return;
  }
  withLoading(signupForm, () => {
    const user = { name: $('#name').value.trim(), email, phone: $('#phone').value.trim(), password: $('#signPass').value };
    users.push(user); saveUsers(users);
    showWelcome(user, 'Your account is ready');
    signupForm.reset();
    $$('.field', signupForm).forEach(f => f.classList.remove('valid', 'invalid'));
    $$('[data-touched]').forEach(i => delete i.dataset.touched);
    updateMeter('');
  });
});

/* ---------- Login ---------- */
loginForm.addEventListener('submit', e => {
  e.preventDefault();
  const alertBox = $('#loginAlert');
  alertBox.hidden = true;
  if (!validateForm(loginForm)) return;

  withLoading(loginForm, () => {
    const email = $('#loginEmail').value.trim().toLowerCase();
    const user = getUsers().find(u => u.email === email && u.password === $('#loginPass').value);
    if (!user) {
      alertBox.textContent = 'Email or password is incorrect. Check your details or create an account.';
      alertBox.hidden = false;
      loginForm.classList.remove('shake'); void loginForm.offsetWidth; loginForm.classList.add('shake');
      return;
    }
    if ($('#remember').checked) localStorage.setItem('aurelle_session', email);
    showWelcome(user, 'You are signed in');
    loginForm.reset();
    $$('.field', loginForm).forEach(f => f.classList.remove('valid', 'invalid'));
  });
});

/* ---------- Welcome screen ---------- */
function showWelcome(user, text) {
  loginForm.hidden = true; signupForm.hidden = true; welcome.hidden = false;
  $('#welcomeTitle').textContent = 'Welcome, ' + user.name.split(' ')[0];
  $('#welcomeText').textContent = text + ' as ' + user.email + '.';
}
$('#logout').onclick = () => { localStorage.removeItem('aurelle_session'); switchTab(false); };

/* ---------- Forgot password (demo) ---------- */
$('#forgot').addEventListener('click', e => {
  e.preventDefault();
  const email = $('#loginEmail');
  email.dataset.touched = '1';
  if (validateField(email)) alert('A reset link would be sent to ' + email.value.trim() + ' in a real application.');
  else email.focus();
});

/* ---------- Restore remembered session ---------- */
const remembered = localStorage.getItem('aurelle_session');
const rememberedUser = remembered && getUsers().find(u => u.email === remembered);
if (rememberedUser) showWelcome(rememberedUser, 'Welcome back');