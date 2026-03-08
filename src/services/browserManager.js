const { chromium } = require("playwright")

let browser
let context

async function getContext(){

 if(!browser){

  console.log("Launching shared browser...")

  browser = await chromium.launch({
   headless:true
  })

  context = await browser.newContext({
   viewport:{ width:1280, height:900 },
   geolocation:{
    latitude:13.0827,
    longitude:80.2707
   },
   permissions:["geolocation"]
  })

 }

 return context
}

module.exports = { getContext }