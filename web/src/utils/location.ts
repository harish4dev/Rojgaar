export interface LocationValue {
  locality: string
  city: string
  location_label: string
  location_lat?: number
  location_lng?: number
}

export function emptyLocation(): LocationValue {
  return { locality: '', city: '', location_label: '' }
}

export function buildLocationLabel(locality: string, city: string): string {
  const loc = locality.trim()
  const c = city.trim()
  if (loc && c) return `${loc}, ${c}`
  return c || loc
}

/** Browser geolocation with fast cached position first. */
export function detectBrowserLocation(): Promise<GeolocationCoordinates> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(pos.coords),
      (err) => reject(err),
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 600000 },
    )
  })
}
