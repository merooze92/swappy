import { Router } from 'express'
import { createExchange, listExchanges, updateExchange } from '../controller/exchangeController.js'
import { allowRoles, requireAuth } from '../middleware/auth.js'

const router = Router()

router.use(requireAuth)
router.get('/', listExchanges)
router.post('/', allowRoles('seeker'), createExchange)
router.patch('/:id', updateExchange)

export default router
