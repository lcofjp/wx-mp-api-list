const { getUrl } = require('./page-request')
const cheerio = require('cheerio')

function zipObject(fields, values) {
  const len = Math.min(fields.length, values.length)
  const obj = {}
  for (let i = 0; i < len; i++) {
    obj[fields[i]] = values[i]
  }
  return obj;
}

function parseTable($table, fields) {
  return $table.children().toArray().map((e) => {
    const $tr = cheerio(e)
    const tds = $tr.children().toArray().map(e => cheerio(e).text())
    return zipObject(fields, tds)
  })
}

function getJssdkApi(url) {
  return getUrl(url)
    .then(html => {
      const $ = cheerio.load(html)
      const tableArr = $('table tbody').toArray()
      const t1 = parseTable(cheerio(tableArr[1]), ['name', 'desc', 'minVersion'])
      const t2 = parseTable(cheerio(tableArr[2]), ['category', 'desc', 'name'])
      return [...t1, ...t2]
    })
}

function getPluginApi(url) {
  return getUrl(url)
    .then(html => {
      const $ = cheerio.load(html)
      const ta = parseTable($('table tbody'), ['name', 'minVersion'])
      return ta
    })
}

module.exports = {
  getJssdkApi,
  getPluginApi
}
