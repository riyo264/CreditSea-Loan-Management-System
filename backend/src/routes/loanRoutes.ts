import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { upload } from '../middleware/uploadMiddleware';
import {
  submitPersonalDetails,
  uploadSalarySlip,
  applyForLoan,
  getStatus,
} from '../controllers/applicationController';

const router = Router();

// All borrower routes require the user to be logged in and have the 'borrower' role
router.use(authenticate);
router.use(authorize('borrower'));

// Step 1: Submit details and run the Business Rule Engine
router.post('/personal-details', submitPersonalDetails);

// Step 2: Upload document (Multer intercepts the 'salarySlip' field)
router.post('/upload-salary-slip', upload.single('salarySlip'), uploadSalarySlip);

// Step 3: Finalize and submit the loan application
router.post('/apply', applyForLoan);

// Check current status
router.get('/status', getStatus);

export default router;