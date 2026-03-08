const { chromium } = require("playwright")

async function checkSeats(job){

 const browser = await chromium.launch({
  headless: true
 })

 const context = await browser.newContext({
  viewport:{ width:1280,height:800 }
 })

 const page = await context.newPage()

 await page.goto(job.url)

 await page.waitForLoadState("networkidle")

 const seats = await page.evaluate(()=>{

  // parse seat DOM layout
  const seats = document.querySelectorAll(".seat.available")

  return seats.length
 })

 await browser.close()

 return seats
}

module.exports = checkSeats