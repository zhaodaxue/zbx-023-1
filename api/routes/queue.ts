import { Router } from 'express';
import { queueController } from '../controllers/QueueController.ts';

const router = Router();

router.get('/', queueController.getDailyQueue.bind(queueController));
router.get('/capacity', queueController.getSlotCapacity.bind(queueController));
router.get('/sandbox', queueController.getSevenDaySandbox.bind(queueController));
router.get('/preview', queueController.getSlotPreview.bind(queueController));

export default router;
