const batchCollection = require("../db").db().collection("batches")
const usersCollection = require("../db").db().collection("users")
const { ObjectId } = require("mongodb")
const sanitizeHTML = require("sanitize-html")
const Notification=require("../models/Notification")
let Batch = function (data, username, batchId, teacherName) {
  this.data = data
  this.errors = []
  this.username = username
  this.batchId = batchId
  this.teacher = teacherName
}

Batch.prototype.cleanUp = function () {
  if (typeof this.data.stream != "string") {
    this.data.stream = ""
  }
  if (typeof this.data.classTime != "string") {
    this.data.classTime = ""
  }
  if (typeof this.data.class != "string") {
    this.data.class = ""
  }
  if (typeof this.data.subjects != "string") {
    this.data.subjects = ""
  }
  if (typeof this.data.expirationDate != "string") {
    this.data.expirationDate = ""
  }
  if (typeof this.data.session != "string") {
    this.data.session = ""
  }
  if (typeof this.data.studentsQuentity != "string") {
    this.data.studentsQuentity = ""
  }
  if (typeof this.data.days != "string") {
    this.data.days = ""
  }
  if (typeof this.data.batchMood != "string") {
    this.data.batchMood = ""
  }
  if (typeof this.data.district != "string") {
    this.data.district = ""
  }
  if (typeof this.data.policeStation != "string") {
    this.data.policeStation = ""
  }
  if (typeof this.data.postOffice != "string") {
    this.data.postOffice = ""
  }
  
  this.data.studentsQuentity = Number(this.data.studentsQuentity)
  this.data = {
    username: this.username,
    teacherName: this.teacher,
    stream: sanitizeHTML(this.data.stream.trim(), { allowedTags: [], allowedAttributes: {} }),
    class: sanitizeHTML(this.data.class.trim(), { allowedTags: [], allowedAttributes: {} }),
    subjects: sanitizeHTML(this.data.subjects.trim(), { allowedTags: [], allowedAttributes: {} }),
    days: sanitizeHTML(this.data.days.trim(), { allowedTags: [], allowedAttributes: {} }),
    classTime: sanitizeHTML(this.data.classTime.trim(), { allowedTags: [], allowedAttributes: {} }),
    session: sanitizeHTML(this.data.session.trim(), { allowedTags: [], allowedAttributes: {} }),
    expirationDate: sanitizeHTML(this.data.expirationDate.trim(), { allowedTags: [], allowedAttributes: {} }),
    studentsQuentity: this.data.studentsQuentity,
    address:{
      district: sanitizeHTML(this.data.district.trim(), { allowedTags: [], allowedAttributes: {} }),
      policeStation: sanitizeHTML(this.data.policeStation.trim(), { allowedTags: [], allowedAttributes: {} }),
      postOffice: sanitizeHTML(this.data.postOffice.trim(), { allowedTags: [], allowedAttributes: {} }),  
    },
    onlineClassDetails:{
      classDate:"",
      classTime:"",
      classLink:""
    },
    nearBy: sanitizeHTML(this.data.nearBy.trim(), { allowedTags: [], allowedAttributes: {} }),
    batchMood:sanitizeHTML(this.data.batchMood.trim(), { allowedTags: [], allowedAttributes: {} }),
    appliedStudents: [],
    admittedStudents: [],
    groupMessages:[],
    presentBatch: true,
    createdDate: new Date()
  }

  // get rid of any bogus properties
}

Batch.prototype.validate = function () {
  if (this.data.stream == "") {
    this.errors.push("You must select stream.")
  }
  if (this.data.classTime == "") {
    this.errors.push("You must provide batch time.")
  }
  if (this.data.days == "") {
    this.errors.push("You must provide selected day names.")
  }
  if (this.data.batchMood == "") {
    this.errors.push("You must select batch mood.")
  }
  if (this.data.session == "") {
    this.errors.push("You must provide session of the batch.")
  }
  if (this.data.studentsQuentity == "") {
    this.errors.push("You must provide total quentity of students for the batch.")
  }
  if (this.data.subjects == "") {
    this.errors.push("You must provide subject name.")
  }
  if (this.data.expirationDate == "") {
    this.errors.push("You must provide expiratio date of the batch.")
  }
  if (this.data.class == "") {
    this.errors.push("You must provide select class.")
  }
  if (this.data.district == "") {
    this.errors.push("You must select district name.")
  }
  if (this.data.policeStation == "") {
    this.errors.push("You must select police station name.")
  }
  if (this.data.postOffice == "") {
    this.errors.push("You must select post office.")
  }
}

