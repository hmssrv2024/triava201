(function(){
  if(window.GlobalData) return;
  const storage = window.useSessionStorage ? sessionStorage : localStorage;
  function parse(val){
    try{ return JSON.parse(val); }catch(e){ return val; }
  }
  const api = {
    getAll(){
      const data = {};
      for(let i=0;i<storage.length;i++){
        const key = storage.key(i);
        data[key] = parse(storage.getItem(key));
      }
      return data;
    },
    get(key){
      return parse(storage.getItem(key));
    },
    set(key,value){
      if(typeof value === 'object'){
        storage.setItem(key, JSON.stringify(value));
      } else {
        storage.setItem(key, value);
      }
    }
  };
  window.GlobalData = api;
  document.dispatchEvent(new CustomEvent('globalDataReady', { detail: api.getAll() }));
})();

