
const SUPABASE_ANON_KEY='sb_publishable_sQwt6XiafcbTcbmpocLM_Q_YdvKNK8y';
const AUTH_REDIRECT_URL='https://rafwonko-stack.github.io/Magnat-Flower/';
const CLOUD_READY=/^https:\/\/[^/]+\.supabase\.co$/.test(SUPABASE_URL)&&!SUPABASE_ANON_KEY.startsWith('PASTE_');
  try{
    const endpoint=authMode==='signup'?'/auth/v1/signup':'/auth/v1/token?grant_type=password';
    const endpoint=authMode==='signup'?`/auth/v1/signup?redirect_to=${encodeURIComponent(AUTH_REDIRECT_URL)}`:'/auth/v1/token?grant_type=password';
    const result=await cloudFetch(endpoint,{method:'POST',body:JSON.stringify({email:String(data.get('email')).trim(),password:String(data.get('password'))})},false);
}
async function restoreSessionFromRedirect(){
  const params=new URLSearchParams(location.hash.replace(/^#/,'')),accessToken=params.get('access_token'),refreshToken=params.get('refresh_token');
  if(!accessToken||!refreshToken)return false;
  try{
    const response=await fetch(`${SUPABASE_URL}/auth/v1/user`,{headers:authHeaders(accessToken)});
    const user=await response.json();
    if(!response.ok)throw Error(user?.message||'Не удалось подтвердить email.');
    const expiresIn=Number(params.get('expires_in'))||3600;
    storeSession({access_token:accessToken,refresh_token:refreshToken,token_type:params.get('token_type')||'bearer',expires_in:expiresIn,expires_at:Math.floor(Date.now()/1000)+expiresIn,user});
    history.replaceState(null,'',location.pathname+location.search);
    return true;
  }catch(error){
    history.replaceState(null,'',location.pathname+location.search);
    $('#auth-page').hidden=false;$('#auth-error').textContent=error.message||'Не удалось подтвердить email.';
    return false;
  }
}
function updateAuthMode(){const signup=authMode==='signup';$('#auth-title').textContent=signup?'Создание аккаунта':'Вход в систему';$('#auth-description').textContent=signup?'Создайте защищённую облачную базу магазина.':'Войдите, чтобы открыть общую базу магазина.';$('#auth-submit').textContent=signup?'Создать аккаунт':'Войти';$('#auth-toggle').textContent=signup?'У меня уже есть аккаунт':'Создать аккаунт'}
  if(!CLOUD_READY){$('#auth-page').hidden=false;$('#setup-message').hidden=false;$('#setup-message').textContent='Облачная база ещё не подключена. Вставьте Project URL и anon key в начало файла app.js.';$('#auth-form').querySelectorAll('input,button').forEach(element=>element.disabled=true);$('#auth-toggle').disabled=true;return}
  const restored=await restoreSessionFromRedirect();
  try{session=JSON.parse(localStorage.getItem(SESSION_KEY)||'null')}catch{session=null}
  if(!restored)try{session=JSON.parse(localStorage.getItem(SESSION_KEY)||'null')}catch{session=null}
  if(session?.expires_at&&session.expires_at*1000<Date.now()+60000){try{await refreshSession()}catch{storeSession(null)}}
