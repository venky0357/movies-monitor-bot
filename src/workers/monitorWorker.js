// require("dotenv").config()

// const pool = require("../db/db")
// const checkAvailability = require("../services/availabilityService")
// const TelegramBot = require("node-telegram-bot-api")

// const bot = new TelegramBot(process.env.BOT_TOKEN)

// async function monitor(){

//  try{

//   const res = await pool.query(
//    "SELECT * FROM monitors WHERE status='active'"
//   )

//   const jobs = res.rows

//   const ALLOWED_THEATRES = [
//    "AGS Cinemas OMR, Navalur, Chennai",
//    "INOX The Marina Mall OMR, Egatoor, Chennai"
//   ]

//   for(const job of jobs){

//    if(!ALLOWED_THEATRES.includes(job.theatre_name)){
//     console.log("Skipping unsupported theatre:", job.theatre_name)
//     continue
//    }

//    let result

//    try{

//     result = await checkAvailability(job)

//    }catch(err){

//     console.log("Seat check failed for job:", job.id, err.message)
//     continue
//    }

//    const totalSeats = result.totalSeats
//    const category = result.category
//    const availableCategorySeats = result.availableCategorySeats
//    const blockedCategorySeats = result.blockedCategorySeats

//    console.log(
//     `Checked ${job.movie_name} at ${job.theatre_name} → Total: ${totalSeats}`
//    )

//    /* TOTAL SEATS ALERT */

//    if(totalSeats > job.last_available){

//     await bot.sendMessage(
//      job.user_id,
// `🎟 Seats Available!

// Movie: ${job.movie_name}
// Theatre: ${job.theatre_name}
// Showtime: ${job.show_time}

// Total Available Seats: ${totalSeats}`
//     )

//     await pool.query(
//      "UPDATE monitors SET last_available=$1 WHERE id=$2",
//      [totalSeats, job.id]
//     )
//    }

//    /* CATEGORY ALERT ONLY WHEN AVAILABLE SEATS INCREASE */

// if(category){

//  const previous = job.last_category_available

//  if(previous === null || availableCategorySeats !== previous){

//   await bot.sendMessage(
//    job.user_id,
// `🔥 ${category} Seats Update

// Movie: ${job.movie_name}
// Theatre: ${job.theatre_name}
// Showtime: ${job.show_time}

// Available ${category}: ${availableCategorySeats}
// Blocked ${category}: ${blockedCategorySeats}`
//   )

//   await pool.query(
//    "UPDATE monitors SET last_category_available=$1 WHERE id=$2",
//    [availableCategorySeats, job.id]
//   )

//  }

// }


//   }

//  }catch(err){

//   console.log("Worker error:", err)

//  }

// }

// setInterval(monitor, 20000)

// console.log("Seat worker started 🚀")



require("dotenv").config()

const pool = require("../db/db")
const checkAvailability = require("../services/availabilityService")
const TelegramBot = require("node-telegram-bot-api")
const { getContext } = require("../services/browserManager")

const bot = new TelegramBot(process.env.BOT_TOKEN)

async function monitor(){

 try{

  const context = await getContext()

  const res = await pool.query(
   "SELECT * FROM monitors WHERE status='active'"
  )

  const jobs = res.rows

  const ALLOWED_THEATRES = [
   "AGS Cinemas OMR, Navalur, Chennai",
   "INOX The Marina Mall OMR, Egatoor, Chennai"
  ]

  for(const job of jobs){

   if(!ALLOWED_THEATRES.includes(job.theatre_name)){
    console.log("Skipping unsupported theatre:", job.theatre_name)
    continue
   }

   const page = await context.newPage()

   let result

   try{

    result = await checkAvailability(page, job)

   }catch(err){

    console.log("Seat check failed for job:", job.id, err.message)
    await page.close()
    continue
   }

   await page.close()

   const totalSeats = result.totalSeats
   const category = result.category
   const availableCategorySeats = result.availableCategorySeats
   const blockedCategorySeats = result.blockedCategorySeats

   console.log(
    `Checked ${job.movie_name} at ${job.theatre_name} → Total: ${totalSeats}`
   )

   if(totalSeats > job.last_available){

    await bot.sendMessage(
     job.user_id,
`🎟 Seats Available!

Movie: ${job.movie_name}
Theatre: ${job.theatre_name}
Showtime: ${job.show_time}

Total Available Seats: ${totalSeats}`
    )

    await pool.query(
     "UPDATE monitors SET last_available=$1 WHERE id=$2",
     [totalSeats, job.id]
    )
   }

   if(category){

    const previous = job.last_category_available

    if(previous === null || availableCategorySeats !== previous){

     await bot.sendMessage(
      job.user_id,
`🔥 ${category} Seats Update

Movie: ${job.movie_name}
Theatre: ${job.theatre_name}
Showtime: ${job.show_time}

Available ${category}: ${availableCategorySeats}
Blocked ${category}: ${blockedCategorySeats}`
     )

     await pool.query(
      "UPDATE monitors SET last_category_available=$1 WHERE id=$2",
      [availableCategorySeats, job.id]
     )
    }
   }

  }

 }catch(err){

  console.log("Worker error:", err)

 }

}

setInterval(monitor, 20000)

console.log("Seat worker started 🚀")