import { Router } from 'express';
import { repairController } from '../controllers/RepairController.ts';

const router = Router();

router.post('/', repairController.createRepair.bind(repairController));
router.get('/:id', repairController.getRepair.bind(repairController));
router.get('/:id/trace', repairController.getTraceEvents.bind(repairController));
router.post('/:id/complete', repairController.completeRepair.bind(repairController));
router.post('/:id/reschedule', repairController.rescheduleRepair.bind(repairController));
router.post('/:id/cancel', repairController.cancelRepair.bind(repairController));

export default router;
