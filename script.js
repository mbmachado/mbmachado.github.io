

document.getElementById('external-link').addEventListener('click', (ev) => {
  ev.preventDefault();

  const url = 'https://google.com.br';
  
  ga('create', 'UA-208804201-1', 'mbmachado.github.io', 'gaTracker' );
  ga('gaTracker.send', 'event', 'Whatsapp', 'Botao', 'Rodape', url, {
    'transport': 'beacon',
    'hitCallback': function() { 
      window.open(url, '_blank');
    }
  });
});