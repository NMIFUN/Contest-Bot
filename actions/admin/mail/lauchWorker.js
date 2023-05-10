const { Worker } = require('worker_threads')
const path = require('path')

const lauchWorker = (id) => {
  const worker = new Worker(path.resolve(__dirname) + '/worker.js', {
    workerData: `${id}`,
    env: process.env
  })
  worker.on('message', async () => worker.terminate())
}

module.exports = lauchWorker
