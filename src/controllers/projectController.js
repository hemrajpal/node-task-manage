const db = require('../models/');

const create = async(req, res) => {
    const { name, description } = req.body;

    await db.Project.create({
        name: name,
        description: description
    })

    res.status(201).json({success: true, message: 'Created successfull'});
} 

const get = async(req, res) => {    

    const project = await db.Project.findAll({
        include: [
            {
                model: db.Task,
                as: 'tasks'
            }
        ]
    })

    res.status(200).json({success: true, data: project});
} 

const deleteProject = async(req, res) => {    

    const project = await db.Project.findByPk(req.params.id);

    if (!project) {
        return res.status(404).json({
            success: false,
            message: 'Project not found'
        });
    }

    await project.destroy();

    res.status(200).json({success: true, message: 'Delete successful'});
} 

module.exports = {
    create,
    get,
    deleteProject
}