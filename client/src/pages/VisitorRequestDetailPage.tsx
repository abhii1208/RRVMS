import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { ecApprove, ecReject, ecRequestInformation, executeVisitorRequestAction, getVisitorRequest, updateAttendance, type VisitorRequestDetail } from '../services/apiClient'
import { formatStatus } from '../utils/formatters'
import { userFacingApiError } from '../utils/logger'

const ecReviewStatuses = ['PENDING_EC_REVIEW', 'EC_REVIEW', 'DOCUMENTATION_SUBMITTED', 'EC_RE_REVIEW_REQUIRED', 'EC_DPS', 'RECEPTION_HOLD']
const idClassificationOptions = [
  { value: 'Vendor', label: 'Vendor', swatch: 'bg-[#f28c28]' },
  { value: 'Visitor', label: 'Visitor', swatch: 'bg-[#6f7f8f]' },
  { value: 'GtrRedTag', label: 'GTR — Red Tag', swatch: 'bg-[#c62828]' },
]

export function VisitorRequestDetailPage() {
  const { id = '' } = useParams()
  const { user } = useAuth()
  const [request, setRequest] = useState<VisitorRequestDetail | null>(null)
  const [error, setError] = useState('')
  const [acting, setActing] = useState(false)
  const [showInfoModal, setShowInfoModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [showVerifyModal, setShowVerifyModal] = useState(false)
  const [showCheckInModal, setShowCheckInModal] = useState(false)
  const [showHoldModal, setShowHoldModal] = useState(false)
  const [idClassification, setIdClassification] = useState('Visitor')
  const [infoComment, setInfoComment] = useState("Please confirm the visitor's full legal name and designation as shown on the identity document.")
  const [rejectReason, setRejectReason] = useState('Insufficient identity verification documentation provided.')
  const [verifyIdType, setVerifyIdType] = useState('Passport')
  const [verifyIdLast4, setVerifyIdLast4] = useState('4821')
  const [badgeNumber, setBadgeNumber] = useState('B-101')
  const [holdComment, setHoldComment] = useState('Undeclared asset detected during reception screening.')

  const load = useCallback(async () => {
    try {
      const data = await getVisitorRequest(id)
      setRequest(data)
      setIdClassification(data.idClassification || 'Visitor')
      setVerifyIdType(data.visitor.idType || 'Passport')
      setVerifyIdLast4(data.visitor.idLast4 || '4821')
      setError('')
    } catch (reason) {
      setError(userFacingApiError(reason, 'Request details could not be loaded.'))
    }
  }, [id])

  useEffect(() => { void load() }, [load])

  const action = async (name: string, values: Record<string, string> = {}) => {
    setActing(true)
    try {
      const visitDayId = values.visitDayId ?? request?.visitDays[0]?.id
      setRequest(await executeVisitorRequestAction(id, { action: name, visitDayId, ...values }))
      setError('')
    } catch (reason) {
      setError(userFacingApiError(reason, 'That workflow action could not be completed.'))
    } finally {
      setActing(false)
    }
  }

  const handleApprove = async () => {
    setActing(true)
    try {
      setRequest(await ecApprove(id, 'Approved by Export Control', idClassification))
      setError('')
    } catch (reason) {
      setError(userFacingApiError(reason, 'Could not approve visitor request.'))
    } finally {
      setActing(false)
    }
  }

  const handleRequestInfo = async () => {
    if (!infoComment.trim()) return
    setActing(true)
    try {
      setRequest(await ecRequestInformation(id, infoComment.trim(), idClassification))
      setShowInfoModal(false)
      setError('')
    } catch (reason) {
      setError(userFacingApiError(reason, 'Could not send information request.'))
    } finally {
      setActing(false)
    }
  }

  const handleReject = async () => {
    if (!rejectReason.trim()) return
    setActing(true)
    try {
      setRequest(await ecReject(id, rejectReason.trim(), idClassification))
      setShowRejectModal(false)
      setError('')
    } catch (reason) {
      setError(userFacingApiError(reason, 'Could not reject visitor request.'))
    } finally {
      setActing(false)
    }
  }

  const handleVerify = async () => {
    const visitDayId = request?.visitDays[0]?.id
    if (!visitDayId) return
    setActing(true)
    try {
      setRequest(await executeVisitorRequestAction(id, { action: 'verify', visitDayId, idType: verifyIdType, idLast4: verifyIdLast4 }))
      setShowVerifyModal(false)
      setError('')
    } catch (reason) {
      setError(userFacingApiError(reason, 'Identity verification failed.'))
    } finally {
      setActing(false)
    }
  }

  const handleCheckIn = async () => {
    const visitDayId = request?.visitDays[0]?.id
    if (!visitDayId || !badgeNumber.trim()) return
    setActing(true)
    try {
      setRequest(await executeVisitorRequestAction(id, { action: 'check-in', visitDayId, badgeNumber: badgeNumber.trim() }))
      setShowCheckInModal(false)
      setError('')
    } catch (reason) {
      setError(userFacingApiError(reason, 'Check-in failed.'))
    } finally {
      setActing(false)
    }
  }

  const handleCheckOut = async () => {
    const visitDayId = request?.visitDays[0]?.id
    if (!visitDayId) return
    await action('check-out', { visitDayId })
  }

  const handleHold = async () => {
    const visitDayId = request?.visitDays[0]?.id
    if (!visitDayId) return
    setActing(true)
    try {
      setRequest(await executeVisitorRequestAction(id, { action: 'hold', visitDayId, comment: holdComment }))
      setShowHoldModal(false)
      setError('')
    } catch (reason) {
      setError(userFacingApiError(reason, 'Could not place visitor on hold.'))
    } finally {
      setActing(false)
    }
  }

  const handleNoShow = async () => {
    const visitDayId = request?.visitDays[0]?.id
    if (!visitDayId) return
    await action('no-show', { visitDayId })
  }

  const handleAttendanceToggle = async (category: string, currentCompleted: boolean) => {
    try {
      await updateAttendance(id, { category, completed: !currentCompleted, visitDayId: request?.visitDays[0]?.id })
      await load()
    } catch (reason) {
      setError(userFacingApiError(reason, 'Could not update attendance record.'))
    }
  }

  if (error) return <p role="alert" className="border border-[#e1b5b5] bg-[#fff4f4] p-4 text-sm text-[#9b2c2c]">{error}</p>
  if (!request) return <p className="text-sm text-[var(--muted)]">Loading request...</p>

  const forms = request.visitorForms ?? (request.visitorFormId ? [{ id: request.visitorFormId, status: request.currentStatus === 'VISITOR_FORM_PENDING' ? 'PENDING' : 'SUBMITTED', fullName: request.visitor.fullName }] : [])
  const isEc = user?.role === 'EXPORT_CONTROL'
  const isHost = user?.role === 'HOST_REQUESTER'
  const isReception = user?.role === 'RECEPTION'
  const activeDay = request.visitDays[0]
  const fcRecord = request.attendance?.find(a => a.category === 'FACILITIES_CONTRACTOR')
  const gtreRecord = request.attendance?.find(a => a.category === 'GAS_TURBINE_RESEARCH_ESTABLISHMENT')

  return (
    <div className="space-y-6">
      <Link to="/visitor-requests" className="text-sm font-semibold text-[var(--royal-blue)]">&lt;- Back to Requests</Link>

      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--royal-blue)]">Request detail</p>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="display text-3xl font-bold text-[var(--royal-blue)]">{request.visitor.fullName || 'Visitor form pending'}</h1>
            <p className="mt-2 text-sm text-[var(--muted)]">{request.requestNumber} | {request.batchId}</p>
          </div>
          <span className="rounded bg-[#e9eef6] px-3 py-1 text-sm font-semibold text-[var(--royal-blue)]">{formatStatus(request.currentStatus)}</span>
        </div>
      </header>

      {isEc && ecReviewStatuses.includes(request.currentStatus) && (
        <section className="space-y-4 border border-[var(--royal-blue)] bg-[#f4f7fb] p-5">
          <div>
            <h2 className="display text-xl font-bold text-[var(--royal-blue)]">EC Review</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">Select one ID classification before completing the review.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {idClassificationOptions.map(option => (
              <label key={option.value} className="flex cursor-pointer items-center gap-3 border border-[var(--silver)] bg-white p-3 text-sm font-semibold text-[var(--ink)]">
                <input type="radio" name="idClassification" value={option.value} checked={idClassification === option.value} onChange={() => setIdClassification(option.value)} />
                <span className={`h-3 w-3 rounded-full ${option.swatch}`} />
                {option.label}
              </label>
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            <button disabled={acting || !idClassification} type="button" onClick={() => void handleApprove()} className="cursor-pointer rounded bg-[#28a745] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">APPROVE</button>
            <button disabled={acting || !idClassification} type="button" onClick={() => setShowInfoModal(true)} className="cursor-pointer rounded bg-[var(--royal-blue)] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">REQUEST ADDITIONAL INFORMATION</button>
            <button disabled={acting || !idClassification} type="button" onClick={() => setShowRejectModal(true)} className="cursor-pointer rounded bg-[#dc3545] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">REJECT</button>
          </div>
        </section>
      )}

      {isReception && (
        <section className="flex flex-wrap items-center gap-3 border border-[var(--royal-blue)] bg-[#e9eef6] p-5">
          <p className="mr-3 text-sm font-bold text-[var(--royal-blue)]">Reception Actions:</p>
          {activeDay?.status === 'UPCOMING' && <ActionButton disabled={acting || request.currentStatus !== 'APPROVED'} onClick={() => setShowVerifyModal(true)}>Verify Identity &amp; Assets</ActionButton>}
          {activeDay?.status === 'RECEPTION_VERIFICATION' && <ActionButton disabled={acting} onClick={() => setShowCheckInModal(true)} tone="success">Issue Badge &amp; Check-In</ActionButton>}
          {activeDay?.status === 'CHECKED_IN' && <ActionButton disabled={acting} onClick={() => void handleCheckOut()}>Check-Out Visitor</ActionButton>}
          {request.currentStatus === 'APPROVED' && (
            <>
              <ActionButton disabled={acting} onClick={() => setShowHoldModal(true)} tone="warning">Place on Hold</ActionButton>
              <button disabled={acting} type="button" onClick={() => void handleNoShow()} className="cursor-pointer rounded border border-[var(--silver)] bg-white px-4 py-2 text-sm font-semibold text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-60">Mark No-Show</button>
            </>
          )}
        </section>
      )}

      {isHost && <Actions role={user?.role ?? ''} status={request.currentStatus} acting={acting} onAction={action} />}

      {!isReception && <Info title="Visitor Forms">
        {forms.map((form, index) => (
          <div key={form.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--silver)] pb-3">
            <span><strong>Visitor {index + 1}:</strong> <span className="ml-2">{form.fullName || 'Visitor form pending'}</span></span>
            <span className="flex items-center gap-4">
              <span className="rounded bg-[#e9eef6] px-2.5 py-1 text-xs font-semibold text-[var(--royal-blue)]">{formatStatus(form.status)}</span>
              <Link to={`/visitor-forms/${form.id}`} className="font-semibold text-[var(--royal-blue)] hover:underline">Open Visitor Form</Link>
            </span>
          </div>
        ))}
      </Info>}

      <div className="grid gap-6 lg:grid-cols-2">
        <Info title="Request Details">
          <Field label="Batch ID" value={request.batchId} strong />
          <Field label="Request Number" value={request.requestNumber} />
          <Field label="Visiting Company" value={request.visitingCompany} />
          <Field label="Visiting Site" value={request.visitingSite} />
          <Field label="Visit Date(s)" value={request.visitDays.map(d => d.visitDate).join(', ')} />
          <Field label="Purpose Type" value={request.visitPurposeType} />
          <Field label="Purpose Description" value={request.purpose} />
          <Field label="Areas to Visit" value={request.areasToVisit} />
          <Field label="Main Host" value={request.mainHostName} />
          <Field label="Escorting Host" value={request.escortingHostName} />
          <Field label="Faculty" value={request.faculty ? 'Yes' : 'No'} />
          <Field label="GTR" value={request.gtr ? 'Yes' : 'No'} />
          <Field label="ID Classification" value={formatClassification(request.idClassification || idClassification)} />
        </Info>

        <Info title="Visitor Information">
          <Field label="Full Legal Name" value={request.visitor.fullName} />
          <Field label="Company" value={request.visitor.companyName} />
          <Field label="Visitor Type" value={request.visitor.visitorType} />
          <Field label="Citizenship" value={request.visitor.citizenship} />
          <Field label="Nationality" value={request.visitor.nationality} />
          <Field label="Country of Residence" value={request.visitor.country} />
          <Field label="Designation / Position" value={request.visitor.designation} />
          <Field label="ID Type" value={request.visitor.idType} />
          <Field label="ID Last 4 Digits" value={request.visitor.idLast4} />
          <Field label="Email" value={request.visitor.email} />
          <Field label="Phone" value={request.visitor.phone} />
        </Info>

        <Info title="Declared Assets">
          {request.assets.length ? request.assets.map(asset => (
            <div key={asset.id} className="border-b border-[var(--silver)] pb-2">
              <p><strong>{asset.assetType}:</strong> {asset.description || 'N/A'}</p>
              <p className="text-xs text-[var(--muted)]">Serial: {asset.serialNumber || 'N/A'} | Verification: {formatStatus(asset.verificationStatus)}</p>
            </div>
          )) : <p>No declared assets.</p>}
        </Info>

        {!isReception && <Info title="DPS Screening">
          {request.dpsHistory?.length ? request.dpsHistory.map(dps => (
            <div key={dps.id} className="space-y-1">
              <Field label="DPS Result" value={formatStatus(dps.result)} />
              <Field label="Status" value={formatStatus(dps.status)} />
              <Field label="Performed By" value={formatStatus(dps.performedBy)} />
              <Field label="Notes" value={dps.notes} />
              {dps.performedAt && <p className="text-xs text-[var(--muted)]">Timestamp: {new Date(dps.performedAt).toLocaleString()}</p>}
            </div>
          )) : <p>No DPS screening record.</p>}
        </Info>}
      </div>

      {(isEc || request.currentStatus === 'APPROVED' || request.currentStatus === 'VISIT_PROCESS_COMPLETED') && (
        <Info title="Attendance Tracking">
          <AttendanceToggle label="Facilities Contractor" category="FACILITIES_CONTRACTOR" record={fcRecord} onToggle={handleAttendanceToggle} />
          <AttendanceToggle label="Gas Turbine Research Establishment" category="GAS_TURBINE_RESEARCH_ESTABLISHMENT" record={gtreRecord} onToggle={handleAttendanceToggle} />
        </Info>
      )}

      {!isReception && (
        <>
          <Info title="EC Review History">
            {request.ecReviews?.length ? request.ecReviews.map(review => (
              <div key={review.id} className="border-b border-[var(--silver)] pb-2">
                <p><strong>{formatStatus(review.decision)}:</strong> {review.comments || 'No comments supplied.'}</p>
                <p className="text-xs text-[var(--muted)]">Reviewer: {review.reviewerId} | {review.reviewedAt ? new Date(review.reviewedAt).toLocaleString() : 'Pending documentation'}</p>
              </div>
            )) : <p>No EC decisions recorded.</p>}
          </Info>

          <Info title="Information Requests">
            {request.informationRequests?.length ? request.informationRequests.map(info => (
              <div key={info.id} className="border-b border-[var(--silver)] pb-2">
                <div className="flex items-center justify-between gap-3">
                  <strong>{info.fields}</strong>
                  <span className="rounded bg-[#fff3cd] px-2 py-0.5 text-xs font-semibold text-[#856404]">{formatStatus(info.status)}</span>
                </div>
                <p className="mt-1 text-xs text-[var(--muted)]">EC Comment: {info.comment}</p>
                {info.responseSummary && <p className="mt-1 text-xs text-[var(--ink)]">Response: {info.responseSummary}</p>}
              </div>
            )) : <p>No information requests in history.</p>}
          </Info>

          <Info title="Visitor History">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-[var(--royal-blue)]">Previous Requests</h3>
                {request.previousRequests?.length ? request.previousRequests.map(prev => (
                  <p key={prev.id} className="mt-2 text-xs">Request <strong>{prev.requestNumber}</strong> | {prev.visitingSite} | {formatStatus(prev.currentStatus)}</p>
                )) : <p className="mt-2 text-xs text-[var(--muted)]">No previous requests.</p>}
              </div>
              <div>
                <h3 className="text-sm font-bold text-[var(--royal-blue)]">Previous Visit Days</h3>
                {request.previousVisitDays?.length ? request.previousVisitDays.map(day => (
                  <p key={day.id} className="mt-2 text-xs">Request <strong>{day.requestNumber}</strong> | Visit Date: {day.visitDate} | Status: {formatStatus(day.status)}</p>
                )) : <p className="mt-2 text-xs text-[var(--muted)]">No previous visit days.</p>}
              </div>
            </div>
          </Info>

          <Info title="Audit Timeline">
            {request.auditHistory.length ? request.auditHistory.map(item => (
              <p key={item.id} className="border-b border-[var(--silver)] pb-2 text-xs">
                <strong>{formatStatus(item.action)}</strong> | {item.details} | {new Date(item.createdAt).toLocaleString()}
              </p>
            )) : <p>No audit events recorded.</p>}
          </Info>
        </>
      )}

      {showInfoModal && (
        <Modal title="Request Additional Information">
          <p className="text-sm text-[var(--muted)]">This will set status to Pending Documentation and notify the Host.</p>
          <TextArea id="infoComment" label="EC Query / Details Required" value={infoComment} onChange={setInfoComment} />
          <ModalActions onCancel={() => setShowInfoModal(false)}>
            <button disabled={acting || !infoComment.trim()} type="button" onClick={() => void handleRequestInfo()} className="cursor-pointer rounded bg-[var(--royal-blue)] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">Submit Request</button>
          </ModalActions>
        </Modal>
      )}

      {showRejectModal && (
        <Modal title="Reject Visitor Request" titleClass="text-[#dc3545]">
          <p className="text-sm text-[var(--muted)]">Provide a mandatory rejection comment for Export Control records.</p>
          <TextArea id="rejectReason" label="Rejection Reason" value={rejectReason} onChange={setRejectReason} />
          <ModalActions onCancel={() => setShowRejectModal(false)}>
            <button disabled={acting || !rejectReason.trim()} type="button" onClick={() => void handleReject()} className="cursor-pointer rounded bg-[#dc3545] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">Reject Request</button>
          </ModalActions>
        </Modal>
      )}

      {showVerifyModal && (
        <Modal title="Verify Visitor Identity & Assets">
          <Input label="ID Type" value={verifyIdType} onChange={setVerifyIdType} />
          <Input label="ID Last 4 Digits" value={verifyIdLast4} onChange={value => setVerifyIdLast4(value.replace(/\D/g, '').slice(0, 4))} maxLength={4} />
          <ModalActions onCancel={() => setShowVerifyModal(false)}>
            <button disabled={acting} type="button" onClick={() => void handleVerify()} className="cursor-pointer rounded bg-[var(--royal-blue)] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">Confirm Verification</button>
          </ModalActions>
        </Modal>
      )}

      {showCheckInModal && (
        <Modal title="Issue Visitor Badge & Check-In">
          <Input label="Badge Number" value={badgeNumber} onChange={setBadgeNumber} />
          <ModalActions onCancel={() => setShowCheckInModal(false)}>
            <button disabled={acting || !badgeNumber.trim()} type="button" onClick={() => void handleCheckIn()} className="cursor-pointer rounded bg-[#28a745] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">Complete Check-In</button>
          </ModalActions>
        </Modal>
      )}

      {showHoldModal && (
        <Modal title="Place Visitor on Hold" titleClass="text-[#856404]">
          <TextArea id="holdText" label="Hold Details / Comment" value={holdComment} onChange={setHoldComment} />
          <ModalActions onCancel={() => setShowHoldModal(false)}>
            <button disabled={acting} type="button" onClick={() => void handleHold()} className="cursor-pointer rounded bg-[#ffc107] px-4 py-2 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-60">Confirm Hold</button>
          </ModalActions>
        </Modal>
      )}
    </div>
  )
}

