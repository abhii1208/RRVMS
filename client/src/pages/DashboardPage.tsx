import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getDashboard, getEcDashboard, getHealth, type DashboardResponse, type EcDashboardResponse, type VisitorRequestListItem } from '../services/apiClient'
import { demoDashboard, demoEcDashboard } from '../data/demoData'
import { useAuth } from '../auth/useAuth'
import { formatStatus } from '../utils/formatters'

export function DashboardPage() {
  const { user } = useAuth()
  const isEc = user?.role === 'EXPORT_CONTROL'
  const [dashboard, setDashboard] = useState<DashboardResponse>(demoDashboard)
  const [ecDashboard, setEcDashboard] = useState<EcDashboardResponse>(demoEcDashboard)
  const [loading, setLoading] = useState(true)
  const [usingDemoData, setUsingDemoData] = useState(true)

  const load = () => {
    setLoading(true)
    getHealth()
      .then(() => isEc ? getEcDashboard().then(data => { setEcDashboard(data); setUsingDemoData(false) }) : getDashboard().then(data => { setDashboard(data); setUsingDemoData(false) }))
      .catch(reason => {
        setUsingDemoData(true)
        console.warn('[RRVMS DASHBOARD] Live API unavailable; showing specimen data.', { reason: reason instanceof Error ? reason.message : reason })
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [user?.role])

  return (
    <div className="dashboard-shell space-y-6">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">RRVMS workspace</p>
          <h1 className="display mt-2 text-3xl font-bold text-[var(--royal-blue)] sm:text-4xl">Good morning, {user?.name.split(' ')[0]}</h1>
          <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">Visitor activity, workflow health, and today&apos;s operational picture.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={usingDemoData ? 'status-chip status-demo' : 'status-chip status-live'}>{usingDemoData ? 'DEMO DATA' : 'LIVE DATA'}</span>
          <button type="button" onClick={load} className="touch-button border border-[var(--silver)] bg-white px-3 py-2 text-xs font-semibold text-[var(--royal-blue)]">Refresh</button>
        </div>
      </header>
      {usingDemoData && <div role="status" className="status-banner"><span>Live API unavailable - showing clearly marked specimen data.</span><button type="button" onClick={load}>Retry live API</button></div>}
      {loading && <div className="status-banner status-loading" role="status">Checking live API and loading visitor activity...</div>}
      {isEc ? <EcDashboard data={ecDashboard} /> : <HostDashboard data={dashboard} />}
    </div>
  )
}

function HostDashboard({ data }: { data: DashboardResponse }) {
  return <div className="space-y-6">
    <SummaryCards values={[
      ['Total Requests', data.totalRequests], ['Pending EC Review', data.pendingEcReviews], ['Approved', Math.max(data.totalRequests - data.pendingActions - data.noShows, 0)], ["Today's Visits", data.todaysVisits], ['Checked In', data.currentlyInside], ['Checked Out', Math.max(data.todaysVisits - data.currentlyInside, 0)], ['Pending Documentation', data.pendingDocumentation], ['Reception Holds', data.noShows],
    ]} />
    <ActivitySection items={data.recentRequests} title="Visitor Activity" />
    <div className="grid gap-6 lg:grid-cols-2"><InfoPanel title="Upcoming visits"><p className="text-3xl font-bold text-[var(--royal-blue)]">{data.upcomingVisits}</p><p className="mt-2 text-sm text-[var(--muted)]">Scheduled visits awaiting arrival.</p></InfoPanel><InfoPanel title="Requests awaiting action"><p className="text-3xl font-bold text-[var(--royal-blue)]">{data.pendingActions}</p><p className="mt-2 text-sm text-[var(--muted)]">Requests needing host or EC attention.</p></InfoPanel></div>
  </div>
}

function EcDashboard({ data }: { data: EcDashboardResponse }) {
  return <div className="space-y-6"><SummaryCards values={[
    ['Pending EC Review', data.pendingEcReviews], ['Pending Documentation', data.pendingDocumentation], ['Approved', data.approved], ['Rejected', data.rejected], ['DPS Flags', data.dpsFlags], ['Visitor History', data.visitorHistory], ['Attendance', data.attendance], ['Reception Holds', data.dpsFlags],
  ]} /><ActivitySection items={data.pendingEcReviewsItems} title="Requests awaiting Export Control review" /><div className="grid gap-6 lg:grid-cols-2"><InfoPanel title="Pending documentation"><p className="text-3xl font-bold text-[var(--royal-blue)]">{data.pendingDocumentation}</p><p className="mt-2 text-sm text-[var(--muted)]">Visitor records awaiting additional information.</p></InfoPanel><InfoPanel title="DPS flags"><p className="text-3xl font-bold text-[var(--royal-blue)]">{data.dpsFlags}</p><p className="mt-2 text-sm text-[var(--muted)]">Cases requiring review.</p></InfoPanel></div></div>
}

function SummaryCards({ values }: { values: Array<[string, number]> }) {
  return <section className="summary-grid">{values.map(([label, value]) => <div className="summary-card" key={label}><p>{label}</p><strong>{value}</strong></div>)}</section>
}

function ActivitySection({ items, title }: { items: VisitorRequestListItem[]; title: string }) {
  return <section className="dashboard-panel"><div className="panel-heading"><div><p className="eyebrow">Live queue</p><h2 className="display text-xl font-bold text-[var(--royal-blue)]">{title}</h2></div><Link to="/visitor-requests" className="text-xs font-semibold text-[var(--royal-blue)]">View all -&gt;</Link></div>
    {items.length === 0 ? <p className="py-8 text-sm text-[var(--muted)]">No visitor requests yet.</p> : <><div className="desktop-table"><table><thead><tr><th>Visitor</th><th>Company</th><th>Visit date</th><th>Host</th><th>Status</th><th>Batch</th><th /></tr></thead><tbody>{items.map(item => <tr key={item.id}><td className="font-semibold">{item.visitorName || 'Visitor pending'}</td><td>{item.companyName}</td><td>{item.visitDate || 'Not scheduled'}</td><td>{item.hostName || 'Unassigned'}</td><td><span className="status-chip">{formatStatus(item.currentStatus)}</span></td><td>{item.batchId || '-'}</td><td><Link to={`/visitor-requests/${item.id}`} className="font-semibold text-[var(--royal-blue)]">Open</Link></td></tr>)}</tbody></table></div><div className="mobile-record-list">{items.map(item => <article className="mobile-record" key={item.id}><div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold text-[var(--ink)]">{item.visitorName || 'Visitor pending'}</h3><p className="text-xs text-[var(--muted)]">{item.companyName}</p></div><span className="status-chip">{formatStatus(item.currentStatus)}</span></div><dl><div><dt>Visit date</dt><dd>{item.visitDate || 'Not scheduled'}</dd></div><div><dt>Host</dt><dd>{item.hostName || 'Unassigned'}</dd></div><div><dt>Batch</dt><dd>{item.batchId || '-'}</dd></div></dl><Link to={`/visitor-requests/${item.id}`} className="touch-button mt-3 inline-block bg-[var(--royal-blue)] px-3 py-2 text-xs font-semibold text-white">Open request</Link></article>)}</div></>}
  </section>
}

function InfoPanel({ title, children }: { title: string; children: React.ReactNode }) { return <section className="dashboard-panel"><p className="eyebrow">Operations</p><h2 className="display mt-1 text-xl font-bold text-[var(--royal-blue)]">{title}</h2><div className="mt-5">{children}</div></section> }