Batch.prototype.batchCreate = function () {
  return new Promise((resolve, reject) => {
    this.cleanUp()
    this.validate()
    if (!this.errors.length) {
      // save batch into database
      batchCollection
        .insertOne(this.data)
        .then(async info => {
          try {
            let batchId = {
              batchId: info.ops[0]._id
            }
            //updating batches on teacher's database
            await usersCollection.updateOne(
              { username: this.data.username },
              {
                $push: {
                  "teacherData.allBatchesTeach": batchId
                }
              }
            )
            resolve(batchId.batchId)
          } catch {
            this.errors.push("not updating on array.")
            reject(this.errors)
          }
        })
        .catch(() => {
          this.errors.push("Please try again later.")
          reject(this.errors)
        })
    } else {
      reject(this.errors)
    }
  })
}


Batch.prototype.editBatch = function (batchId) {
  return new Promise(async(resolve, reject) => {
    try{
    this.cleanUp()
    this.validate()
    if (!this.errors.length) {
      // save batch into database
     let address={
        district: this.data.address.district,
        policeStation: this.data.address.policeStation,
        postOffice: this.data.address.postOffice,  
      }
      await batchCollection.findOneAndUpdate(
        { _id: new ObjectId(batchId) },
        {$set: {
          stream: this.data.stream,
          class: this.data.class,
          subjects: this.data.subjects,
          days: this.data.days,
          classTime: this.data.classTime,
          session: this.data.session,
          expirationDate: this.data.expirationDate,
          studentsQuentity: this.data.studentsQuentity,
          address:address,
          nearBy: this.data.nearBy,
          batchMood:this.data.batchMood
        }
      })
      resolve()
    } else {
      reject()
    }
  }catch{
    reject()
  }
  })
}

Batch.prototype.editOnlineClassDetails = function (batchId) {
  return new Promise(async(resolve, reject) => {
    try{  
    // clean up data

    //validate data
    if (this.data.onlineClassDate == "") {
    this.errors.push("You must provide class date.")
    }
    if (this.data.onlineClassTime == "") {
      this.errors.push("You must provide class time.")
    }
    if (this.data.onlineClassLink == "") {
      this.errors.push("You must provide class link.")
    }

    if (!this.errors.length) {
      // save batch into database
     let onlineClassDetails={
        classDate: this.data.onlineClassDate,
        classTime: this.data.onlineClassTime,
        classLink: this.data.onlineClassLink,  
      }
      await batchCollection.findOneAndUpdate(
        { _id: new ObjectId(batchId) },
        {$set: {
          onlineClassDetails:onlineClassDetails
        }
      })
      resolve()
    } else {
      reject()
    }
  }catch{
    reject()
  }
  })
}

Batch.findSingleBatchById = function (batchId) {
  return new Promise((resolve, reject)=> {
    if (typeof batchId != "string") {
      reject()
      return
    }
    batchCollection
      .findOne({ _id: new ObjectId(batchId) })
      .then(function (batch) {
        resolve(batch)
      })
      .catch(function () {
        reject()
      })
  })
}
//here batchesId is an array that contains all the batches id taken by a student
Batch.getBatches = function (batchesId) {
  return new Promise(async (resolve, reject) => {
    try {
      let batches = await batchCollection.find({ _id: { $in: batchesId } }).toArray()
      resolve(batches)
    } catch {
      console.log("this line executed.")
      reject()
    }
  })
}

