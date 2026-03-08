const { Queue } = require("bullmq")
const connection = { host: "127.0.0.1", port: 6379 }

const seatQueue = new Queue("seat-check", { connection })

module.exports = seatQueue