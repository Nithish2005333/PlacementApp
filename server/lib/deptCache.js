let cachedDepartments = []
let updatedAt = 0

function setDepartments(list) {
  if (Array.isArray(list)) {
    cachedDepartments = list.map(d => ({ name: d.name, fullName: d.fullName || d.name }))
    updatedAt = Date.now()
  }
}

function getDepartments() {
  return { list: cachedDepartments, updatedAt }
}

module.exports = { setDepartments, getDepartments }