Batch.sentRequest = function (studentUsername, id, teacherUsername, studentName) {
  return new Promise(async (resolve, reject) => {
    try {
      // this.requestSendCheck(studentUsername, id)
      //   .then(() => {
      let student = {
        name: studentName,
        username: studentUsername,
        requestedOn:new Date().toLocaleString([], { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" })
      }
      await batchCollection.updateOne(
        { _id: new ObjectId(id) },
        {
          $push: {
            appliedStudents: student
          }
        }
      )
      //notification sending
      let notification = {
        type:"sentBatchRequest",
        data:{
          username:studentUsername,
          name:studentName,
          id:id
        },
        createdDate: new Date().toLocaleString([], { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" })
      }
      await Notification.sentNotification(teacherUsername,notification)
      
      resolve()
    } catch {
      reject()
    }
  })
}

Batch.prototype.acceptRequest = function (batch, studentUsername, studentName,requestedOn) {
  return new Promise(async (resolve, reject) => {
    try {
      let student = {
        name: studentName,
        username: studentUsername,
        joinedOn:new Date().toLocaleString([], { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" })
      }

      let removeStudent = {
        name: studentName,
        username: studentUsername,
        requestedOn:requestedOn
      }

      let notification = {
        type:"acceptBatchRequest",
        data:{
          username:batch.username,
          name:batch.teacherName,
          id:batch._id
        },
        createdDate: new Date().toLocaleString([], { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" })
      }
      
      let batchId = {
        batchId: batch._id
      }

      await batchCollection.updateOne(
        { _id: new ObjectId(batch._id) },
        {
          $push: {
            admittedStudents: student
          }
        }
      )
      await batchCollection.updateOne(
        { _id: new ObjectId(batch._id) },
        {
          $pull: {
            appliedStudents: removeStudent
          }
        }
      )
      await usersCollection.updateOne(
        { username: studentUsername },
        {
          $push: {
            "studentData.allBatchesTaken": batchId
          }
        }
      )
      await Notification.sentNotification(studentUsername,notification)
    
      resolve()
    } catch {
      reject("There was some problem")
    }
  })
}

Batch.prototype.deleteRequest = function (batch, studentUsername, studentName,requestedOn) {
  return new Promise(async (resolve, reject) => {
    try {
      let student = {
        name: studentName,
        username: studentUsername,
        requestedOn:requestedOn
      }

      let notification = {
        type:"deleteBatchRequest",
        data:{
          username:batch.username,
          name:batch.teacherName,
          id:batch._id
        },
        createdDate: new Date().toLocaleString([], { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" })
      }

      await batchCollection.updateOne(
        { _id: new ObjectId(batch._id) },
        {
          $pull: {
            appliedStudents: student
          }
        }
      )
      await Notification.sentNotification(studentUsername,notification)
    

      resolve()
    } catch {
      reject("There was some problem")
    }
  })
}

Batch.prototype.deleteStudentFromBatch = function (batch, studentUsername, studentName,joinedOn) {
  return new Promise(async (resolve, reject) => {
    try {
      let student = {
        name: studentName,
        username: studentUsername,
        joinedOn:joinedOn
      }

      let notification = {
        type:"deleteFromBatch",
        data:{
          username:batch.username,
          name:batch.teacherName,
          id:batch._id
        },
        createdDate: new Date().toLocaleString([], { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" })
      }

      let batchId = {
        batchId: batch._id
      }

      await batchCollection.updateOne(
        { _id: new ObjectId(batch._id) },
        {
          $pull: {
            admittedStudents: student
          }
        }
      )
      await usersCollection.updateOne(
        { username: studentUsername },
        {
          $pull: {
            "studentData.allBatchesTaken": batchId
          }
        }
      )
      await Notification.sentNotification(studentUsername,notification)
    

      resolve()
    } catch {
      reject("There was some problem")
    }
  })
}

// Batch.findSingleById = function (id, visitorRegNumber) {
//   return new Promise(async function (resolve, reject) {
//     batchCollection
//       .findOne({ _id: new ObjectId(id) })
//       .then(batch => {
//         batch.isOwner = false
//         if (batch.regNumebr == visitorRegNumber) {
//           batch.isOwner = true
//         }
//         resolve(batch)
//       })
//       .catch(() => {
//         reject()
//       })
//   })
// }

Batch.getBatchesId = function (username, accountType) {
  return new Promise(async (resolve, reject) => {
    try {
      let userData = await usersCollection.findOne({ username: username })
      if (accountType == "student" || accountType == "studentTeacher") {
        resolve(userData.studentData.allBatchesTaken)
      } else {
        reject()
      }
    } catch {
      reject()
    }
  })
}
module.exports = Batch
