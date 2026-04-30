import { useState } from 'react'

// ─── USPS flat rate box data ──────────────────────────────────────────────
const FLAT_RATE_BOXES = [
  { name: 'USPS Flat Rate Envelope',       price: 9.85,  maxL: 12.5, maxW: 9.5,  maxH: 0.75, maxLbs: 70 },
  { name: 'USPS Small Flat Rate Box',      price: 10.40, maxL: 8.69, maxW: 5.44, maxH: 1.75, maxLbs: 70 },
  { name: 'USPS Medium Flat Rate Box (1)', price: 16.10, maxL: 11,   maxW: 8.5,  maxH: 5.5,  maxLbs: 70 },
  { name: 'USPS Medium Flat Rate Box (2)', price: 16.10, maxL: 14,   maxW: 12,   maxH: 3.5,  maxLbs: 70 },
  { name: 'USPS Large Flat Rate Box',      price: 21.90, maxL: 12,   maxW: 12,   maxH: 5.5,  maxLbs: 70 },
]

// Rough USPS Priority Mail retail rates (national average / zone 4)
function uspsPriorityEstimate(totalOz: number): number {
  const lbs = totalOz / 16
  if (lbs <= 0.5) return 9.35
  if (lbs <= 1)   return 9.35
  if (lbs <= 2)   return 11.20
  if (lbs <= 3)   return 13.20
  if (lbs <= 4)   return 15.10
  if (lbs <= 5)   return 17.10
  if (lbs <= 7)   return 21.00
  if (lbs <= 10)  return 28.35
  if (lbs <= 15)  return 39.50
  if (lbs <= 20)  return 50.00
  return 50 + (lbs - 20) * 2.5
}

// ─── Portrait Calculator ──────────────────────────────────────────────────
function PortraitCalculator() {
  const [width, setWidth]   = useState('')
  const [height, setHeight] = useState('')
  const [rate, setRate]     = useState('2.00')
  const [rush, setRush]     = useState('0')
  const [deposit, setDeposit] = useState('50')
  const [copied, setCopied] = useState(false)

  const w = parseFloat(width) || 0
  const h = parseFloat(height) || 0
  const r = parseFloat(rate) || 0
  const rushPct = parseFloat(rush) || 0
  const depositPct = parseFloat(deposit) || 50

  const sqIn = w * h
  const base = sqIn * r
  const rushAmt = base * (rushPct / 100)
  const total = base + rushAmt
  const depositAmt = total * (depositPct / 100)
  const hasResult = sqIn > 0

  const copyPrice = () => {
    navigator.clipboard.writeText(`$${total.toFixed(2)}`).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="card">
      <h2 style={{ margin: '0 0 1.5rem', color: 'var(--text-primary)' }}>🖼️ Portrait Price Calculator</h2>

      {/* Dimensions */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '130px' }}>
          <label className="label">Width (inches)</label>
          <input
            className="input"
            type="number"
            min="0"
            step="0.5"
            placeholder="e.g. 8"
            value={width}
            onChange={(e) => setWidth(e.target.value)}
          />
        </div>
        <div style={{ flex: 1, minWidth: '130px' }}>
          <label className="label">Height (inches)</label>
          <input
            className="input"
            type="number"
            min="0"
            step="0.5"
            placeholder="e.g. 10"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
          />
        </div>
      </div>

      {/* Rate */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '130px' }}>
          <label className="label">Rate ($ per sq in)</label>
          <input
            className="input"
            type="number"
            min="0"
            step="0.25"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
          />
        </div>
        <div style={{ flex: 1, minWidth: '130px' }}>
          <label className="label">Rush Fee (%)</label>
          <input
            className="input"
            type="number"
            min="0"
            max="200"
            step="5"
            placeholder="0"
            value={rush}
            onChange={(e) => setRush(e.target.value)}
          />
        </div>
        <div style={{ flex: 1, minWidth: '130px' }}>
          <label className="label">Deposit (%)</label>
          <input
            className="input"
            type="number"
            min="0"
            max="100"
            step="5"
            placeholder="50"
            value={deposit}
            onChange={(e) => setDeposit(e.target.value)}
          />
        </div>
      </div>

      {/* Result */}
      {hasResult ? (
        <div
          style={{
            background: 'var(--bg-raised)',
            borderRadius: '0.6rem',
            padding: '1.25rem 1.5rem',
            marginTop: '0.5rem',
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.4rem 2rem', marginBottom: '1rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Size</span>
            <span style={{ fontWeight: 600 }}>{w}" × {h}" = {sqIn.toFixed(1)} sq in</span>

            <span style={{ color: 'var(--text-muted)' }}>Base price</span>
            <span style={{ fontWeight: 600 }}>${base.toFixed(2)}</span>

            {rushPct > 0 && (
              <>
                <span style={{ color: 'var(--text-muted)' }}>Rush fee ({rushPct}%)</span>
                <span style={{ fontWeight: 600, color: 'var(--warning)' }}>+ ${rushAmt.toFixed(2)}</span>
              </>
            )}

            <span style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: '0.5rem' }}>
              <strong>Total</strong>
            </span>
            <span
              style={{
                fontWeight: 800,
                fontSize: '1.3em',
                color: 'var(--accent)',
                borderTop: '1px solid var(--border)',
                paddingTop: '0.5rem',
              }}
            >
              ${total.toFixed(2)}
            </span>

            <span style={{ color: 'var(--text-muted)' }}>Deposit ({depositPct}%)</span>
            <span style={{ fontWeight: 600, color: 'var(--success)' }}>${depositAmt.toFixed(2)}</span>

            <span style={{ color: 'var(--text-muted)' }}>Balance due</span>
            <span style={{ fontWeight: 600 }}>${(total - depositAmt).toFixed(2)}</span>
          </div>

          <button
            className="btn btn-primary"
            style={{ minHeight: '52px', width: '100%' }}
            onClick={copyPrice}
          >
            {copied ? '✓ Copied!' : '📋 Copy Total Price'}
          </button>
        </div>
      ) : (
        <div style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '0.9em' }}>
          Enter dimensions above to see the price.
        </div>
      )}
    </div>
  )
}

