const utilPromise = require('util')

let {
  getConnectionObject
} = require('./dbconnection')

module.exports.getConnection = async () => {
  const connection = await getConnectionObject()
  if (!connection) throw new Error('Database connection not found')

  return utilPromise.promisify(connection.query).bind(connection)
}

module.exports.makePayloadFromObj = setDoc => {
  return `(${Object.values(setDoc)
    .map(item => {
      if (typeof item === 'boolean') return item

      if (item === null || item === 'NULL') return 'null'

      if (typeof item === 'number') return item

      if (typeof item === 'string') return `'${item}'`
    })
    .join()})`
}
module.exports.makeCondition = condition => {
  return Object.keys(condition).map(key => {
    let value
    const v = condition[key]

    if (v === null || v === 'NULL' || v === 'null') {
      return `${key}='null'`
    } else if (typeof v === 'string') {
      value = v.replace(/'/g, '`')
      return `${key}='${value}'`
    } else if (typeof v === 'object') {
      if (Array.isArray(v)) {
        value = JSON.stringify(v)
          .replace('[', '(')
          .replace(']', ')')
        return `${key} in ${value.replace(/"/g, '\'')} `
      }
    } else if (typeof v === 'number' || typeof v === 'boolean' || v) {
      value = v
      return `${key}=${value}`
    }
  })
}
module.exports.addSeparator = array => {
  let result = ''
  array.forEach(item => {
    if (result === '') {
      result = item
    } else {
      result += ' and ' + item
    }
  })
  return result
}

module.exports.getUser = async () => {
  let connection
  try {
    connection = getConnectionObject()
    const queryString = utilPromise.promisify(connection.query).bind(connection)
    if (!connection) throw new Error('Database connection not found')

    const query = `
        SELECT 
          *
        FROM user
        WHERE is_deleted=0
        `

    console.log('query:', query)

    return await queryString(query)

  } catch (err) {
    console.log('err:', err)
    throw err
  }
}

// module.exports.find = async (email) => {
//   let connection
//   try {
//     connection = getConnectionObject()
//     const queryString = utilPromise.promisify(connection.query).bind(connection)
//     if (!connection) throw new Error('Database connection not found')

//     const query = `
//       SELECT 
//         *
//       FROM user
//       WHERE 
//       email =  '${email}'
//       `

//     console.log('query:', query)

//     return await queryString(query)

//   } catch (err) {
//     console.log('err:', err)
//     throw err
//   } finally {
//     connection.end() // Closing DB Connection
//   }
// }

module.exports.findById = async (tableName, id) => {
  let connection
  try {
    connection = getConnectionObject()
    const queryString = utilPromise.promisify(connection.query).bind(connection)
    if (!connection) throw new Error('Database connection not found')

    const query = `
      SELECT 
        *
      FROM ${tableName}
      WHERE 
      id =  '${id}' AND is_deleted = 0 
      `

    console.log('query:', query)

    return await queryString(query)

  } catch (err) {
    console.log('err:', err)
    throw err
  } finally {
    connection.end() // Closing DB Connection
  }
}

module.exports.getAssignmentsForTutor = async (id, assignmentId) => {
  let connection
  try {
    connection = getConnectionObject()
    const queryString = utilPromise.promisify(connection.query).bind(connection)
    if (!connection) throw new Error('Database connection not found')

    const query = `
    SELECT 
    assignment.id,
    assignment.title,
    assignment.description,
    assignment.published_at,
    assignment.deadline,
    user.id AS student__id,
    user.first_name AS student__first_name,
    user.last_name AS student__last_name,
    user.email AS student__email,
    assignment_student.remark AS remark
    FROM assignment 
    INNER JOIN assignment_student 
    ON (assignment.id = assignment_student.assignment_id AND assignment_student.is_submitted = 1)
    INNER JOIN 
    user on (assignment_student.user_id = user.id AND user.is_deleted=0)
    where assignment.id = '${assignmentId}' AND assignment.published_by = '${id}' AND assignment.is_deleted=0
      `

    console.log('query:', query)

    return await queryString(query)

  } catch (err) {
    console.log('err:', err)
    throw err
  } finally {
    connection.end() // Closing DB Connection
  }
}
module.exports.getAssignmentFeedForTutor = async (id) => {
  let connection
  try {
    connection = getConnectionObject()
    const queryString = utilPromise.promisify(connection.query).bind(connection)
    if (!connection) throw new Error('Database connection not found')

    const query = `
    SELECT 	
		id,
        title,
        description,
        published_at,
        published_by,
        deadline,
        CASE
        WHEN
            published_at > UNIX_TIMESTAMP() 
        THEN
            'scheduled'
        WHEN
            published_at < UNIX_TIMESTAMP() AND deadline > UNIX_TIMESTAMP()
        THEN
            'ongoing'
    END AS status
      FROM assignment where published_by = '${id}' AND is_deleted=0 
      `

    console.log('query:', query)

    return await queryString(query)

  } catch (err) {
    console.log('err:', err)
    throw err
  } finally {
    connection.end() // Closing DB Connection
  }
}
module.exports.getAssignmentsForStudent = async (id, assignmentId) => {
  let connection
  try {
    connection = getConnectionObject()
    const queryString = utilPromise.promisify(connection.query).bind(connection)
    if (!connection) throw new Error('Database connection not found')

    const query = `
    SELECT 
    assignment.id,
    assignment.title,
    assignment.description,
    assignment.published_at,
    assignment.published_by,
    assignment.deadline,
    CASE
        WHEN
            assignment_student.is_submitted 
        THEN
            'submitted'
        WHEN
            assignment.deadline < UNIX_TIMESTAMP() 
        THEN
            'overdue'
        WHEN
            assignment.deadline > UNIX_TIMESTAMP() AND UNIX_TIMESTAMP() > assignment.published_at
        THEN
            'pending'
    END AS status
  FROM
  assignment_student
          LEFT JOIN
  assignment ON (assignment_student.assignment_id = assignment.id )
      WHERE
      assignment_student.user_id = '${id}'
      AND assignment_student.assignment_id = '${assignmentId}'
              AND assignment_student.is_deleted = 0
      `

    return await queryString(query)

  } catch (err) {
    console.log('err:', err)
    throw err
  } finally {
    connection.end() // Closing DB Connection
  }
}

module.exports.getAssignmentsFeedForStudent = async (id) => {
  let connection
  try {
    connection = getConnectionObject()
    const queryString = utilPromise.promisify(connection.query).bind(connection)
    if (!connection) throw new Error('Database connection not found')

    const query = `
    SELECT 
    assignment.id,
    assignment.title,
    assignment.description,
    assignment.published_at,
    assignment.published_by,
    assignment.deadline,
    CASE
        WHEN
            assignment_student.is_submitted 
        THEN
            'submitted'
        WHEN
            assignment.deadline < UNIX_TIMESTAMP() 
        THEN
            'overdue'
        ELSE 'pending'
    END AS status
  FROM
  assignment_student
          LEFT JOIN
  assignment ON (assignment_student.assignment_id = assignment.id )
      WHERE
      assignment_student.user_id = '${id}'
              AND assignment_student.is_deleted = 0
      `

    return await queryString(query)

  } catch (err) {
    console.log('err:', err)
    throw err
  } finally {
    connection.end() // Closing DB Connection
  }
}

module.exports.findAssignmentByUserId = async (tableName, assignmentId, userId) => {
  let connection
  try {
    connection = getConnectionObject()
    const queryString = utilPromise.promisify(connection.query).bind(connection)
    if (!connection) throw new Error('Database connection not found')

    const query = `
      SELECT 
        *
      FROM ${tableName}
      WHERE 
      assignment_id =  '${assignmentId}' AND user_id = '${userId}' AND is_deleted = 0 
      `

    console.log('query:', query)

    return await queryString(query)

  } catch (err) {
    console.log('err:', err)
    throw err
  } finally {
    connection.end() // Closing DB Connection
  }
}

module.exports.submitAssignmentByUserId = async (tableName, assignmentId, userId) => {
  let connection
  try {
    connection = getConnectionObject()
    const queryString = utilPromise.promisify(connection.query).bind(connection)
    if (!connection) throw new Error('Database connection not found')

    const query = `
    update ${tableName} 
    set ${makeDoc} where ${this.addSeparator(sets)}

      `



    console.log('query:', query)

    return await queryString(query)

  } catch (err) {
    console.log('err:', err)
    throw err
  } finally {
    connection.end() // Closing DB Connection
  }
}

module.exports.insert = async (tableName, obj) => {
  let connection
  try {
    connection = getConnectionObject()
    const queryString = utilPromise.promisify(connection.query).bind(connection)
    if (!connection) throw new Error('Database connection not found')

    const tablePromises = []
    tablePromises.push(this.makePayloadFromObj(obj))
    const keys = Object.keys(obj)

    const query = `INSERT INTO ${tableName} 
          (${keys}) VALUES ${tablePromises.join()}`

    console.log('query:', query)

    return await queryString(query)

  } catch (err) {
    console.log('err:', err)
    throw err
  } finally {
    connection.end() // Closing DB Connection
  }
}

module.exports.insertManyIntoTable = async (tableName, arrayOfObject) => {
  return new Promise(async (resolve, reject) => {
    let connection = getConnectionObject()
    if (!connection) throw new Error('Database connection not found')

    let tablePromises = []

    const insertManySQL = (tableName, keys, values) => {
      const query = `INSERT INTO ${tableName} (${keys}) VALUES ${values}`
      console.log('query:', query)
      try {
        connection.query(query, (err, doc) => {
          if (err) {
            console.error(err)
            reject(err)
          } else resolve(doc)
        })
      } catch (err) {
        console.log('err:', err)
        reject(err)
      } finally {
        console.log('final')
        connection.end()
      }
    }

    for (let j = 0; j <= arrayOfObject.length; j++) {
      const result = arrayOfObject.slice(j, j + 1)

      if (result.length === 0) {
        insertManySQL(
          tableName,
          Object.keys(arrayOfObject[0]),
          tablePromises.join()
        )
        break
      }
      tablePromises.push(await this.makePayloadFromObj(result[0]))
    }
  })
}

module.exports.updateAll = async (tableName, condition, updateDoc) => {
  console.log("updateDoc", updateDoc)
  return new Promise(async (resolve, reject) => {
    const connection = getConnectionObject()
    if (!connection) throw new Error('Database connection not found')
    const makeDoc = Object.keys(updateDoc).map(key => {
      let value
      const v = updateDoc[key]
      // v = updateDoc[key] || undefined
      if (v === null) {
        return `${key}=${null}`
      } else if (typeof v === 'string') {
        value = v.replace(/'/g, '`')
        return `${key}='${value}'`
      } else if (typeof v === 'object') {
        if (Array.isArray(v)) {
          value = JSON.stringify(v)
            .replace('[', '{')
            .replace(']', '}')
          return `${key}='${value}'`
        }
      } else if (
        typeof v === 'number' ||
        typeof v === 'boolean' ||
        v ||
        typeof updateDoc[key] === 'boolean'
      ) {
        value = v
        return `${key}=${value}`
      }
    })
    const sets = this.makeCondition(condition)

    const query = `update ${tableName} 
      set ${makeDoc} where ${this.addSeparator(sets)}`
    console.log('query:', query)

    try {
      connection.query(query, (err, doc) => {
        if (err) {
          console.log(err)
          reject(err)
        } else resolve(doc)
      })
    } catch (err) {
      console.log('err:', err)
      reject(err)
    } finally {
      connection.end() // Closing DB Connection
    }
  })
}

module.exports.find = async (email) => {
  return new Promise(async (resolve, reject) => {
    const connection = getConnectionObject()
    if (!connection) throw new Error('Database connection not found')
    
    const query = `
      SELECT 
        *
      FROM user
      WHERE 
      email =  '${email}'
      `

    try {
      connection.query(query, (err, doc) => {
        if (err) {
          console.log(err)
          reject(err)
        } else resolve(doc)
      })
    } catch (err) {
      console.log('err:', err)
      reject(err)
    } finally {
      connection.end() // Closing DB Connection
    }
  })
}