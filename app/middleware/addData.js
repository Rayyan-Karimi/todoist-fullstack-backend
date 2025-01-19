import { performance } from 'perf_hooks';
import generateComments from '../db/dataGeneration/comments.js';
import generateProjects from '../db/dataGeneration/projects.js';
import generateTasks from '../db/dataGeneration/tasks.js';
import generateUsers from '../db/dataGeneration/users.js';
import { db } from '../db/db.config.js';
const BATCH_SIZE = 1000;

// Helper function to insert data in batches
const insertBatch = (tableName, columns, data) => {
    const placeholders = `(${columns.map(() => '?').join(", ")})`;
    const query = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES ${data.map(() => placeholders).join(', ')}`;
    const flattenedData = data.flat();

    return new Promise((resolve, reject) => {
        db.run(query, flattenedData, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
};

// Insert tasks
let tasksTime = 0
const insertTasks = async (numberOfTasks, maxProjects) => {
    console.log('Inserting tasks...')
    const start = performance.now()
    for (let i = 0; i < numberOfTasks; i += BATCH_SIZE) {
        const batch = generateTasks(Math.min(BATCH_SIZE, numberOfTasks - i), maxProjects) // don’t generate more records than needed in the last batch.
        const data = batch.map(task => [
            task.content,
            task.description,
            task.due_date,
            task.is_completed,
            task.project_id
        ]);
        try {
            await insertBatch('tasks', ['content', 'description', 'dueDate', 'isCompleted', 'projectId'], data);
            console.log(`Inserted ${i + BATCH_SIZE} tasks...`)
        } catch (err) {
            console.error(`Error inserting tasks in batch ${i} to ${i + BATCH_SIZE}: ${err}`);
        }
    }
    const end = performance.now()
    tasksTime = (end - start) / 1000;
}

let projectsTime = 0
// Insert projects into DB
const insertProjects = async (numberOfProjects, maxUsers) => {
    console.log("Inserting projects...")
    const start = performance.now();
    for (let i = 0; i < numberOfProjects; i += BATCH_SIZE) {
        const batch = generateProjects(Math.min(BATCH_SIZE, numberOfProjects - i), maxUsers); // don’t generate more records than needed in the last batch.
        const data = batch.map(project => [
            // project.name, project.color, project.isFavorite, project.userId
            project.name, project.color, project.isFavorite
        ]);
        try {
            await insertBatch('projects', ['name', 'color', 'isFavorite'], data);
            console.log(`Inserted ${i + BATCH_SIZE} projects...`)
        } catch (err) {
            console.error(`Error inserting projects: ${err}`)
        }
    }
    const end = performance.now()
    projectsTime = (end - start) / 1000
}

let commentsTime = 0
// Insert projects into DB
const insertComments = async (numberOfComments, numberOfProjects, numberOfTasks, numberOfUsers) => {
    console.log("Inserting comments...")
    const start = performance.now();
    for (let i = 0; i < numberOfProjects; i += BATCH_SIZE) {
        const batch = generateComments(Math.min(BATCH_SIZE, numberOfComments - i), numberOfProjects, numberOfTasks, numberOfUsers); // don’t generate more records than needed in the last batch.
        const data = batch.map(comment => [
            comment.content, comment.projectId, comment.taskId, comment.userId
        ]);
        try {
            await insertBatch('comments', ['content', 'projectId', 'taskId', 'userId'], data);
            console.log(`Inserted ${i + BATCH_SIZE} comments...`)
        } catch (err) {
            console.error(`Error inserting comments: ${err}`)
        }
    }
    const end = performance.now()
    commentsTime = (end - start) / 1000
}

let usersTime = 0
// Insert projects into DB
const insertUsers = async (numberOfUsers) => {
    console.log("Inserting users...")
    const start = performance.now();
    for (let i = 0; i < numberOfUsers; i += BATCH_SIZE) {
        const batch = generateUsers(Math.min(BATCH_SIZE, numberOfUsers - i)); // don’t generate more records than needed in the last batch.
        const data = batch.map(user => [
            user.name, user.email, user.password
        ]);
        try {
            await insertBatch('users', ['name', 'email', 'password'], data);
            console.log(`Inserted ${i + BATCH_SIZE} users...`)
        } catch (err) {
            console.error(`Error inserting users: ${err}`)
        }
    }
    const end = performance.now()
    usersTime = (end - start) / 1000
}

// Main function to generate and insert data
const main = async () => {
    const numberOfProjects = 100 // 1000000
    const numberOfTasks = 1000 // 10000000
    const numberOfUsers = 10;
    // const numberOfComments = 10000;

    try {
        await insertUsers(numberOfUsers)
        await insertProjects(numberOfProjects, numberOfUsers)
        await insertTasks(numberOfTasks, numberOfProjects)
        // await insertComments(numberOfComments, numberOfProjects, numberOfTasks, numberOfUsers)
        console.log(`Users insertion time: ${usersTime} seconds`);
        console.log(`Projects insertion time: ${projectsTime} seconds`);
        console.log(`Tasks insertion time: ${tasksTime} seconds`);
        // console.log(`Comments insertion time: ${commentsTime} seconds`);
    } catch (err) {
        console.error("Error in data insertion:", err);
    }
}

main();
