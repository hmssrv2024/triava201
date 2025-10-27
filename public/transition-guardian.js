(function(global){
  function safeJSONParse(val){
    try { return JSON.parse(val); } catch(e){ return null; }
  }

  function handleStorageError(){
    var retry = confirm('Este navegador no soporta el almacenamiento requerido. ¿Desea volver a registrarse? Presione Cancelar para salir.');
    if(retry){
      try { location.replace('registro.html'); } catch(e){ console.error('Redirección falló', e); }
    } else {
      try { location.replace('index.html'); } catch(e){ console.error('Redirección falló', e); }
    }
  }

  function safeGetItem(key){
    try {
      return { value: localStorage.getItem(key) };
    } catch(e){
      console.error('Acceso a almacenamiento falló', e);
      handleStorageError();
      return { error: true };
    }
  }

  function buildLoginData(reg){
    var fullPhone = reg.phoneNumberFull || (reg.phonePrefix || '') + (reg.phoneNumber || '');
    return {
      email: reg.email,
      password: reg.password,
      securityCode: reg.verificationCode,
      phoneNumber: fullPhone,
      preferredName: reg.preferredName,
      firstName: reg.firstName,
      lastName: reg.lastName,
      fullName: reg.fullName || ((reg.firstName || '') + ' ' + (reg.lastName || '')).trim(),
      nickname: reg.nickname,
      deviceId: reg.deviceId,
      completed: true
    };
  }

  function generateToken(){
    return Math.random().toString(36).substr(2,8);
  }

  function storeToken(token){
    try {
      var tokens = safeJSONParse(sessionStorage.getItem('tgTokens')) || [];
      tokens.push(token);
      sessionStorage.setItem('tgTokens', JSON.stringify(tokens));
    } catch(e){ console.error('No se pudo almacenar el token', e); }
  }

  function validateToken(token){
    try {
      var tokens = safeJSONParse(sessionStorage.getItem('tgTokens')) || [];
      var idx = tokens.indexOf(token);
      if(idx !== -1){
        tokens.splice(idx,1);
        sessionStorage.setItem('tgTokens', JSON.stringify(tokens));
        return true;
      }
    } catch(e){ console.error('Validación de token falló', e); }
    return false;
  }

  function persistData(reg){
    try {
      localStorage.setItem('visaRegistrationCompleted', JSON.stringify(reg));
      sessionStorage.setItem('visaRegistrationBackup', JSON.stringify(reg));
      localStorage.setItem('visaUserData', JSON.stringify(buildLoginData(reg)));

      var balanceRes = safeGetItem('remeexBalance');
      if(balanceRes.error){ return { error: true }; }
      if(!balanceRes.value){
        localStorage.setItem('remeexBalance', JSON.stringify({usd:0, bs:0, eur:0, deviceId: reg.deviceId}));
      }
      sessionStorage.setItem('fromRegistro','true');
    } catch(e){
      if(e && e.name === 'QuotaExceededError'){
        console.error('Persistencia falló, cuota de almacenamiento excedida', e);
        return { error: true };
      }
      console.error('Persistencia falló', e);
    }
    return { success: true };
  }

  function redirectWithRetries(target){
    function attempt(){
      try { location.replace(target); } catch(e){ console.error('Redirección falló', e); }
    }
    attempt();
    setTimeout(attempt, 1000);
    setTimeout(attempt, 5000);
  }

  function persistAndRedirect(reg, useOldRecarga){
    var res = persistData(reg);
    if(res && res.error){
      alert('No se pudo guardar la información. Por favor use una imagen más ligera.');
      return res;
    }

    function dataAvailable(){
      var check = safeGetItem('visaRegistrationCompleted');
      if(check.error){ return false; }
      return !!safeJSONParse(check.value);
    }

    if(!dataAvailable()){
      res = persistData(reg);
      if(res && res.error){
        alert('No se pudo guardar la información. Por favor use una imagen más ligera.');
        return res;
      }
      if(!dataAvailable()){
        alert('No se pudo acceder a la información almacenada. Intente nuevamente.');
        return { error: true };
      }
    }

    var token = generateToken();
    storeToken(token);
    var target = useOldRecarga ? 'recarga3.html' : 'homevisa.html';
    target += '?token=' + encodeURIComponent(token);
    redirectWithRetries(target);
  }

  function validateRecarga(){
    var regRes = safeGetItem('visaRegistrationCompleted');
    if(regRes.error){ return { error: true }; }
    var userRes = safeGetItem('visaUserData');
    if(userRes.error){ return { error: true }; }

    var reg = safeJSONParse(regRes.value);
    var user = safeJSONParse(userRes.value);
    if(!reg || !user){
      alert('Sesión inválida, vuelva a registrarse.');
      location.replace('registro.html');
    } else {
      try { sessionStorage.removeItem('fromRegistro'); } catch(e){}
    }
    return { success: true };
  }

  global.transitionGuardian = {
    persistAndRedirect: persistAndRedirect,
    validateRecarga: validateRecarga,
    validateToken: validateToken
  };
})(window);
