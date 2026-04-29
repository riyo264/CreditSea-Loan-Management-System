import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import {
  submitPersonalDetails,
  uploadSalarySlip,
  applyForLoan,
  getStatus,
} from '../controllers/applicationController';

const router = Router();

// Multer Storage Config 
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `salary-slip-${unique}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, JPG, and PNG files are allowed.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

// Routes (all require borrower auth)
router.post(
  '/personal-details',
  authenticate,
  authorize('borrower'),
  submitPersonalDetails
);

router.post(
  '/upload-salary-slip',
  authenticate,
  authorize('borrower'),
  upload.single('salarySlip'),
  uploadSalarySlip
);

router.post('/apply', authenticate, authorize('borrower'), applyForLoan);

router.get('/status', authenticate, authorize('borrower'), getStatus);

export default router;