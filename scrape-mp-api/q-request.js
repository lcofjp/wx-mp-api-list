
const { getUrlWithCache } = require('./page-request')

const MAX_Q_CNT = 10
const q = []
let reqCnt = 0

function waitSemaphore(resolve) {
  return new Promise(resolve => {
    if (reqCnt < MAX_Q_CNT) {
      reqCnt += 1
      resolve(reqCnt)
    } else {
      q.unshift(resolve)
    }
  })
}
function releaseSemaphore() {
  if (q.length > 0) {
    q.pop()()
  } else {
    reqCnt -= 1
  }
}

function qRequest(url) {
  return new Promise((resolve, reject) => {
    waitSemaphore()
      .then(() => {
        return getUrlWithCache(url)
      })
      .then((res) => {
        resolve(res)
        releaseSemaphore()
      })
      .catch(err => {
        reject(err)
        releaseSemaphore()
      })
  })
}

function qRequestList(list, urlLocator, callback) {
  let qCnt = 0
  return new Promise(resolve => {
    for (const e of list) {
      qCnt += 1
      qRequest(urlLocator(e))
        .then(res => callback(e, res), err => console.log(err))
        .then(() => {
          qCnt -= 1
          console.log(`req: ${qCnt} completed!`)
          if (qCnt === 0) {
            resolve(0)
          }
        })
        .catch(err => {
          qCnt -= 1
          console.log(`req: ${qCnt} Error!`)
          if (qCnt === 0) {
            resolve(0)
          }
        })
    }
  })
}

module.exports = {
  qRequest,
  qRequestList
}
