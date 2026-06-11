import { Router } from 'express';
import { batchController } from '../controllers/BatchController.ts';

const router = Router();

router.get('/', batchController.getAllBatches.bind(batchController));
router.get('/:batchCode', batchController.getBatch.bind(batchController));
router.get('/:batchCode/compatible', batchController.getCompatibleBatches.bind(batchController));
router.get('/:batchCode/check', batchController.checkCompatibility.bind(batchController));

export default router;
