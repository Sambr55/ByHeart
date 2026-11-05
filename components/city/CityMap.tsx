'use client'

import 'leaflet/dist/leaflet.css'
import { useEffect, useRef } from 'react'
import type { Map as LeafletMap, LayerGroup, Marker } from 'leaflet'
import { BAIRROS, type Gem } from '@/content/gems'

/**
 * THE MAP — OpenStreetMap tiles under DUB's own pins (2026-11-03).
 *
 * Leaflet, loaded in the browser only (it reads `window` at import). OSM's standard tiles
 * are fine for a small app with attribution shown; at real traffic switch the tile URL to a
 * hosted provider (MapTiler, Stadia) — it is the one line below, nothing else changes.
 *
 * Pins are DUB's colours, one letter for the kind, and the selected one grows. The learner's
 * own position, when they have asked for it, is a blue dot and never leaves the phone.
 */
const TILES = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
const LETTER: Record<string, string> = { cafe: 'C', tasca: 'T', market: 'M', bakery: 'P', miradouro: 'V', shop: 'S', venue: '♪', workshop: 'W', bar: 'B', other: '•' }

export function CityMap({
  gems,
  selected,
  focus,
  me,
  onSelect,
  centre = [38.722, -9.14],
  zoom = 13,
}: {
  gems: Gem[]
  selected: string | null
  /** A bairro to fly to, or null for the whole city. */
  focus: string | null
  me: [number, number] | null
  onSelect: (id: string) => void
  /** Where the whole-city view sits: Lisbon, or a town (content/gems.ts cityCentre). */
  centre?: [number, number]
  zoom?: number
}) {
  const box = useRef<HTMLDivElement>(null)
  const map = useRef<LeafletMap | null>(null)
  const layer = useRef<LayerGroup | null>(null)
  const meMarker = useRef<Marker | null>(null)
  const L = useRef<typeof import('leaflet') | null>(null)

  /* Build once. */
  useEffect(() => {
    let dead = false
    import('leaflet').then((mod) => {
      if (dead || !box.current || map.current) return
      L.current = mod
      const m = mod.map(box.current, { zoomControl: false, attributionControl: true }).setView(centre, zoom)
      mod.tileLayer(TILES, { maxZoom: 19, attribution: ATTRIBUTION }).addTo(m)
      mod.control.zoom({ position: 'bottomright' }).addTo(m)
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

  const draw = () => {
    const mod = L.current
    if (!mod || !layer.current) return
    layer.current.clearLayers()
    for (const g of gems) {
      const on = g.id === selected
      const icon = mod.divIcon({
        className: 'gem-pin-wrap',
        html: `<span class="gem-pin${on ? ' is-on' : ''}${g.verified ? '' : ' is-draft'}"><b>${LETTER[g.kind] ?? '•'}</b></span>`,
        iconSize: on ? [40, 40] : [30, 30],
        iconAnchor: on ? [20, 40] : [15, 30],
      })
      mod.marker([g.lat, g.lng], { icon, title: g.name, keyboard: true })
        .on('click', () => onSelect(g.id))
        .addTo(layer.current)
    }
  }

  /* Redraw pins when the set or the selection changes. */
  useEffect(draw, [gems, selected]) // eslint-disable-line react-hooks/exhaustive-deps

  /* Fly to a bairro, a selected gem, or the whole city. */
  useEffect(() => {
    const m = map.current
    if (!m) return
    const g = gems.find((x) => x.id === selected)
    if (g) m.flyTo([g.lat, g.lng], Math.max(m.getZoom(), 16), { duration: 0.6 })
    else if (focus) {
      const b = BAIRROS.find((x) => x.id === focus)
      if (b) m.flyTo(b.centre, 15, { duration: 0.6 })
    } else m.flyTo(centre, zoom, { duration: 0.6 })
  }, [selected, focus, gems])

  /* Where the learner is, if they asked. */
  useEffect(() => {
    const mod = L.current
    const m = map.current
    if (!mod || !m) return
    meMarker.current?.remove()
    meMarker.current = null
    if (!me) return
    meMarker.current = mod
      .marker(me, { icon: mod.divIcon({ className: 'gem-pin-wrap', html: '<span class="me-dot"></span>', iconSize: [18, 18], iconAnchor: [9, 9] }) })
      .addTo(m)
    if (!selected) m.flyTo(me, 15, { duration: 0.6 })
  }, [me]) // eslint-disable-line react-hooks/exhaustive-deps

  return <div ref={box} data-testid="city-map" className="h-full w-full" role="application" aria-label="Map of the gems" />
}
