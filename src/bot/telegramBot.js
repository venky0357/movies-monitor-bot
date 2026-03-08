// require("dotenv").config()

// const TelegramBot = require("node-telegram-bot-api")
// const pool = require("../db/db")

// const bot = new TelegramBot(process.env.BOT_TOKEN,{ polling:true })

// const userState = {}

// const THEATRES = [
//  "AGS Cinemas OMR, Navalur, Chennai",
//  "INOX The Marina Mall OMR, Egatoor, Chennai"
// ]

// /* START */

// bot.onText(/\/start/, msg => {

//  const chatId = msg.chat.id

//  bot.sendMessage(chatId,
// `🎬 Chennai Seat Monitor

// Supported Theatres

// 1️⃣ AGS Cinemas OMR Navalur
// 2️⃣ INOX Marina Mall OMR

// Commands
// /monitor → Start monitoring
// /stop → Stop monitoring
// /clear → Clear all monitors`)
// })


// /* MONITOR COMMAND */

// bot.onText(/\/monitor/, msg => {

//  const chatId = msg.chat.id

//  userState[chatId] = { step:"movie" }

//  bot.sendMessage(chatId,"Enter movie name")
// })


// /* STOP COMMAND */

// bot.onText(/\/stop/, async msg => {

//  const chatId = msg.chat.id

//  try{

//   const result = await pool.query(
//    "DELETE FROM monitors WHERE user_id=$1",
//    [chatId]
//   )

//   if(result.rowCount === 0){
//    return bot.sendMessage(chatId,"⚠️ No monitoring jobs found.")
//   }

//   bot.sendMessage(chatId,
// `🛑 Monitoring stopped

// Removed jobs: ${result.rowCount}`)

//  }catch(err){

//   console.log("Stop error:", err)

//   bot.sendMessage(chatId,"❌ Failed to stop monitoring")
//  }

// })


// /* CLEAR COMMAND (ADMIN STYLE) */

// bot.onText(/\/clear/, async msg => {

//  const chatId = msg.chat.id

//  try{

//   const result = await pool.query("DELETE FROM monitors")

//   bot.sendMessage(chatId,
// `🧹 All monitors cleared

// Deleted rows: ${result.rowCount}`)

//  }catch(err){

//   console.log("Clear error:", err)

//   bot.sendMessage(chatId,"❌ Failed to clear monitors")
//  }

// })


// /* MESSAGE HANDLER */

// bot.on("message", async msg => {

//  const chatId = msg.chat.id
//  const text = msg.text

//  if(text.startsWith("/")) return

//  const state = userState[chatId]

//  if(!state) return


//  /* MOVIE STEP */

//  if(state.step === "movie"){

//   state.movie = text
//   state.step = "date"

//   return bot.sendMessage(chatId,"Enter date YYYY-MM-DD")
//  }


//  /* DATE STEP */

//  if(state.step === "date"){

//   state.date = text
//   state.step = "time"

//   return bot.sendMessage(chatId,"Enter show time (example: 09:30 PM)")
//  }


//  /* TIME STEP */

//  if(state.step === "time"){

//   state.time = text

//   for(const theatre of THEATRES){

//    await pool.query(
//    `INSERT INTO monitors
//    (user_id, movie_name, theatre_name, show_date, show_time)
//    VALUES ($1,$2,$3,$4,$5)`,
//    [
//     chatId,
//     state.movie,
//     theatre,
//     state.date,
//     state.time
//    ])
//   }

//   bot.sendMessage(
//    chatId,
//    "✅ Monitoring started for AGS Navalur and INOX Marina Mall"
//   )

//   delete userState[chatId]
//  }

// })

// module.exports = bot


require("dotenv").config()

const TelegramBot = require("node-telegram-bot-api")
const pool = require("../db/db")
const { getContext } = require("../services/browserManager")

const bot = new TelegramBot(process.env.BOT_TOKEN,{ polling:true })

const userState = {}

const THEATRES = [
 "AGS Cinemas OMR, Navalur, Chennai",
 "INOX The Marina Mall OMR, Egatoor, Chennai"
]


/* START */

bot.onText(/\/start/, msg => {

 const chatId = msg.chat.id

 bot.sendMessage(chatId,
`🎬 Chennai Seat Monitor

Supported Theatres

1️⃣ AGS Cinemas OMR Navalur
2️⃣ INOX Marina Mall

Commands
/monitor → Start monitoring
/stop → Stop monitoring
/clear → Clear all monitors`)
})


/* MONITOR COMMAND */

