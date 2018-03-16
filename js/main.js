
function fetchJson(jsonUrl) {
  return fetch(jsonUrl).then(res => res.json())
}

fetchJson('/wx-mp-api-list/scrape-mp-api/output/summary.json')
.then(apiArr => {
  let trArr = apiArr.map(obj => rowOfObject(obj, depthOfObj(obj)).map(s => `<tr>${s}`).join(''))
  trArr = flatten(trArr)
  const header = '<tr><th colspan="2">类别</th><th>名称</th><th>功能</th><th>小程序</th><th>小游戏</th><th>JSSDK</th><th>plugin</th></tr>'
  $('<table></table>').html(header + trArr.join('')).appendTo('#root')
})

function depthOfArr(arr) {
  for(let i=0; i<arr.length; i++) {
    const obj = arr[i]
    if (obj.type === 'category') {
      const a = []
      a.push(depthOfArr(obj.children) + 1)
      return Math.max.apply(null, a)
    } else {
      return 0
    }
  }
}
function depthOfObj(obj) {
  if (obj.type === 'category') {
    return depthOfArr(obj.children) + 1
  } else {
    return 0
  }
}

function colspan(depth) {
  if (depth === 2) {
    return 1
  } else {
    return 2
  }
}
function rowspan(obj) {
  return obj.subCnt
}
function sps(obj) {
  if (obj) {
    if (obj.minVersion) {
      return `<div class="div-center">✔</div><div class="div-center">(${obj.minVersion})</div>`
    } else {
      return '<div class="div-center">✔</div>'
    }
  } else {
    return '<div class="div-center">✘</div>'
  }
}
function linkOfItem(item) {
  if (item.url) {
    return `<a href="${item.url}">${item.name}</a>`
  } else {
    return item.name
  }
}
function tdOfItem(item) {
  const desc = item.description || ''
  const mp = sps(item.mp)
  const game = sps(item.game)
  const jssdk = sps(item.jssdk)
  const plugin = sps(item.plugin)
  return `<td>${linkOfItem(item)}</td><td>${desc}</td><td>${mp}</td><td>${game}</td><td>${jssdk}</td><td>${plugin}</td>`
}
function flatten(arr) {
  let a = []
  arr.forEach(e => {
    if (e instanceof Array) {
      a = [...a, ...e]
    } else {
      a.push(e)
    }
  })
  return a
}
// 给出一个对象，返回一组tr
function rowOfObject(obj, level) {
  if (obj.type === 'item') {
    const pad = level === 0 ? '<td colspan="2"></td>' : ''
    return [`${pad}${tdOfItem(obj)}`]
  } else {
    let arr = obj.children.map(o => {
      return rowOfObject(o, level)
    })
    const td = `<td rowspan="${rowspan(obj)}" colspan="${colspan(level)}"><a href="${obj.url}">${obj.name}</a></td>`
    arr = flatten(arr)
    arr[0] = td + arr[0]
    return arr
  }
}
