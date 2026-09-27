const STORAGE_KEY = 'madeira-trails:activities'

export function getActivities() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

export function saveActivity(activity) {
  const activities = getActivities()
  localStorage.setItem(STORAGE_KEY, JSON.stringify([activity, ...activities]))
}