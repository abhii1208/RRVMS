import type { DashboardResponse, EcDashboardResponse, ReceptionDashboardResponse, ReceptionVisitor } from '../services/apiClient'

const demoItems = [
  { id: 'demo-visitor-001', requestNumber: 'RRVMS-DEMO-001', batchId: 'BATCH-DEMO-001', visitorName: 'Daniel Carter', companyName: 'Northstar Engineering Ltd.', currentStatus: 'APPROVED', createdAt: '2026-09-14T08:15:00Z', visitDate: '2026-09-15', hostName: 'Alex Morgan', currentStage: 'Reception ready' },
  { id: 'demo-visitor-002', requestNumber: 'RRVMS-DEMO-002', batchId: 'BATCH-DEMO-002', visitorName: 'Neha Kapoor', companyName: 'Meridian Systems', currentStatus: 'PENDING_DOCUMENTATION', createdAt: '2026-09-13T14:20:00Z', visitDate: '2026-09-16', hostName: 'Sarah Williams', currentStage: 'Documentation' },
  { id: 'demo-visitor-003', requestNumber: 'RRVMS-DEMO-003', batchId: 'BATCH-DEMO-003', visitorName: 'Michael Turner', companyName: 'Apex Turbine Research', currentStatus: 'EC_REVIEW', createdAt: '2026-09-13T10:40:00Z', visitDate: '2026-09-18', hostName: 'Arjun Mehta', dpsStatus: 'Clear', currentStage: 'Export Control Review' },
  { id: 'demo-visitor-004', requestNumber: 'RRVMS-DEMO-004', batchId: 'BATCH-DEMO-004', visitorName: 'Emily Collins', companyName: 'Vector Industrial Services', currentStatus: 'RECEPTION_HOLD', createdAt: '2026-09-12T16:05:00Z', visitDate: '2026-09-14', hostName: 'Alex Morgan', currentStage: 'Reception hold' },
  { id: 'demo-visitor-005', requestNumber: 'RRVMS-DEMO-005', batchId: 'BATCH-DEMO-005', visitorName: 'Priya Sharma', companyName: 'Orion Engineering Group', currentStatus: 'REJECTED', createdAt: '2026-09-11T09:30:00Z', visitDate: '2026-09-17', hostName: 'Sarah Williams', currentStage: 'Closed' },
  { id: 'demo-visitor-006', requestNumber: 'RRVMS-DEMO-006', batchId: 'BATCH-DEMO-006', visitorName: 'Arjun Mehta', companyName: 'Northstar Engineering Ltd.', currentStatus: 'CHECKED_IN', createdAt: '2026-09-10T11:10:00Z', visitDate: '2026-09-14', hostName: 'Michael Turner', currentStage: 'On site' },
  { id: 'demo-visitor-007', requestNumber: 'RRVMS-DEMO-007', batchId: 'BATCH-DEMO-007', visitorName: 'Sarah Williams', companyName: 'Meridian Systems', currentStatus: 'CHECKED_OUT', createdAt: '2026-09-09T13:00:00Z', visitDate: '2026-09-13', hostName: 'Alex Morgan', currentStage: 'Completed' },
  { id: 'demo-visitor-008', requestNumber: 'RRVMS-DEMO-008', batchId: 'BATCH-DEMO-008', visitorName: 'Alex Morgan', companyName: 'Apex Turbine Research', currentStatus: 'DRAFT', createdAt: '2026-09-08T15:25:00Z', visitDate: '2026-09-22', hostName: 'Priya Sharma', currentStage: 'Draft' },
]

export const demoDashboard: DashboardResponse = {
  totalRequests: 8,
  pendingActions: 3,
  todaysVisits: 3,
  currentlyInside: 1,
  upcomingVisits: 4,
  noShows: 1,
  pendingEcReviews: 2,
  pendingDocumentation: 1,
  recentRequests: demoItems,
}

export const demoEcDashboard: EcDashboardResponse = {
  pendingEcReviews: 2,
  pendingDocumentation: 1,
  dpsFlags: 1,
  approved: 3,
  rejected: 1,
  visitorHistory: 5,
  attendance: 2,
  pendingEcReviewsItems: demoItems.filter(item => item.currentStatus === 'EC_REVIEW'),
  pendingDocumentationItems: demoItems.filter(item => item.currentStatus === 'PENDING_DOCUMENTATION'),
  dpsFlagsItems: demoItems.filter(item => item.currentStatus === 'RECEPTION_HOLD'),
}

const receptionItems: ReceptionVisitor[] = demoItems.slice(0, 6).map((item, index) => ({
  id: item.id,
  visitDate: item.visitDate ?? '2026-09-14',
  status: ['CHECKED_IN', 'CHECKED_OUT', 'RECEPTION_HOLD', 'UPCOMING', 'NO_SHOW', 'RECEPTION_VERIFICATION'][index],
  requestId: item.id,
  requestNumber: item.requestNumber,
  batchId: item.batchId ?? '',
  visitorName: item.visitorName,
  company: item.companyName,
  mainHost: item.hostName ?? 'Alex Morgan',
  escort: index % 2 === 0 ? 'Sarah Williams' : null,
  faculty: index % 3 === 0,
  gtr: index % 3 === 1,
  idClassification: index % 2 === 0 ? 'Visitor' : 'Vendor',
  approvalStatus: index === 2 ? 'RECEPTION_HOLD' : 'APPROVED',
  idType: index % 2 === 0 ? 'Passport' : 'National ID',
  idLast4: `${4821 + index}`.slice(-4),
  badge: index < 2 ? `BADGE-DEMO-${index + 1}` : null,
  assets: [{ id: `demo-asset-${index}`, assetType: index % 2 === 0 ? 'Laptop' : 'Tablet', description: 'Synthetic declared equipment', serialNumber: `ASSET-DEMO-${index + 1}`, verificationStatus: 'Verified' }],
}))

export const demoReceptionDashboard: ReceptionDashboardResponse = {
  todaysVisitors: 6,
  expected: 2,
  arrived: 2,
  onHold: 1,
  currentlyInside: 1,
  checkedOut: 2,
  noShow: 1,
  items: receptionItems,
}
