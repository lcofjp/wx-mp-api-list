const request = require('request')
const urlContentMap = new Map()

// 获取URL的页面内容，返回一个Promise
function getUrl (url) {
  return new Promise((resolve, reject) => {
    request(url, (error, response, body) => {
      if (error) {
        reject(error)
      } else if (response.statusCode !== 200) {
        reject(new Error('Not 200 OK!'))
      } else {
        resolve(body)
      }
    })
  })
}

// 带缓存的请求页面
function getUrlWithCache (targetUrl) {
  return new Promise((resolve, reject) => {
    const urlKey = targetUrl.split('#')[0].toLowerCase()
    let content = urlContentMap.get(urlKey)
    if (content) {
      resolve(content)
    } else {
      getUrl(targetUrl)
        .then(body => {
          urlContentMap.set(urlKey, body)
          resolve(body)
        })
        .catch(error => reject(error))
    }
  })
}

module.exports = {
  getUrlWithCache,
  getUrl
}
