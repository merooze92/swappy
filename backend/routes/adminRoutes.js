import { Router } from 'express'
import { listActivity, listAllExchanges, listUsers, updateUser } from '../controller/adminController.js'
import { createAdminSkill, deleteAdminSkill, listSkills, updateAdminSkill } from '../controller/skillController.js'
import { allowRoles, requireAuth } from '../middleware/auth.js'

const router = Router()

router.use(requireAuth, allowRoles('admin'))
router.get('/users', listUsers)
router.patch('/users/:id', updateUser)
router.get('/skills', listSkills)
router.post('/skills', createAdminSkill)
router.patch('/skills/:id', updateAdminSkill)
router.delete('/skills/:id', deleteAdminSkill)
router.get('/exchanges', listAllExchanges)
router.get('/activity', listActivity)

export default router
