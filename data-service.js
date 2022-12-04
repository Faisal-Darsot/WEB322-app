const Sequelize = require("sequelize");

var sequelize = new Sequelize(
  "ioyfwliq",
  "ioyfwliq",
  "Kqzfo0C_OMA2Zo44PeP_lHOy_FE7Lv5I",
  {
    host: "peanut.db.elephantsql.com",
    dialect: "postgres",
    port: 5432,
    dialectOptions: {
      ssl: { rejectUnauthorized: false },
    },
    query: { raw: true },
  }
);

sequelize
  .authenticate()
  .then(() => console.log("Connection success."))
  .catch((err) => console.log("Unable to connect to DB.", err));

const Student = sequelize.define("Student", {
  studentID: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  firstName: Sequelize.STRING,
  lastName: Sequelize.STRING,
  email: Sequelize.STRING,
  phone: Sequelize.STRING,
  addressStreet: Sequelize.STRING,
  addressCity: Sequelize.STRING,
  addressState: Sequelize.STRING,
  addressPostal: Sequelize.STRING,
  isInternationalStudent: Sequelize.BOOLEAN,
  expectedCredential: Sequelize.STRING,
  status: Sequelize.STRING,
  registrationDate: Sequelize.STRING,
});

const Program = sequelize.define("Program", {
  programCode: {
    type: Sequelize.STRING,
    primaryKey: true,
  },
  programName: Sequelize.STRING,
});

Program.hasMany(Student, { foreignKey: "program" });

module.exports.initialize = function () {
  return new Promise((resolve, reject) => {
    sequelize
      .sync()
      .then(() => {
        resolve();
      })
      .catch(() => reject("unable to sync the database"));
  });
};

module.exports.getAllStudents = function () {
  return new Promise((resolve, reject) => {
    sequelize
      .sync()
      .then(() => {
        Student.findAll()
          .then((res) => resolve(res))
          .catch(() => reject("no results returned"));
      })
      .catch(() => {
        reject("failed to sync");
      });
  });
};

module.exports.addStudent = function (studentData) {
  return new Promise(function (resolve, reject) {
    studentData.isInternationalStudent = studentData.isInternationalStudent
      ? true
      : false;
    for (key in studentData) {
      if (key === "") {
        studentData[key] = null;
      }
    }
    sequelize
      .sync()
      .then(() => {
        Student.create(studentData)
          .then((res) => resolve(res))
          .catch(() => reject("unable to create student"));
      })
      .catch(() => {
        reject("failed to sync");
      });
  });
};

module.exports.updateStudent = function (studentData) {
  return new Promise(function (resolve, reject) {
    studentData.isInternationalStudent = studentData.isInternationalStudent
      ? true
      : false;
    for (key in studentData) {
      if (key === "") {
        studentData[key] = null;
      }
    }
    sequelize
      .sync()
      .then(() => {
        Student.update(studentData, {
          where: { studentID: studentData.studentID },
        })
          .then((res) => resolve(res))
          .catch(() => reject("unable to update student"));
      })
      .catch(() => {
        reject("failed to sync");
      });
  });
};

module.exports.getStudentById = function (id) {
  return new Promise(function (resolve, reject) {
    sequelize
      .sync()
      .then(() => {
        Student.findAll({ where: { studentID: id } })
          .then((res) => resolve(res[0]))
          .catch(() => reject("no results returned"));
      })
      .catch(() => {
        reject("failed to sync");
      });
  });
};

module.exports.getStudentsByStatus = function (status) {
  return new Promise(function (resolve, reject) {
    sequelize
      .sync()
      .then(() => {
        Student.findAll({ where: { status } })
          .then((res) => resolve(res))
          .catch(() => reject("no results returned"));
      })
      .catch(() => {
        reject("failed to sync");
      });
  });
};

module.exports.getStudentsByProgramCode = function (program) {
  return new Promise(function (resolve, reject) {
    sequelize
      .sync()
      .then(() => {
        Student.findAll({ where: { programCode: program } })
          .then((res) => resolve(res))
          .catch(() => reject("no results returned"));
      })
      .catch(() => {
        reject("failed to sync");
      });
  });
};

module.exports.getStudentsByExpectedCredential = function (credential) {
  return new Promise(function (resolve, reject) {
    sequelize
      .sync()
      .then(() => {
        Student.findAll({ where: { expectedCredential: credential } })
          .then((res) => resolve(res))
          .catch(() => reject("no results returned"));
      })
      .catch(() => {
        reject("failed to sync");
      });
  });
};

module.exports.getInternationalStudents = function () {
  return new Promise(function (resolve, reject) {
    sequelize
      .sync()
      .then(() => {
        Student.findAll({ where: { isInternationalStudent: true } })
          .then((res) => resolve(res))
          .catch(() => reject("no results returned"));
      })
      .catch(() => {
        reject("failed to sync");
      });
  });
};

module.exports.getPrograms = function () {
  return new Promise(function (resolve, reject) {
    Program.findAll()
      .then(function (data) {
        resolve(data);
      })
      .catch((err) => {
        reject("no results returned");
        return;
      });
  });
};

module.exports.addProgram = function (programData) {
  return new Promise(function (resolve, reject) {
    for (var prop in programData) {
      if (programData[prop] == "") programData[prop] = null;
    }

    Program.create(programData)
      .then(() => {
        resolve();
      })
      .catch((e) => {
        reject("unable to create program");
        return;
      });
  });
};

module.exports.updateProgram = function (programData) {
  return new Promise(function (resolve, reject) {
    for (var prop in programData) {
      if (programData[prop] == "") programData[prop] = null;
    }

    Program.update(programData, {
      where: { programCode: programData.programCode },
    })
      .then(() => {
        resolve();
      })
      .catch((e) => {
        reject("unable to update program");
        return;
      });
  });
};

module.exports.getProgramByCode = function (pcode) {
  return new Promise(function (resolve, reject) {
    Program.findAll({
      where: {
        programCode: pcode,
      },
    })
      .then(function (data) {
        resolve(data[0]);
      })
      .catch(() => {
        reject("no results returned");
        return;
      });
  });
};

module.exports.deleteProgramByCode = function (pc) {
  return new Promise(function (resolve, reject) {
    Program.destroy({
      where: {
        programCode: pc,
      },
    })
      .then(function () {
        resolve();
      })
      .catch((err) => {
        reject("unable to delete program");
        return;
      });
  });
};

module.exports.deleteStudentById = function (id) {
  return new Promise((resolve, reject) => {
    sequelize
      .sync()
      .then(() => {
        Student.destroy({ where: { studentID: id } })
          .then(() => resolve("destroyed"))
          .catch((err) => reject(err));
      })
      .catch(() => {
        reject("failed to sync");
      });
  });
};
