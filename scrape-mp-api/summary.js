const fs = require('fs')
const { saveToJsonFile } = require('./main')
// api map name as key 
// {
//   level,
//   name,
//   desc,
//   mp of {minVersion: xxx},
//   game of null,
//   plugin,
//   jssdk
// }

// 1.读取mp-api.json, 建立API Map
const apiMap = new Map()
const rootCategory = []
const mpfileContent = fs.readFileSync('./output/mp-api.json')
const gameFileContent = fs.readFileSync('./output/game-api.json')
const pluginFileContent = fs.readFileSync('./output/plugin-api.json')
const jssdkFileContent = fs.readFileSync('./output/jssdk-api.json')

const mpApiArr = JSON.parse(mpfileContent)
const gameApiArr = JSON.parse(gameFileContent)
const pluginApiArr = JSON.parse(pluginFileContent)
const jssdkApiArr = JSON.parse(jssdkFileContent)

// 取出mpApiArr中的所有item, 嵌套的对象数组 => API数组
function pickupItem(Arr, type, arr = []) {
  for(let i=0; i<Arr.length; i++) {
    const obj = Arr[i]
    if (obj.type === 'category') {
      arr = pickupItem(obj.children, type, arr)
    } else {
      const descObj = obj.detail && obj.detail.description ? { description: obj.detail.description } : {}
      const mpSupport = obj.detail && obj.detail.minVersion ?  { minVersion: obj.detail.minVersion } : {}
      const item = {
        categoryLevel: obj.categoryLevel,
        type: 'item',
        name: obj.name,
        url: obj.url,
        ...descObj,
        [type]: mpSupport
      }
      arr = [...arr, item]
    }
  }
  return arr;
} 
// 过滤掉不是api的item
function filterAsciiName(name) {
  return /^[A-Za-z1-9._]+$/.test(name)
}
function joinHierarchy(h) {
  return h.map(i => i.name).join('/')
}
function findNameIndex(arr, name) {
  const len = arr.length;
  for(let i = 0; i<len; i++) {
    if (arr[i]['name'] === name) {
      return i
    }
  }
  return -1
}
function addItemToCategory(category, level, item) {
  const cl = level || []
  if (cl.length > 0) {  // 有类目
    const cateName = cl[0].name
    const index = findNameIndex(category, cateName) // category.indexOf(cateName)
    if (index < 0) { // 没有这个类目层级，新建
      const nCat = { ...cl[0], type: 'category', children: [], subCnt: 1 }
      category.push(nCat)
      addItemToCategory(nCat.children, cl.slice(1), item)
    } else { // 在查到的层级中继续插入
      category[index].subCnt += 1
      addItemToCategory(category[index].children, cl.slice(1), item)
    }
  } else {
    delete item.categoryLevel
    category.push(item)
  }
}

const mpApiList = pickupItem(mpApiArr, 'mp')
const gameApiList = pickupItem(gameApiArr, 'game')

const fMpApiList = mpApiList.filter(item => filterAsciiName(item.name))
const fGameApiList = gameApiList.filter(item => filterAsciiName(item.name))
const fJssdkApiList = jssdkApiArr.filter(item => filterAsciiName(item.name))
const fPluginApiList = pluginApiArr.filter(item => filterAsciiName(item.name))

function combineListToMap(map, list, type) {
  list.forEach(i => {
    name = i.name
    const v = map.get(name) || map.get('wx.' + name) || map.get(name.replace('miniProgram.', ''))
    if (v !== undefined) {
      // console.log(name, '::', joinHierarchy(v.categoryLevel), joinHierarchy(i.categoryLevel))
      v[type] = i.minVersion ? {minVersion: i.minVersion} : {}
    } else {
      const item = {
        name: i.name,
        type: 'item',
        description: i.description,
        categoryLevel: i.categoryLevel || [],
        url: i.url,
        [type]: i.minVersion ? {minVersion: i.minVersion} : {}
      }
      map.set(name, item)
    }
  })
}

combineListToMap(apiMap, fMpApiList, 'mp')
combineListToMap(apiMap, fGameApiList, 'game')
combineListToMap(apiMap, fJssdkApiList, 'jssdk')
combineListToMap(apiMap, fPluginApiList, 'plugin')

for (const [k,v] of apiMap) {
  addItemToCategory(rootCategory, v.categoryLevel, v)
}

// saveToJsonFile('./output/summary.json', rootCategory)


