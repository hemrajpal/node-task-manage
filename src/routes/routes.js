const express = require('express');

const router = express.Router();
const employeeController = require('../controllers/employeeController');
const projectController = require('../controllers/projectController');
const taskController = require('../controllers/taskController');

router.post('/employees', employeeController.create);
router.get('/employees', employeeController.get);
router.post('/projects', projectController.create);
router.get('/projects', projectController.get);
router.delete('/projects/:id', projectController.deleteProject);
router.post('/tasks', taskController.create);
router.get('/tasks', taskController.get);
router.put('/tasks/:id', taskController.update);

module.exports = router;