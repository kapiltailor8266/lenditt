const express = require('express');
const router = express.Router();
const uuid = require('uuid').v4
const authenticateToken = require('../controller/auth');
const {
    insert,
    findById,
    insertManyIntoTable,
    updateAll,
    findAssignmentByUserId,
    getAssignmentsForTutor,
    getAssignmentsForStudent,
    getAssignmentFeedForTutor,
    getAssignmentsFeedForStudent } = require('../dbConfig/dbQueries')
const { filterAppointmentData } = require('../controller/filter');
const dotenv = require('dotenv');
dotenv.config();
const currentEpoch = Math.floor(new Date() / 1000)

// [ Create Assignment (Only Tutor can create) ]
router.post('/addassignment', authenticateToken, async (req, res) => {
    /**
       * 1. Check User is Tutor or Student 
       * 2. If student throw error.
       * 3. If Tutor then prepare payload for assignment table and insert into table..
       * 4. Prepare payload for assignment_student table and insert into table.
       * 4. retun success.
      **/

    if (req.user.userType === 'student') return res.status(403).send('You are not authorized to perform this action.')

    let assignmentId = uuid() // generate uuid for assignment

    const { title, description, students, published_at: publishedAt, deadline } = req.body

    // create payload for assignment
    const assignmentPayload = {
        id: assignmentId,
        title: title,
        description: description,
        published_by: req.user.id,
        published_at: publishedAt,
        deadline: deadline
    }
    // insert into table
    await insert('assignment', assignmentPayload)

    // prepare payload for assignment_student table
    let assignmentStudentMappingObject = []
    students.forEach((item) => {
        const object = {
            id: uuid(),
            assignment_id: assignmentId,
            user_id: item
        }
        assignmentStudentMappingObject.push(object)
    })
    // insert into table
    await insertManyIntoTable('assignment_student', assignmentStudentMappingObject)

    return res.json({ assignment: assignmentPayload, status: 'Assignment added successfully.' })
})


// [ Update Assignment ( Only Tutor can update) ]
router.post('/assignmentupdate', authenticateToken, async (req, res) => {
    /**
        * 1. Check User is Tutor or Student 
        * 2. If student throw error.
        * 3. Check for assignment if not exist throw error.
        * 4. Check published_by if not the user then throw error
        * 4. make payload for update in assignment and assignment_student table
        * 5. Update query and return success response.
       **/

    if (req.user.userType === 'tutor') {
        let assignmentExistence = await findById('assignment', req.body.assignment_id)
        assignmentExistence = assignmentExistence[0]
        console.log('assignmentExistence', assignmentExistence)
        // if the author has created the assignment then update it
        if (!assignmentExistence) return res.status(400).send(`Assignment does'nt exist`);
        else if (assignmentExistence.published_by !== req.user.id) {
            return res.status(403).send('You are not authorised to perform this action.');
        }
        else {
            const { assignment_id: assignmentId, title, description, published_at: publishedAt, deadline, add_student: addStudent, remove_student: removeStudent } = req.body
            const obj = {
                title: title,
                published_by: req.user.id,
                description: description,
                published_at: publishedAt,
                deadline: deadline
            }

            await updateAll('assignment', { id: assignmentId }, obj)

            // add remove student ids
            let addStudentArr = []
            addStudent.forEach((item) => {
                const object = {
                    id: uuid(),
                    assignment_id: assignmentId,
                    user_id: item
                }
                addStudentArr.push(object)
            })

            const removeObject = {
                is_deleted: 1,
                deleted_at: currentEpoch,
                deleted_by: req.user.id
            }

            await Promise.all([
                insertManyIntoTable('assignment_student', addStudentArr),
                updateAll('assignment_student', { assignment_id: assignmentId, user_id: removeStudent }, removeObject)]
            )

            return res.json({ success: "done" })
        }
    } else {
        return res.status(400).send(`Not authorized.`);
    }
})


// [ Delete Assignment (Only Tutor can delete) ]
router.post('/deleteassignment', authenticateToken, async (req, res) => {
    /**
         * 1. Check User is Tutor or Student 
         * 2. If student throw error.
         * 3. Check for assignment if not exist throw error.
         * 4. Check published_by if not the user then throw error
         * 4. make payload for for soft delete .
         * 5. Update query and return success response.
        **/
    if (req.user.userType === 'student') return res.status(403).send('Access Denied');
    else {
        let assignmentExistence = await findById('assignment', req.body.assignment_id)
        if (assignmentExistence.length === 0) return res.status(404).send('Assignment not found.')
        assignmentExistence = assignmentExistence[0]
        if (assignmentExistence.published_by !== req.user.id) return res.status(403).send('You are not authorized to perform this action');
        else {
            const deleteObject = {
                is_deleted: 1,
                deleted_at: currentEpoch,
                deleted_by: req.user.id
            }
            await updateAll('assignment', { id: req.body.assignment_id }, deleteObject)
            return res.json({
                success: "Assignment deleted successfully."
            })
        }
    }
})

// [ Assignment submission (Only Student can submit ) ]
router.post('/submitassignment', authenticateToken, async (req, res) => {
    /**
         * 1. Check User is Tutor or Student 
         * 2. If tutor throw error.
         * 3. Check for assignment if not exist throw error.
         * 4. If already submitted return response.
         * 4. Prepare payload for submission 
         * 5. Update query and return success response.
        **/

    const { remark, assignment_id: assignmentId } = req.body
    if (req.user.userType === 'tutor') {
        return res.status(403).send('Access Denied');
    }
    else {
        let assignmentDoc = await findAssignmentByUserId('assignment_student', assignmentId, req.user.id)
        if (assignmentDoc.length === 0) return res.status(200).send('Assignment not found.')
        console.log("assignmentDoc", assignmentDoc[0])
        let updateDoc = {}

        if (assignmentDoc[0].is_submitted === 1) return res.status(200).send('Assignment already submitted')
        else {
            updateDoc.is_submitted = 1
            updateDoc.remark = remark
            updateDoc.updated_at = currentEpoch
            updateDoc.updated_by = req.user.id
        }
        let condition = {
            assignment_id: assignmentId,
            user_id: req.user.id,
            is_deleted: 0
        }

        await updateAll('assignment_student', condition, updateDoc)

        return res.json({ status: "Assignment submitted successfully." })
    }

});

// [ Get Details of an Assignment (Tutor and Student) ]
router.post('/assignmentdetails', authenticateToken, async (req, res) => {
      /**
         * 1. Check User is Tutor or Student 
         * 2. Based on user fetch details of assignment
         * 3. return response
        **/

    if (req.user.userType === 'tutor') {
        let result = await getAssignmentsForTutor(req.user.id, req.body.assignment_id)
        let response = await filterAppointmentData(result)
        res.json({ data: response });
    } else {
        let result = await getAssignmentsForStudent(req.user.id, req.body.assignment_id)
        res.json({ data: result })
    }
})

// [ FEED for Tutor and Student both ]
router.get('/assignmentfeed', authenticateToken, async (req, res) => {
    /**
         * 1. Check User is Tutor or Student 
         * 2. Based on user fetch feed for user
         * 3. return response
        **/
    if (req.user.userType === 'tutor') {
        let result = await getAssignmentFeedForTutor(req.user.id)
        return res.json({ data: result })
    } else {
        let result = await getAssignmentsFeedForStudent(req.user.id)
        return res.json({ data: result })
    }
})


module.exports = router;