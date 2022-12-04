/*********************************************************************************
 * WEB322 – Assignment 06
 * I declare that this assignment is my own work in accordance with Seneca Academic Policy. No part
 * of this assignment has been copied manually or electronically from any other source
 * (including 3rd party web sites) or distributed to other students.
 *
 * Name: Faisal Darsot ID: 109347211 Date: 03/12/2022
 *
 * Online (Cyclic) Link: https://real-lime-agouti-wig.cyclic.app/
 *
 ********************************************************************************/

var express = require("express");
var multer = require("multer");
var clientSessions = require("client-sessions");
var app = express();
var path = require("path");
var data_service = require("./data-service.js");
var dataServiceAuth = require("./data-service-auth.js");
const fs = require("node:fs");
var exphbs = require("express-handlebars");
const HTTP_PORT = process.env.PORT || 8080;

app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//setup client-sessions
app.use(
  clientSessions({
    cookieName: "session", // this is the object name that will be added to "req"
    secret: "This_should_Be_A_Long_unguessableString", //this should be a long-unguessable string.
    duration: 2 * 60 * 1000, //duration of the session in milliseconds (2 mins)
    activeDuration: 1000 * 60, //the session will be extended by this many milliseconds each request (1 min)
  })
);

app.use(function (req, res, next) {
  res.locals.session = req.session;
  next();
});

app.engine(
  ".hbs",
  exphbs.engine({
    extname: ".hbs",
    defaultLayout: "main",
    helpers: {
      navLink: function (url, options) {
        return (
          "<li" +
          (url == app.locals.activeRoute ? ' class="active" ' : "") +
          '><a href="' +
          url +
          '">' +
          options.fn(this) +
          "</a></li>"
        );
      },
      equal: function (lvalue, rvalue, options) {
        if (arguments.length < 3)
          throw new Error("Handlebars Helper equal needs 2 parameters");
        if (lvalue != rvalue) {
          return options.inverse(this);
        } else {
          return options.fn(this);
        }
      },
    },
  })
);

app.set("view engine", ".hbs");

function onHttpStart() {
  console.log("Express http server listening on: " + HTTP_PORT);
}

