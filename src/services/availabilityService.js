// async function checkAvailability(page, job){

//  try{

//   console.log("=================================")
//   console.log("Checking:", job.movie_name)

//   page.setDefaultTimeout(30000)

//   await page.goto("https://www.district.in/movies",{
//    waitUntil:"domcontentloaded"
//   })

//   await page.waitForTimeout(4000)

//   const movie = page.locator(`text=${job.movie_name}`).first()

//   if(!(await movie.isVisible().catch(()=>false))){
//    return { totalSeats:0, category:null, availableCategorySeats:0, blockedCategorySeats:0 }
//   }

//   await movie.click({ force:true })

//   await page.waitForTimeout(5000)

//   await page.waitForSelector(
//    "li[class*='MovieSessionsListing_movieSessions']",
//    { timeout:15000 }
//   )

//   const theatreKeyword = job.theatre_name.split(",")[0]

//   const theatreBlock = page.locator(
//    "li[class*='MovieSessionsListing_movieSessions']",
//    { hasText: theatreKeyword }
//   ).first()

//   if((await theatreBlock.count()) === 0){
//    return { totalSeats:0, category:null, availableCategorySeats:0, blockedCategorySeats:0 }
//   }

//   const showtimeBtn = theatreBlock.locator(
//    "li[role='button']",
//    { hasText: job.show_time }
//   ).first()

//   if(!(await showtimeBtn.isVisible().catch(()=>false))){
//    return { totalSeats:0, category:null, availableCategorySeats:0, blockedCategorySeats:0 }
//   }

//   await showtimeBtn.click({ force:true })

// //   await page.waitForSelector(
// //    "span[aria-label*='seat']",
// //    { timeout:20000 }
// //   )

// await page.waitForSelector("[aria-label*='seat']", { timeout:20000 })

//   const totalSeats = await page.locator("span.available").count()

//   let category = null

//   if(job.theatre_name.includes("AGS")){
//    category = "PEARL"
//   }

//   if(job.theatre_name.includes("INOX")){
//    category = "EXECUTIVE"
//   }

//   let availableCategorySeats = 0
//   let blockedCategorySeats = 0

//   if(category){

//    const seats = await page.locator("span[aria-label*='class']").all()

//    for(const seat of seats){

//     const label = ((await seat.getAttribute("aria-label")) || "").toLowerCase()

//     if(!label.includes(`class ${category.toLowerCase()}`)) continue

//     if(label.startsWith("available seat")) availableCategorySeats++
//     if(label.startsWith("unavailable seat")) blockedCategorySeats++

//    }
//   }

//   return {
//    totalSeats,
//    category,
//    availableCategorySeats,
//    blockedCategorySeats
//   }

//  }catch(err){

//   console.log("Seat check failed:", err.message)

//   return { totalSeats:0, category:null, availableCategorySeats:0, blockedCategorySeats:0 }

//  }
// }

// module.exports = checkAvailability


async function checkAvailability(page, job){

 try{

  console.log("=================================")
  console.log("Checking:", job.movie_name)

  page.setDefaultTimeout(30000)

  await page.goto("https://www.district.in/movies",{
   waitUntil:"domcontentloaded"
  })

  await page.waitForTimeout(4000)

  const movie = page.locator(`text=${job.movie_name}`).first()

  if(!(await movie.isVisible().catch(()=>false))){
   return { totalSeats:0, category:null, availableCategorySeats:0, blockedCategorySeats:0 }
  }

  await movie.click({ force:true })

  await page.waitForTimeout(4000)

  await page.waitForSelector(
   "li[class*='MovieSessionsListing_movieSessions']",
   { timeout:15000 }
  )

  const theatreKeyword = job.theatre_name.split(",")[0]

  const theatreBlock = page.locator(
   "li[class*='MovieSessionsListing_movieSessions']",
   { hasText: theatreKeyword }
  ).first()

  if((await theatreBlock.count()) === 0){
   return { totalSeats:0, category:null, availableCategorySeats:0, blockedCategorySeats:0 }
  }

  const showtimeBtn = theatreBlock.locator(
   "li[role='button']",
   { hasText: job.show_time }
  ).first()

  if(!(await showtimeBtn.isVisible().catch(()=>false))){
   return { totalSeats:0, category:null, availableCategorySeats:0, blockedCategorySeats:0 }
  }

  await showtimeBtn.click({ force:true })

  await page.waitForSelector("[aria-label*='seat']", { timeout:20000 })

  const totalSeats = await page.locator("span.available").count()

  let category = null

  if(job.theatre_name.includes("AGS")){
   category = "PEARL"
  }

  if(job.theatre_name.includes("INOX")){
   category = "EXECUTIVE"
  }

  let availableCategorySeats = 0
  let blockedCategorySeats = 0

  if(category){

   const seats = await page.locator("span[aria-label*='class']").all()

   for(const seat of seats){

    const label = ((await seat.getAttribute("aria-label")) || "").toLowerCase()

    if(!label.includes(`class ${category.toLowerCase()}`)) continue

    if(label.startsWith("available seat")) availableCategorySeats++
    if(label.startsWith("unavailable seat")) blockedCategorySeats++

   }

  }

  return {
   totalSeats,
   category,
   availableCategorySeats,
   blockedCategorySeats
  }

 }catch(err){

  console.log("Seat check failed:", err.message)

  return { totalSeats:0, category:null, availableCategorySeats:0, blockedCategorySeats:0 }

 }

}

module.exports = checkAvailability