function Actions({ role, status, acting, onAction }: { role: string; status: string; acting: boolean; onAction: (name: string, values?: Record<string, string>) => Promise<void> }) {
  const button = (name: string, label: string, values?: Record<string, string>) => (
    <button disabled={acting} type="button" onClick={() => void onAction(name, values)} className="cursor-pointer rounded-[4px] bg-[var(--royal-blue)] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">{label}</button>
  )
  const host = role === 'HOST_REQUESTER'
  return (
    <div className="flex flex-wrap gap-2">
      {host && status === 'VISITOR_FORM_SUBMITTED' && button('host-review', 'Review visitor form')}
      {host && status === 'HOST_REVIEW' && button('send-to-ec', 'SEND TO EC')}
      {host && status === 'HOST_DPS' && button('dps', 'Submit host DPS', { dpsPerformer: 'HOST_REQUESTER', dpsResult: 'Clear' })}
    </div>
  )
}

function Info({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border border-[var(--silver)] bg-white p-6">
      <h2 className="display text-xl font-bold text-[var(--royal-blue)]">{title}</h2>
      <div className="mt-4 space-y-2 text-sm text-[var(--ink)]">{children}</div>
    </section>
  )
}

function Field({ label, value, strong = false }: { label: string; value?: string; strong?: boolean }) {
  return <p><strong>{label}:</strong> <span className={strong ? 'font-bold text-[var(--royal-blue)]' : ''}>{value || 'N/A'}</span></p>
}

