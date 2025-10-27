(function(){
  const fab = document.getElementById('support-fab');
  const toggle = document.getElementById('fab-toggle');
  if(!fab || !toggle) return;

  toggle.addEventListener('click', function(e){
    e.stopPropagation();
    fab.classList.toggle('open');
  });

  document.addEventListener('click', function(e){
    if(fab.classList.contains('open') && !fab.contains(e.target)){
      fab.classList.remove('open');
    }
  });
})();
