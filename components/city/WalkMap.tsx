'use client'

import 'leaflet/dist/leaflet.css'
import { useEffect, useRef } from 'react'
import type { Map as LeafletMap, LayerGroup } from 'leaflet'

/**
 * A WALK'S ROUTE — numbered stops joined by a dotted line, the current one larger, the said
 * ones gold. Same tiles and attribution as the City map (CityMap.tsx).
 */
const TILES = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

export function WalkMap({
  points,
  current,
  said,
  onPick,
}: {
  points: { lat: number; lng: number; name: string }[]
  current: number
  said: boolean[]
  onPick: (i: number) => void
}) {
  const box = useRef<HTMLDivElement>(null)
  const map = useRef<LeafletMap | null>(null)
  const layer = useRef<LayerGroup | null>(null)
  const L = useRef<typeof import('leaflet') | null>(null)

  const draw = () => {
    const mod = L.current
    const m = map.current
    if (!mod || !m || !layer.current) return
    layer.current.clearLayers()
    mod.polyline(points.map((p) => [p.lat, p.lng] as [number, number]), { color: '#1f5c8f', weight: 4, opacity: 0.7, dashArray: '2 10', lineCap: 'round' }).addTo(layer.current)
    points.forEach((p, i) => {
      const cls = 'walk-pin' + (i === current ? ' is-on' : '') + (said[i] ? ' is-said' : '')
      const size = i === current ? 38 : 28
      mod
        .marker([p.lat, p.lng], {
          title: p.name,
          icon: mod.divIcon({ className: 'gem-pin-wrap', html: `<span class="${cls}">${said[i] ? '✓' : i + 1}</span>`, iconSize: [size, size], iconAnchor: [size / 2, size / 2] }),
        })
        .on('click', () => onPick(i))
        .addTo(layer.current!)
    })
  }

  useEffect(() => {
    let dead = false
    import('leaflet').then((mod) => {
      if (dead || !box.current || map.current) return
      L.current = mod
      const bounds = points.map((p) => [p.lat, p.lng] as [number, number])
      const m = mod.map(box.current, { zoomControl: false }).fitBounds(bounds, { padding: [36, 36], maxZoom: 17 })
      mod.tileLayer(TILES, { maxZoom: 19, attribution: ATTRIBUTION }).addTo(m)
      /* The box has its real size only after layout settles; fit again once it has. */
      window.setTimeout(() => {
        m.invalidateSize()
        m.fitBounds(bounds, { padding: [36, 36], maxZoom: 17 })
      }, 150)
      layer.current = mod.layerGroup().addTo(m)
      map.current = m
      draw()
    })
    return () => {
      dead = true
      map.current?.remove()
      map.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(draw, [current, said]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const p = points[current]
    if (p && map.current && map.current.getSize().x > 0) map.current.panTo([p.lat, p.lng], { animate: true })
  }, [current]) // eslint-disable-line react-hooks/exhaustive-deps -- points is rebuilt every render; pan only when the stop changes

  return <div ref={box} data-testid="walk-map" className="h-full w-full" role="application" aria-label="Map of the walk" />
}
