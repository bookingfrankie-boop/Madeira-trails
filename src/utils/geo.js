const radians = (degrees) => (degrees * Math.PI) / 180

export function distanceBetweenCoordinates(first, second) {
  const latitudeDelta = radians(second[1] - first[1])
  const longitudeDelta = radians(second[0] - first[0])
  const arc = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(radians(first[1])) * Math.cos(radians(second[1])) * Math.sin(longitudeDelta / 2) ** 2
  return 6371000 * 2 * Math.atan2(Math.sqrt(arc), Math.sqrt(1 - arc))
}

export function distanceAlongRoute(points) {
  return points.slice(1).reduce(
    (total, point, index) => total + distanceBetweenCoordinates(points[index], point),
    0,
  )
}