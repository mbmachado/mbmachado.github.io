"use strict";

if ('serviceWorker' in navigator) {
  	window.addEventListener('load', function() {
	    navigator.serviceWorker.register('sw.js').then(function(registration) {
	    	console.log('ServiceWorker registrado: ', registration.scope);
	    }).catch(function(err) {
	    	console.log('ServiceWorker falhou: ', err);
	    });
  	});
}