function AttendanceToggle({ label, category, record, onToggle }: { label: string; category: string; record?: { completed: boolean; markedAt?: string }; onToggle: (category: string, currentCompleted: boolean) => Promise<void> }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 text-sm">
      <input type="checkbox" checked={record?.completed ?? false} onChange={() => void onToggle(category, record?.completed ?? false)} className="cursor-pointer" />
      <span className="font-semibold text-[var(--ink)]">{label}</span>
      {record?.markedAt && <span className="text-xs text-[var(--muted)]">Marked: {new Date(record.markedAt).toLocaleString()}</span>}
    </label>
  )
}

function ActionButton({ children, disabled, onClick, tone = 'primary' }: { children: ReactNode; disabled: boolean; onClick: () => void; tone?: 'primary' | 'success' | 'warning' }) {
  const color = tone === 'success' ? 'bg-[#28a745] text-white' : tone === 'warning' ? 'bg-[#ffc107] text-black' : 'bg-[var(--royal-blue)] text-white'
  return <button disabled={disabled} type="button" onClick={onClick} className={`cursor-pointer rounded px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${color}`}>{children}</button>
}

function Modal({ title, titleClass = 'text-[var(--royal-blue)]', children }: { title: string; titleClass?: string; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg border border-[var(--silver)] bg-white p-6 shadow-xl">
        <h2 className={`display text-xl font-bold ${titleClass}`}>{title}</h2>
        <div className="mt-4 space-y-4">{children}</div>
      </div>
    </div>
  )
}

