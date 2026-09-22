'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Back } from '@/components/Back'
import { loadLearner } from '@/engine/learner'

/**
 * What this device is holding, said plainly.
 *
 * Three reports in a row described behaviour I could not reproduce on the deployed site,
 * and the missing fact every time was which build the phone was running and what was in
 * its record. Symptoms cannot tell those apart: "showing all events again" looks identical
 * whether the filter is broken or the device has finished all of them.
 *
 * So this prints the two things a screenshot cannot: the commit that served the page, and
 * the fields those screens actually read.
 */
export function WhatAmI({ sha, built }: { sha: string; built: string }) {
  const [rows, setRows] = useState<{ k: string; v: string }[] | null>(null)

  useEffect(() => {
    const me = loadLearner()
    const finished = me.finished_cards ?? []
    const cs = getComputedStyle(document.documentElement)
    const safeTop = cs.getPropertyValue('--safe-top').trim() || '0px'
    const safeBottom = cs.getPropertyValue('--safe-bottom').trim() || '0px'
    const vv = window.visualViewport
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true
    const nav = document
      .querySelector('[data-testid="bottom-nav"]')
      ?.getBoundingClientRect()
    /* The three viewport units, measured rather than assumed. */
    const probe = document.createElement('div')
    probe.style.cssText = 'position:fixed;top:0;left:0;width:1px;pointer-events:none;opacity:0'
    document.body.appendChild(probe)
    const measure = (unit: string) => {
      probe.style.height = '100' + unit
      return Math.round(probe.getBoundingClientRect().height)
    }
    const units = { svh: measure('svh'), lvh: measure('lvh'), dvh: measure('dvh') }
    probe.remove()
    const htmlBg = getComputedStyle(document.documentElement).backgroundColor
    const bodyBg = getComputedStyle(document.body).backgroundColor
    const atFoot = document.elementFromPoint(
      Math.round(window.innerWidth / 2),
      window.innerHeight - 2,
    ) as HTMLElement | null
    /* Walk up until something actually paints, which is what the eye sees. */
    let painter: HTMLElement | null = atFoot
    while (painter && getComputedStyle(painter).backgroundColor === 'rgba(0, 0, 0, 0)') {
      painter = painter.parentElement
    }
    const foot = {
      what:
        (atFoot?.getAttribute('data-testid') ?? atFoot?.tagName ?? '(nothing)') +
        (painter && painter !== atFoot ? ' → painted by ' + (painter.getAttribute('data-testid') ?? painter.tagName) : ''),
      colour: painter ? getComputedStyle(painter).backgroundColor : '(canvas)',
    }
    setRows([
      { k: 'build', v: sha.slice(0, 7) + (built ? ' — ' + built.split('\n')[0].slice(0, 60) : '') },
      { k: 'name', v: me.display_name ?? '(none)' },
      { k: 'chapter', v: String(me.chapter ?? '(none)') },
      { k: 'sittings', v: String(me.sittings ?? 0) },
      { k: 'sections done', v: (me.sections_completed ?? []).join(', ') || '(none)' },
      { k: 'roots played', v: String((me.roots_played ?? []).length) },
      { k: 'proof lines', v: String((me.proof ?? []).length) },
      { k: 'words banked', v: String(Object.keys(me.inventory ?? {}).length) },
      { k: 'legend answers', v: String((me.legend ?? []).length) },
      /*
        The one that answers "why am I seeing all the events".

        DROPS is finished_cards filtered to drop rooms, so a long list here is the
        honest reason a screen looks full — and the only way to tell that apart from a
        broken filter is to read it.
      */
      { k: 'finished cards', v: String(finished.length) },
      { k: '  of which drops', v: String(finished.filter((id) => /^lisbon_/.test(id)).length) },
      { k: '  the drop ones', v: finished.filter((id) => /^lisbon_/.test(id)).join(', ') || '(none)' },
      { k: 'saved', v: String((me.saved ?? []).length) },
      { k: 'photo', v: localStorage.getItem('byheart.avatar.v1') ? 'yes' : 'no' },
      /*
        AND WHAT THE SCREEN ACTUALLY IS, because three attempts at the bottom bar were
        made against a simulated inset in a headless browser and all three were wrong.

        The sand band under the bar has been reported four times. Every fix so far has been
        aimed at a home-indicator inset, which is a guess about the device — and a guess is
        what a headless browser can only ever give back, since env(safe-area-inset-*)
        resolves to 0 there. These are the numbers that decide the layout, read off the
        phone that has the fault.
      */
      { k: '— screen —', v: '' },
      { k: 'window', v: window.innerWidth + ' x ' + window.innerHeight },
      { k: 'visual viewport', v: vv ? Math.round(vv.width) + ' x ' + Math.round(vv.height) : '(none)' },
      { k: 'screen', v: window.screen.width + ' x ' + window.screen.height },
      { k: 'dpr', v: String(window.devicePixelRatio) },
      { k: 'safe top/bottom', v: safeTop + ' / ' + safeBottom },
      { k: 'document height', v: String(document.documentElement.scrollHeight) },
      { k: 'standalone', v: standalone ? 'yes (installed)' : 'no (browser)' },
      {
        k: 'nav bottom vs window',
        v: nav
          ? Math.round(nav.bottom) + ' vs ' + window.innerHeight + '  (gap ' + Math.round(window.innerHeight - nav.bottom) + ')'
          : '(no bar on this page)',
      },
      { k: 'nav height', v: nav ? String(Math.round(nav.height)) : '—' },
      /*
        THE THREE VIEWPORT UNITS, SIDE BY SIDE.

        This page has no bottom bar, so the nav rows above read "(none)" here — and the
        band the bar seemed to cause turned out not to be about the bar at all. What
        decides it is whether the page's height unit matches the screen: svh is the
        viewport WITH browser chrome, lvh is without it, dvh is what it is right now.
        Where they disagree is exactly the height of the gap, and no headless browser can
        show that because all three are equal there.
      */
      { k: 'svh / lvh / dvh', v: units.svh + ' / ' + units.lvh + ' / ' + units.dvh },
      { k: 'body height', v: String(Math.round(document.body.getBoundingClientRect().height)) },
      /*
        WHAT IS ACTUALLY PAINTED AT THE FOOT OF THE PAGE.

        Every round of this has been me inferring a colour from a photograph of a screen
        and getting it wrong. The page can say what it is painting, so it should: the
        element at the bottom edge of the viewport, and the colour it resolves to. If that
        reads as the ground colour then the band in the screenshot is browser chrome and
        the page is right; if it reads as anything else, that is the bug, named.
      */
      { k: 'at foot of viewport', v: foot.what },
      { k: '  its colour', v: foot.colour },
      { k: 'html background', v: htmlBg },
      { k: 'body background', v: bodyBg },
    ])
  }, [sha, built])

  return (
    <main className="safe-top mx-auto flex min-h-svh w-full max-w-md flex-col gap-6 bg-bg px-5 py-10 text-fg">
      <header className="flex items-center gap-3">
        <Back />
        <p className="eyebrow flex-1 truncate text-right text-muted">THIS BUILD</p>
      </header>

      <h1 className="display text-balance text-2xl">What am I running.</h1>
      <p className="text-sm leading-relaxed text-muted">
        The build that served this page, and what this phone is holding. Send a screenshot
        of this when something looks wrong.
      </p>

      {rows ? (
        <dl className="flex flex-col" data-testid="whatami">
          {rows.map((r) => (
            <div key={r.k} className="flex flex-col gap-1 border-b border-line/60 py-3">
              <dt className="eyebrow text-muted">{r.k}</dt>
              <dd className="break-all text-sm">{r.v}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      {/*
        A way to get a clean slate without clearing site data by hand, which on iOS also
        takes the photo and every other origin's storage with it.
      */}
      <Link
        href="/reset"
        className="tap-target eyebrow w-full rounded border border-line px-5 py-3 text-center text-muted"
      >
        START AGAIN
      </Link>
    </main>
  )
}