// ─── Shipping Calculator ──────────────────────────────────────────────────
function ShippingCalculator() {
  const [lbs, setLbs]   = useState('')
  const [oz, setOz]     = useState('')
  const [length, setLength] = useState('')
  const [width, setWidth]   = useState('')
  const [heightIn, setHeightIn] = useState('')

  const totalLbs = (parseFloat(lbs) || 0)
  const totalOz  = totalLbs * 16 + (parseFloat(oz) || 0)
  const L = parseFloat(length) || 0
  const W = parseFloat(width) || 0
  const H = parseFloat(heightIn) || 0

  const dimWeight = L > 0 && W > 0 && H > 0 ? (L * W * H) / 139 : 0
  const billableOz = Math.max(totalOz, dimWeight * 16)
  const priorityEstimate = totalOz > 0 ? uspsPriorityEstimate(billableOz) : null

  // Which flat rate boxes fit?
  const fittingBoxes = FLAT_RATE_BOXES.filter(
    (b) => totalLbs <= b.maxLbs && L <= b.maxL && W <= b.maxW && H <= b.maxH,
  )

  const cheapestFlatRate = fittingBoxes.length > 0
    ? fittingBoxes.reduce((a, b) => (a.price < b.price ? a : b))
    : null

  const bestOption = (() => {
    if (!priorityEstimate) return null
    if (cheapestFlatRate && cheapestFlatRate.price < priorityEstimate) return cheapestFlatRate.name
    return 'USPS Priority Mail (weight-based)'
  })()

  const hasResult = totalOz > 0

  return (
    <div className="card">
      <h2 style={{ margin: '0 0 1.5rem', color: 'var(--text-primary)' }}>📦 Shipping Estimator</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.85em', marginTop: 0, marginBottom: '1.25rem' }}>
        Estimates based on USPS retail rates (national average). Actual rates vary by destination zip.
      </p>

      {/* Weight */}
      <label className="label">Package Weight</label>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '130px' }}>
          <input
            className="input"
            type="number"
            min="0"
            step="1"
            placeholder="lbs"
            value={lbs}
            onChange={(e) => setLbs(e.target.value)}
          />
          <div style={{ color: 'var(--text-muted)', fontSize: '0.78em', marginTop: '0.25rem' }}>pounds</div>
        </div>
        <div style={{ flex: 1, minWidth: '130px' }}>
          <input
            className="input"
            type="number"
            min="0"
            max="15.9"
            step="0.5"
            placeholder="oz"
            value={oz}
            onChange={(e) => setOz(e.target.value)}
          />
          <div style={{ color: 'var(--text-muted)', fontSize: '0.78em', marginTop: '0.25rem' }}>ounces</div>
        </div>
      </div>

      {/* Dimensions */}
      <label className="label">Package Dimensions (inches) — optional</label>
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {[['Length', length, setLength], ['Width', width, setWidth], ['Height', heightIn, setHeightIn]].map(
          ([label, val, setter]) => (
            <div key={label as string} style={{ flex: 1, minWidth: '90px' }}>
              <input
                className="input"
                type="number"
                min="0"
                step="0.25"
                placeholder={label as string}
                value={val as string}
                onChange={(e) => (setter as (v: string) => void)(e.target.value)}
              />
              <div style={{ color: 'var(--text-muted)', fontSize: '0.78em', marginTop: '0.25rem' }}>{label as string}</div>
            </div>
          ),
        )}
      </div>

      {hasResult ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {/* Weight summary */}
          {dimWeight > 0 && (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85em' }}>
              Dimensional weight: <strong>{dimWeight.toFixed(2)} lbs</strong>
              {dimWeight > totalLbs && (
                <span style={{ color: 'var(--warning)', marginLeft: '0.5rem' }}>
                  (billed at dim weight — heavier than actual)
                </span>
              )}
            </div>
          )}

          {/* Best pick */}
          {bestOption && (
            <div
              style={{
                background: 'rgba(16,185,129,0.12)',
                border: '1px solid var(--success)',
                borderRadius: '0.5rem',
                padding: '0.85rem 1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.5rem',
              }}
            >
              <div>
                <div style={{ fontSize: '0.75em', color: 'var(--success)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Best Option
                </div>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{bestOption}</div>
              </div>
              <div style={{ fontSize: '1.4em', fontWeight: 800, color: 'var(--success)' }}>
                ${(cheapestFlatRate && cheapestFlatRate.name === bestOption
                  ? cheapestFlatRate.price
                  : priorityEstimate!
                ).toFixed(2)}
              </div>
            </div>
          )}

          {/* All options */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8em', marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              All options
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {priorityEstimate != null && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>USPS Priority Mail (weight-based)</span>
                  <span style={{ fontWeight: 700 }}>~${priorityEstimate.toFixed(2)}</span>
                </div>
              )}
              {FLAT_RATE_BOXES.map((box) => {
                const fits = L <= box.maxL && W <= box.maxW && H <= box.maxH && totalLbs <= box.maxLbs
                return (
                  <div
                    key={box.name}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      opacity: fits || (L === 0 && W === 0 && H === 0) ? 1 : 0.4,
                      color: fits ? 'var(--text-primary)' : 'var(--text-muted)',
                    }}
                  >
                    <span>{box.name}{!fits && L > 0 ? ' (too small)' : ''}</span>
                    <span style={{ fontWeight: 700 }}>${box.price.toFixed(2)}</span>
                  </div>
                )
              })}
            </div>
          </div>

          <p style={{ color: 'var(--text-muted)', fontSize: '0.78em', margin: 0 }}>
            Rates shown are approximate 2024 retail prices. Check usps.com for exact rates by zip code.
          </p>
        </div>
      ) : (
        <div style={{ color: 'var(--text-muted)', fontSize: '0.9em' }}>
          Enter a weight above to see shipping estimates.
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────
export default function Calculators() {
  return (
    <div style={{ maxWidth: '680px' }}>
      <h1 className="page-title" style={{ marginBottom: '1.5rem' }}>🧮 Calculators</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <PortraitCalculator />
        <ShippingCalculator />
      </div>
    </div>
  )
}
