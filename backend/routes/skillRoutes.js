import { Router } from 'express'
import {
  createCategory,
  createSkill,
  createSkillRequest,
  deleteAdminSkill,
  listCategories,
  listSkillRequests,
  listSkills,
  updateAdminSkill,
  updateCategory,
  updateOwnSkill,
  updateOwnSkillRequest,
} from '../controller/skillController.js'
import { allowRoles, requireAuth } from '../middleware/auth.js'

const router = Router()

router.use(requireAuth)
router.get('/categories', listCategories)
router.post('/categories', allowRoles('admin'), createCategory)
router.patch('/categories/:id', allowRoles('admin'), updateCategory)
router.get('/requests', listSkillRequests)
router.post('/requests', allowRoles('seeker'), createSkillRequest)
router.patch('/requests/:id', allowRoles('seeker'), updateOwnSkillRequest)
router.get('/', listSkills)
router.post('/', allowRoles('provider'), createSkill)
router.patch('/:id', allowRoles('provider'), updateOwnSkill)

export default router
