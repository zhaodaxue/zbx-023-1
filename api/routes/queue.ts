import { Router } from 'express';
import { queueController } from '../controllers/QueueController.ts';

const router = Router();

router.get('/', queueController.getDailyQueue.bind(queueController));
router.get('/capacity', queueController.getSlotCapacity.bind(queueController));

export default router;
