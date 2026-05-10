const { JSDOM } = require('jsdom'); 
const dom = new JSDOM('<div id="wrapper_ovr_A"></div><div id="wrapper_ovr_mac_B"></div>'); 
const mat = dom.window.document.querySelectorAll('[id^="wrapper_ovr_"]:not([id^="wrapper_ovr_mac_"])'); 
console.log(mat.length);
