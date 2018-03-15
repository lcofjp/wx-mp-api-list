const cheerio = require('cheerio')
const request = require('request')
const url = require('url')
const path = require('path')
const fs = require('fs')

const { getUrlWithCache, getUrl } = require('./page-request')
const { qRequest, qRequestList } = require('./q-request')

const WX_MP_API_URL = 'https://mp.weixin.qq.com/debug/wxadoc/dev/api/'
const GAME_API_URL = 'https://mp.weixin.qq.com/debug/wxagame/dev/document/render/canvas/wx.createCanvas.html?t=201832'

// 抓取页面的入口函数
function scrapeUrl(url) {
  return getUrl(url)
    .then(body => {
      // const $ = cheerio.load(body)
      // const rootUl  = $('ul.summary')
      return parseRoot(locateElement(body, 'ul.summary'), url, cheerio)
    })
}

// 取得指定位置的cheerio元素
function locateElement(content, selector) {
  return cheerio(selector, content)
}

// 把对象保存为json文件
function saveToJsonFile(fileName, obj) {
  const jsonStr = JSON.stringify(obj, null, ' ')
  fs.writeFileSync(fileName, jsonStr, { encoding: 'UTF8' })
}

// 根据当前url和相对url计算合并后的url
function completeUrl(hostUrl, relativeUrl) {
  return url.resolve(hostUrl, relativeUrl)
}

// (rootElement : ulElement, curUrl) => {}
function parseRoot(rootElement, curUrl, $) {
  const list = rootElement.children().toArray()
  return list.map((li) => { // 类目层的li应该包含a和ul子元素，叶子节点只包含一个a元素，不论哪一个，这个li元素都不是重点
    // anchor element
    const $li = $(li)
    const $anchor = $li.children('a')
    const $ul = $li.children('ul')
    let name = $anchor.text().trim()
    let href = $anchor.attr('href')
    if ($anchor.length === 0) {
      const $span = $li.children('span')
      if ($span.length > 0) {
        name = $span.text().trim()
        href = null
      }
    }
    const childrenObj = ($ul) => {
      if ($ul.length > 0) {
        return {
          children: parseRoot($ul, curUrl, $)
        }
      } else {
        return {}
      }
    }
    return {
      type: $ul.length > 0 ? 'category' : 'item',
      name: name,
      url: href ? completeUrl(curUrl, href) : null,
      ...childrenObj($ul)
    }
  })
}

function parseItem(itemObject, html) {
  const divWrapper = locateElement(html, '.page-wrapper')
  divWrapper.find('h3').toArray().some(v => {
    try {
      const title = cheerio(v).text().trim()
      const limit = cheerio(v).next('blockquote').text().trim().match(/\d+.\d+.\d+/)
      const desc = cheerio(v).nextAll('p').first().text().trim()
      if (title.indexOf(itemObject.name) >= 0) {
        itemObject.detail = {
          description: desc,
          funcProto: title
        }
        if (limit) {
          itemObject.detail.minVersion = limit[0]
        }
        return true
      }
      return false
    } catch (e) {
      console.log(e)
    }

  })
  // .then (len => console.log(len))
  // const $h3 = pageContent.find('h3')
  // itemObject.description = 'xxxyyyy'
}

function* traverseItems(obj, categoryLevel) {
  for (let j = 0; j < obj.length; j++) {
    const i = obj[j]
    if (i.type === 'category') {
      yield* traverseItems(i.children, [...categoryLevel, { name: i.name, url: i.url }])
    } else {
      if (i.url) {
        i.categoryLevel = categoryLevel
        yield i
      }
    }
  }
}


// scrapeUrl(WX_MP_API_URL).then(obj => {
//   const items = traverseItems(obj, [])
//   const itemList = [...items]
//   qRequestList(itemList, e => e.url, parseItem)
//     .then(n => console.log('complete!'))
//     // .then(() => {
//     //   for(let i=0; i<itemList.length; i++) {
//     //     const item = itemList[i]
//     //     console.log(item.categoryLevel, item.name, item.detail.minVersion, item.detail.description)
//     //   }
//     // })
//     .then(() => {
//       saveToJsonFile('mp-api.json', obj)
//     })
// })

function saveUrlApiToJsonFile(url, filename) {
  scrapeUrl(url).then(obj => {
    const items = traverseItems(obj, [])
    const itemList = [...items]
    qRequestList(itemList, e => e.url, parseItem)
    .then(() => {
      saveToJsonFile(filename, obj)
    })
  })
}

saveUrlApiToJsonFile(WX_MP_API_URL, 'mp-api.json')
saveUrlApiToJsonFile(GAME_API_URL, 'game-api.json')

//  const testUrl = 'https://mp.weixin.qq.com/debug/wxadoc/dev/api/api-react.html#wxshowloadingobject'

// getUrl(testUrl).then(html => {
//     fs.writeFileSync('./testHtmlContent.js', html, { encoding: 'UTF8' })
// })

// function getTestHtmlContent() {
//     return fs.readFileSync('./testHtmlContent.txt', { encoding: 'UTF8' })
// }

// const html = getTestHtmlContent()

// const wrapper = locateElement(html, '.page-wrapper')

// console.log(wrapper.find('h3').text())
