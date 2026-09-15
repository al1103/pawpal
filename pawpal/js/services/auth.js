/* ---------------------------------------------------------------
   MOCK AUTHENTICATION — local only.
   Raw passwords are never stored: only a SHA-256 digest of
   (email + password) is kept, purely so the demo can verify a login.
   This is NOT real security. Replace the four functions inside
   `backend` with HTTP calls and the UI keeps working unchanged.
   --------------------------------------------------------------- */
window.PP = window.PP || {};
PP.auth = (function(){

  const backend = {
    async findUser(email){
      const users = PP.storage.read("users", []);
      return users.find(u => u.email.toLowerCase() === String(email).toLowerCase()) || null;
    },
    async createUser({username, email, password}){
      const users = PP.storage.read("users", []);
      const hash = await PP.util.digest(email.toLowerCase() + "::" + password);
      const user = {
        id:PP.util.uid("u"), username, email:email.toLowerCase(), hash,
        bio:"", avatar:"🐾", createdAt:Date.now(), playMinutes:0
      };
      users.push(user);
      PP.storage.write("users", users);
      return user;
    },
    async verify(email, password){
      const user = await backend.findUser(email);
      if(!user) return null;
      const hash = await PP.util.digest(String(email).toLowerCase() + "::" + password);
      return hash === user.hash ? user : null;
    },
    async updateUser(id, patch){
      const users = PP.storage.read("users", []);
      const i = users.findIndex(u => u.id === id);
      if(i < 0) return null;
      users[i] = Object.assign({}, users[i], patch);
      PP.storage.write("users", users);
      return users[i];
    }
  };

  const publicUser = u => u && {id:u.id, username:u.username, email:u.email, bio:u.bio,
                                avatar:u.avatar, createdAt:u.createdAt, playMinutes:u.playMinutes || 0};

  /* ---- validation (shared by the forms) ---- */
  function validate(kind, values){
    const e = {};
    if(kind === "register"){
      if(!values.username || values.username.trim().length < 3) e.username = "Pick a name with at least 3 characters.";
      else if(values.username.length > 20) e.username = "20 characters maximum.";
      if(!values.password || values.password.length < 8) e.password = "Use at least 8 characters.";
      if(values.confirm !== values.password) e.confirm = "The two passwords do not match.";
    }else{
      if(!values.password) e.password = "Enter your password.";
    }
    if(!values.email) e.email = "Enter your email address.";
    else if(!PP.util.emailOk(values.email)) e.email = "That does not look like an email address.";
    return e;
  }

  function startSession(user, remember){
    const session = {userId:user.id, startedAt:Date.now(),
                     expiresAt:Date.now() + (remember ? 30 : 1) * 86400000};
    if(remember) PP.storage.write("session", session);
    else PP.storage.sessionWrite("session", session);
    PP.store.setUser(publicUser(user));
  }

  async function register(values){
    const errors = validate("register", values);
    if(Object.keys(errors).length) return {ok:false, errors};
    if(await backend.findUser(values.email))
      return {ok:false, errors:{email:"An account already uses this email."}};
    const user = await backend.createUser(values);
    startSession(user, !!values.remember);
    return {ok:true, user:publicUser(user)};
  }

  async function login(values){
    const errors = validate("login", values);
    if(Object.keys(errors).length) return {ok:false, errors};
    const user = await backend.verify(values.email, values.password);
    if(!user) return {ok:false, errors:{password:"Email or password is incorrect."}};
    startSession(user, !!values.remember);
    return {ok:true, user:publicUser(user)};
  }

  function logout(){
    PP.storage.remove("session");
    PP.storage.sessionRemove("session");
    PP.store.setUser(null);
  }

  async function restore(){
    const session = PP.storage.read("session", null) || PP.storage.sessionRead("session", null);
    if(!session) return null;
    if(session.expiresAt < Date.now()){ logout(); return {expired:true}; }
    const users = PP.storage.read("users", []);
    const user = users.find(u => u.id === session.userId);
    if(!user){ logout(); return null; }
    PP.store.setUser(publicUser(user));
    return publicUser(user);
  }

  async function updateProfile(patch){
    const u = PP.store.state.user;
    if(!u) return {ok:false, errors:{_:"You are signed out."}};
    const errors = {};
    if(patch.username !== undefined){
      const n = String(patch.username).trim();
      if(n.length < 3 || n.length > 20) errors.username = "Between 3 and 20 characters.";
    }
    if(patch.bio !== undefined && patch.bio.length > 160) errors.bio = "160 characters maximum.";
    if(Object.keys(errors).length) return {ok:false, errors};
    const saved = await backend.updateUser(u.id, patch);
    PP.store.setUser(publicUser(saved));
    return {ok:true, user:publicUser(saved)};
  }

  function addPlayMinutes(mins){
    const u = PP.store.state.user;
    if(!u) return;
    backend.updateUser(u.id, {playMinutes:(u.playMinutes || 0) + mins});
    u.playMinutes = (u.playMinutes || 0) + mins;
  }

  const isLoggedIn = () => !!PP.store.state.user;

  return {register, login, logout, restore, updateProfile, validate, isLoggedIn, addPlayMinutes};
})();
