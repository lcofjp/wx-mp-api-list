const cheerio = require('cheerio')
const request = require('request')
const url = require('url')
const path = require('path')
const fs = require('fs')

const WX_MP_API_URL = 'https://mp.weixin.qq.com/debug/wxadoc/dev/api/'
const GAME_API_URL = 'https://mp.weixin.qq.com/debug/wxagame/dev/document/render/canvas/wx.createCanvas.html?t=201832'

// request(GAME_API_URL, (error, response, body) => {
//     const $ = cheerio.load(response.body)
//     const rootUl = $('ul.summary')
//     const result = parseRoot(rootUl, GAME_API_URL, cheerio)
//     saveToJsonFile('./game-api.json', result)
// })
const urlContentMap = new Map()

// 带缓存的请求页面
function getUrlWithCache(targetUrl) {
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

// 获取URL的页面内容，返回一个Promise
function getUrl(url) {
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
    const list = rootElement.children().toArray();
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
        return {
            type: $ul.length > 0 ? 'category' : 'item',
            name: name,
            url: href ? completeUrl(curUrl, href) : null,
            children: $ul.length > 0 ? parseRoot($ul, curUrl, $) : null
        }
    })
}

function parseItem(itemObject) {
    getUrlWithCache(itemObject.url).then(html => {
        return locateElement(html, 'p.page-wrapper')
    })
    .then (divWrapper => {
        return divWrapper.find('h3').length
    })
    .then (len => console.log(len))
    // const $h3 = pageContent.find('h3')
    // itemObject.description = 'xxxyyyy'
}

function traverseItems(obj) {
    obj.forEach((i) => {
        if (i.type === 'category') {
            traverseItems(i.children)
        } else {
            if (i.url) {
                parseItem(i)
            }
        }
    })
}

scrapeUrl(WX_MP_API_URL).then(obj => {
    traverseItems(obj)
})