// multer requires a few options to be setup to store files with file extensions
// by default it won't store extensions for security reasons
const storage = multer.diskStorage({
  destination: "./public/images/uploaded",
  filename: function (req, file, cb) {
    // we write the filename as the current date down to the millisecond
    // in a large web service this would possibly cause a problem if two people
    // uploaded an image at the exact same time. A better way would be to use GUID's for filenames.
    // this is a simple example.
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

//tell multer to utilize disk storage function when naming files rather than default
const upload = multer({ storage: storage });

data_service
  .initialize()
  .then(dataServiceAuth.initialize)
  .then(function () {
    app.listen(HTTP_PORT, function () {
      console.log("app listening on: " + HTTP_PORT);
    });
  })
  .catch(function (err) {
    console.log("unable to start server: " + err);
  });

app.use(express.static("public"));

app.use(function (req, res, next) {
  let route = req.baseUrl + req.path;
  app.locals.activeRoute = route == "/" ? "/" : route.replace(/\/$/, "");
  next();
});

app.get("/", (req, res) => {
  res.render("home");
});

app.get("/about", (req, res) => {
  res.render("about");
});

app.get("/students", ensureLogin, async (req, res) => {
  let result;
  try {
    if (req.query.status) {
      result = await data.getStudentsByStatus(req.query.status);
    } else if (req.query.program) {
      result = await data.getStudentsByProgramCode(req.query.program);
    } else if (req.query.credential) {
      result = await data.getStudentsByExpectedCredential(req.query.credential);
    } else {
      result = await data.getAllStudents();
    }
  } catch (err) {
    return res.render("students", { message: "no results" });
  }

  if (result.length > 0) {
    return res.render("students", { students: result });
  } else {
    return res.render("students", { message: "no results" });
  }
});

app.get("/student/:studentId", ensureLogin, (req, res) => {
  const { studentId } = req.params;
  let viewData = {};
  data
    .getStudentById(studentId)
    .then((data) => {
      if (data) {
        viewData.student = data;
      } else {
        viewData.student = null;
      }
    })
    .catch(() => {
      viewData.student = null;
    })
    .then(data.getPrograms)
    .then((data) => {
      viewData.programs = data;
      for (let i = 0; i < viewData.programs.length; i++) {
        if (viewData.programs[i].programCode == viewData.student.program) {
          viewData.programs[i].selected = true;
        }
      }
    })
    .catch(() => {
      viewData.programs = [];
    })
    .then(() => {
      if (viewData.student === null) {
        res.render("student", { message: "no results" });
      } else {
        res.render("student", { viewData });
      }
    })
    .catch(() => {
      res.render("student", { message: "Unable to Show Students" });
    });
});

app.get("/intlstudents", ensureLogin, (req, res) => {
  data
    .getInternationalStudents()
    .then((data) => {
      res.render("students", { students: data });
    })
    .catch((err) => {
      res.json({ message: err });
    });
});

app.get("/students/add", (req, res) => {
  data_service
    .getPrograms()
    .then((data) => {
      res.render("addStudent", { programs: data });
    })
    .catch((err) => {
      // set program list to empty array
      res.render("addStudent", { programs: [] });
    });
});

app.post("/students/add", (req, res) => {
  data_service
    .addStudent(req.body)
    .then(() => {
      res.redirect("/students");
    })
    .catch((err) => {
      res.status(500).send("Unable to Add the Student");
    });
});

app.get("/students/delete/:studentID", ensureLogin, (req, res) => {
  data_service
    .deleteStudentById(req.params.studentID)
    .then(() => {
      res.redirect("/students");
    })
    .catch(() => {
      res.status(500).send("Unable to Remove Student / Student not found)");
    });
});

app.post("/student/update", ensureLogin, (req, res) => {
  data_service.updateStudent(req.body).then(() => {
    res.redirect("/students");
  });
});

app.get("/images", ensureLogin, (req, res) => {
  fs.readdir("./public/images/uploaded", function (err, items) {
    res.render("images", { images: items });
  });
});

app.get("/images/add", ensureLogin, (_, res) => {
  res.render("addImage");
});

app.post("/images/add", ensureLogin, upload.single("imageFile"), (req, res) => {
  res.redirect("/images");
});

app.get("/programs/add", (req, res) => {
  res.render("addProgram");
});

app.post("/programs/add", (req, res) => {
  data_service
    .addProgram(req.body)
    .then(() => {
      res.redirect("/programs");
    })
    .catch((err) => {
      res.status(500).send("Unable to Add the Program");
    });
});

app.get("/programs", (req, res) => {
  data_service
    .getPrograms()
    .then((data) => {
      res.render(
        "programs",
        data.length > 0 ? { programs: data } : { message: "no results" }
      );
    })
    .catch((err) => {
      res.render("programs", { message: "no results" });
    });
});

app.post("/programs/update", ensureLogin, (req, res) => {
  data_service
    .updateProgram(req.body)
    .then(() => {
      res.redirect("/programs");
    })
    .catch((err) => {
      res.json({ message: err });
    });
});

app.get("/program/:programCode", ensureLogin, (_, res) => {
  const { programCode } = req.params;
  data_service
    .getProgramByCode(programCode)
    .then((data) => {
      if (data) {
        res.render("program", { program: data });
      } else {
        res.status(404).send("Program Not Found");
      }
    })
    .catch(() => {
      res.status(404).send("Program Not Found");
    });
});

app.get("/programs/delete/:programCode", ensureLogin, (req, res) => {
  const { programCode } = req.params;
  data_service
    .deleteProgramByCode(programCode)
    .then((data) => {
      if (data) {
        res.render("programs", { program: data });
      } else {
        res.status(404).send("Unable to Remove Program / Program not found)");
      }
    })
    .catch(() => {
      res.status(500).send("Unable to Remove Program / Program not found)");
    });
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", (req, res) => {
  dataServiceAuth
    .registerUser(req.body)
    .then(() => {
      res.render("register", { successMessage: "User created" });
    })
    .catch((err) => {
      res.render("register", {
        errorMessage: err,
        userName: req.body.userName,
      });
    });
});

app.post("/login", (req, res) => {
  req.body.userAgent = req.get("User-Agent");
  dataServiceAuth
    .checkUser(req.body)
    .then((user) => {
      req.session.user = {
        userName: user.userName, // complete it with authenticated user's userName
        email: user.email, // complete it with authenticated user's email
        loginHistory: user.loginHistory, // complete it with authenticated user's loginHistory
      };
      res.redirect("/students");
    })
    .catch((err) => {
      res.render("login", { errorMessage: err, userName: req.body.userName });
    });
});

app.get("/logout", (req, res) => {
  req.session.reset();
  res.redirect("/");
});

app.get("/userHistory", ensureLogin, (req, res) => {
  res.render("userHistory");
});

//get any other route that is not found
app.get("*", (req, res) => {
  res.status(404).render("error", {
    layout: false,
    errorCode: "404",
    message: "Page Not Found",
  });
});

function ensureLogin(req, res, next) {
  if (!req.session.user) {
    res.redirect("/login");
  } else {
    next();
  }
}
