// Small Leaflet map for the room: a dot per neighborhood people are coming
// from, and a dashed circle around the host's area. Dots sit at neighborhood
// centers, so the map never shows anything more precise than the member list.

import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { RoomView } from './shared/api'
import { ANYWHERE, getNeighborhood } from './shared/neighborhoods'

const NYC_CENTER: L.LatLngTuple = [40.73, -73.97]
const AREA_RADIUS_METERS = 900

export interface RoomMap {
  update(room: RoomView): void
  destroy(): void
}

const cssVar = (name: string, fallback: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback

export function createRoomMap(container: HTMLElement, room: RoomView): RoomMap {
  // On phones, one-finger drags should scroll the page, not get stuck in the map.
  const touch = window.matchMedia('(pointer: coarse)').matches
  const accent = cssVar('--accent', '#e8572a')
  const ink = cssVar('--text', '#1f1a17')

  const map = L.map(container, {
    center: NYC_CENTER,
    zoom: 12,
    zoomControl: !touch,
    dragging: !touch,
    scrollWheelZoom: false,
  })

  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    subdomains: 'abcd',
    maxZoom: 18,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
  }).addTo(map)

  const layer = L.layerGroup().addTo(map)
  let lastDrawn = ''

  function update(room: RoomView) {
    // Group names by neighborhood so friends from the same place share one dot.
    const byPlace = new Map<string, string[]>()
    for (const m of room.members) {
      const names = byPlace.get(m.from) ?? []
      names.push(m.you ? `${m.name} (you)` : m.name)
      byPlace.set(m.from, names)
    }

    const signature = JSON.stringify([room.area, [...byPlace]])
    if (signature === lastDrawn) return // nothing changed since the last poll
    lastDrawn = signature
    layer.clearLayers()

    const bounds = L.latLngBounds([])

    const area = room.area === ANYWHERE ? undefined : getNeighborhood(room.area)
    if (area) {
      const circle = L.circle([area.lat, area.lng], {
        radius: AREA_RADIUS_METERS,
        color: accent,
        weight: 1.5,
        dashArray: '4 4',
        fillColor: accent,
        fillOpacity: 0.12,
      })
        .bindTooltip(`Eating around ${area.name}`)
        .addTo(layer)
      bounds.extend(circle.getBounds())
    }

    for (const [placeId, names] of byPlace) {
      const place = getNeighborhood(placeId)
      if (!place) continue
      L.circleMarker([place.lat, place.lng], {
        radius: 7,
        color: '#fff',
        weight: 2,
        fillColor: ink,
        fillOpacity: 1,
      })
        .bindTooltip(names.join(', '), {
          permanent: true,
          direction: 'top',
          offset: [0, -8],
          className: 'map-label',
        })
        .addTo(layer)
      bounds.extend([place.lat, place.lng])
    }

    if (bounds.isValid()) map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 })
  }

  update(room)
  // The container was just inserted; make sure Leaflet measures its real size.
  requestAnimationFrame(() => map.invalidateSize())

  return {
    update,
    destroy: () => map.remove(),
  }
}