function ModalActions({ onCancel, children }: { onCancel: () => void; children: ReactNode }) {
  return (
    <div className="mt-6 flex justify-end gap-3">
      <button type="button" onClick={onCancel} className="cursor-pointer border border-[var(--silver)] px-4 py-2 text-sm font-semibold text-[var(--ink)]">Cancel</button>
      {children}
    </div>
  )
}

function TextArea({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label htmlFor={id} className="block text-xs font-semibold uppercase text-[var(--muted)]">
      {label}
      <textarea id={id} rows={4} className="mt-2 w-full border border-[var(--silver)] p-3 text-sm font-normal text-[var(--ink)]" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  )
}

function Input({ label, value, onChange, maxLength }: { label: string; value: string; onChange: (value: string) => void; maxLength?: number }) {
  return (
    <label className="block text-xs font-semibold uppercase text-[var(--muted)]">
      {label}
      <input type="text" maxLength={maxLength} className="mt-2 w-full border border-[var(--silver)] p-3 text-sm font-normal text-[var(--ink)]" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  )
}

function formatClassification(value?: string) {
  if (value === 'GtrRedTag') return 'GTR — Red Tag'
  if (value === 'Vendor') return 'Vendor'
  if (value === 'Visitor') return 'Visitor'
  return value || 'N/A'
}
