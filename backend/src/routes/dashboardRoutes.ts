import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import {
  getSalesLeads,
  getSanctionQueue,
  sanctionLoan,
  getDisbursementQueue,
  disburseLoan,
  getCollectionQueue,
  recordPayment,
  getLoanPayments,
} from '../controllers/dashboardController';

const router = Router();

// All dashboard routes require authentication
router.use(authenticate);

// SALES (admin or sales role)
router.get('/sales', authorize('admin', 'sales'), getSalesLeads);

// SANCTION (admin or sanction role)
router.get('/sanction', authorize('admin', 'sanction'), getSanctionQueue);
router.put('/sanction/:loanId', authorize('admin', 'sanction'), sanctionLoan);

// DISBURSEMENT (admin or disbursement role)
router.get('/disbursement', authorize('admin', 'disbursement'), getDisbursementQueue);
router.put('/disbursement/:loanId', authorize('admin', 'disbursement'), disburseLoan);

// COLLECTION (admin or collection role)
router.get('/collection', authorize('admin', 'collection'), getCollectionQueue);
router.post('/collection/:loanId/payment', authorize('admin', 'collection'), recordPayment);
router.get('/collection/:loanId/payments', authorize('admin', 'collection'), getLoanPayments);

export default router;