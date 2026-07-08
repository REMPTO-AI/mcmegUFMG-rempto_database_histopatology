const SUPABASE_URL = 'https://jkxhgkjrtsamukrwulji.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpreGhna2pydHNhbXVrcnd1bGppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1MDgyODYsImV4cCI6MjA5OTA4NDI4Nn0.OQWWy1g4U7w4ynxpwPHQFwFXI11f3j9wei_F8p7yknM';

const sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: sessionStorage,
    persistSession: true
  }
});

function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

function showMsg(id, text, type) {
  const el = document.getElementById(id);
  el.textContent = text;
  el.className = `msg ${type}`;
}

document.addEventListener('DOMContentLoaded', () => {

  // --- Tab switching ---
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(`panel${capitalize(tab.dataset.tab)}`).classList.add('active');
    });
  });

  // --- Login ---
  document.getElementById('btnLogin').addEventListener('click', async () => {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const btn = document.getElementById('btnLogin');

    if (!email || !password) return showMsg('loginMsg', 'Preencha todos os campos.', 'error');

    btn.disabled = true;
    btn.textContent = 'Entrando...';

    const { error } = await sbClient.auth.signInWithPassword({ email, password });

    if (error) {
      showMsg('loginMsg', error.message, 'error');
      btn.disabled = false;
      btn.textContent = 'Entrar';
    } else {
      window.location.href = 'index.html';
    }
  });

  // --- Register ---
  document.getElementById('btnRegister').addEventListener('click', async () => {
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const btn = document.getElementById('btnRegister');

    if (!name || !email || !password) return showMsg('registerMsg', 'Preencha todos os campos.', 'error');
    if (password.length < 6) return showMsg('registerMsg', 'A senha deve ter pelo menos 6 caracteres.', 'error');

  const confirm = document.getElementById('regConfirm').value;
  if (password !== confirm) return showMsg('registerMsg', 'As senhas não coincidem.', 'error');

    btn.disabled = true;
    btn.textContent = 'Criando conta...';

    try {
      const { data, error } = await sbClient.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } }
      });

      console.log('signUp result:', { data, error });

      if (error) {
        showMsg('registerMsg', error.message, 'error');
      } else if (data.user && data.user.identities && data.user.identities.length === 0) {
        showMsg('registerMsg', 'Este e-mail já está cadastrado.', 'error');
      } else {
        showMsg('registerMsg', 'Conta criada! Aguarde a aprovação de um administrador para acessar o sistema.', 'success');
      }
    } catch (e) {
      console.error('signUp exception:', e);
      showMsg('registerMsg', 'Erro inesperado. Veja o console.', 'error');
    }

    btn.disabled = false;
    btn.textContent = 'Criar conta';
  });

});
