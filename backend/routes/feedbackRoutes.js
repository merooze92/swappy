import { Router } from 'express'
import { createFeedback, listFeedback } from '../controller/feedbackController.js'
import { allowRoles, requireAuth } from '../middleware/auth.js'

const router = Router()

router.use(requireAuth)
router.get('/', listFeedback)
router.post('/', allowRoles('seeker', 'provider'), createFeedback)

export default router
