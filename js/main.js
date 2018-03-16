
function fetchJson(jsonUrl) {
  return fetch(jsonUrl).then(res => res.json())
}

fetchJson('/wx-mp-api-list/scrape-mp-api/output/plugin-api.json')
.then(pluginApiArr => {
  pluginApiArr.forEach(e => {
    console.log(e.name, e.minVersion)
  })
})