bot.onText(/\/monitor/, async msg => {

 const chatId = msg.chat.id

 const context = await getContext()
 const page = await context.newPage()

 try{

  await page.goto("https://www.district.in/movies",{
   waitUntil:"domcontentloaded"
  })

  await page.waitForTimeout(5000)

  const movies = await page.locator("h5.dds-tracking-tight").allTextContents()

  const uniqueMovies = [...new Set(movies)].slice(0,10)

  console.log("Movies:",uniqueMovies)

  if(uniqueMovies.length === 0){
   return bot.sendMessage(chatId,"❌ No movies found")
  }

  const buttons = uniqueMovies.map(movie => [
   { text:movie, callback_data:`movie_${movie}` }
  ])

  bot.sendMessage(chatId,"🎬 Select Movie",{
   reply_markup:{ inline_keyboard:buttons }
  })

 }catch(err){

  console.log("Movie fetch error:",err)

  bot.sendMessage(chatId,"❌ Failed to fetch movies")

 }finally{

  await page.close()

 }

})


/* STOP */

bot.onText(/\/stop/, async msg => {

 const chatId = msg.chat.id

 try{

  const result = await pool.query(
   "DELETE FROM monitors WHERE user_id=$1",
   [chatId]
  )

  if(result.rowCount === 0){
   return bot.sendMessage(chatId,"⚠️ No monitoring jobs found.")
  }

  bot.sendMessage(chatId,
`🛑 Monitoring stopped

Removed jobs: ${result.rowCount}`)

 }catch(err){

  console.log(err)

  bot.sendMessage(chatId,"❌ Failed to stop monitoring")
 }

})


/* CLEAR */

bot.onText(/\/clear/, async msg => {

 const chatId = msg.chat.id

 try{

  const result = await pool.query("DELETE FROM monitors")

  bot.sendMessage(chatId,
`🧹 All monitors cleared

Deleted rows: ${result.rowCount}`)

 }catch(err){

  console.log(err)

  bot.sendMessage(chatId,"❌ Failed to clear monitors")
 }

})


/* BUTTON HANDLER */

bot.on("callback_query", async query => {

 const chatId = query.message.chat.id
 const data = query.data


 /* MOVIE SELECT */

 if(data.startsWith("movie_")){

  const movie = data.replace("movie_","")

  userState[chatId] = { movie }

  const buttons = THEATRES.map(t => [
   {
    text:t.split(",")[0],
    callback_data:`theatre_${t}`
   }
  ])

  return bot.sendMessage(chatId,"🎥 Select Theatre",{
   reply_markup:{ inline_keyboard:buttons }
  })
 }


 /* THEATRE SELECT */

 if(data.startsWith("theatre_")){

  const theatre = data.replace("theatre_","")

  userState[chatId].theatre = theatre

  const context = await getContext()
  const page = await context.newPage()

  try{

   const movie = userState[chatId].movie

   await page.goto("https://www.district.in/movies")

   await page.waitForTimeout(4000)

   const movieLocator = page.locator(`text=${movie}`).first()

   await movieLocator.click({ force:true })

   await page.waitForSelector(
    "li[class*='MovieSessionsListing_movieSessions']",
    { timeout:15000 }
   )

   const theatreKeyword = theatre.split(",")[0]

   const theatreBlock = page.locator(
    "li[class*='MovieSessionsListing_movieSessions']",
    { hasText: theatreKeyword }
   ).first()

   const shows = await theatreBlock
    .locator("li[role='button']")
    .allTextContents()

   const buttons = shows.map(show => [
    { text:show, callback_data:`show_${show}` }
   ])

   bot.sendMessage(chatId,"⏰ Select Showtime",{
    reply_markup:{ inline_keyboard:buttons }
   })

  }catch(err){

   console.log("Showtime error:",err)

   bot.sendMessage(chatId,"❌ Failed to fetch showtimes")

  }finally{

   await page.close()

  }

 }


 /* SHOWTIME */

 if(data.startsWith("show_")){

  const show = data.replace("show_","")

  userState[chatId].time = show

  return bot.sendMessage(chatId,"📅 Select Date",{
   reply_markup:{
    inline_keyboard:[
     [
      { text:"Today", callback_data:"date_today" },
      { text:"Tomorrow", callback_data:"date_tomorrow" }
     ]
    ]
   }
  })

 }


 /* DATE */

 if(data === "date_today" || data === "date_tomorrow"){

  const state = userState[chatId]

  let date = new Date()

  if(data === "date_tomorrow"){
   date.setDate(date.getDate()+1)
  }

  const showDate = date.toISOString().split("T")[0]

  try{

   await pool.query(
   `INSERT INTO monitors
   (user_id,movie_name,theatre_name,show_date,show_time)
   VALUES ($1,$2,$3,$4,$5)`,
   [
    chatId,
    state.movie,
    state.theatre,
    showDate,
    state.time
   ])

   bot.sendMessage(chatId,
`✅ Monitoring Started

🎬 Movie: ${state.movie}
🎥 Theatre: ${state.theatre}
⏰ Showtime: ${state.time}
📅 Date: ${showDate}`)

  }catch(err){

   console.log(err)

   bot.sendMessage(chatId,"❌ Failed to start monitoring")

  }

  delete userState[chatId]

 }

})


module.exports = bot