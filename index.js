const express = require("express");
const async = require("async");
const app = express();
const mysql = require("mysql");
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
const connection = mysql.createConnection({
  host: "localhost",
  user: "localDb",
  password: "Goy@l1234",
  database: "newsTest",
});

connection.connect((err) => {
  if (err) {
    console.error(err);
  }
  console.log("Connected to MySQL Server!");
});

//for Feed

app.get("/getFeed", async (req, res) => {
  const type = req.query.type || null;
  let query1 = "";
  if (type) {
    query1 =
      "SELECT * from feed where feedType = " +
      mysql.escape(type) +
      "order by updatedAt desc";
  } else {
    query1 = "SELECT * from feed order by updatedAt desc";
  }
  connection.query(query1, async (err, result) => {
    if (err) {
      console.error("ERROR:", err);
    }
    if (!result?.length) {
      res.status(400).json({ msg: "No data found" });
    } else {
      helperFunc.mapUserDataWithFeed(result, (dataa) => {
        return res.status(200).json({
          success: true,
          data: dataa,
        });
      });
    }
  });
});

app.get("/SearchFeed", async (req, res) => {
  const searchText = req.query.searchText;
  const query1 = `select * from feed where title like "%${searchText}%" or body like  "%${searchText}%" order by updatedAt desc`;
  connection.query(query1, async (err, result) => {
    if (err) {
      console.error("ERROR:", err);
    }
    if (!result?.length) {
      res.status(400).json({ msg: "No data found" });
    } else {
      helperFunc.mapUserDataWithFeed(result, (dataa) => {
        return res.status(200).json({
          success: true,
          data: dataa,
        });
      });
    }
  });
});

app.get("/getUserProfile", async (req, res) => {
  const userId = req.query.userId;
  const query1 = ` SELECT * from user where id = ${userId}`;
  connection.query(query1, async (err, result) => {
    if (err) {
      console.error("ERROR:", err);
    }
    if (!result?.length) {
      res.status(400).json({ msg: "In Correct User Id" });
    } else {
      return res.status(200).json({
        success: true,
        data: dataa,
      });
    }
  });
});

app.get("/getEditUserForm", async (req, res) => {
  const data = [
    {
      fieldName: "firstname",
      mandatory: true,
    },
    {
      fieldName: "lastname",
      mandatory: false,
    },
    {
      fieldName: "email",
      mandatory: false,
    },
    {
      fieldName: "mobile",
      mandatory: true,
      minLength: 10,
      maxLength: 12,
    },
    {
      fieldName: "dob",
      mandatory: true,
    },
    {
      fieldName: "birth_time",
      mandatory: true,
    },
    {
      fieldName: "language",
      mandatory: true,
    },
    {
      fieldName: "marital_status",
      mandatory: true,
    },
    {
      fieldName: "gender",
      mandatory: true,
    },
  ];
  return res.status(200).json({
    success: true,
    data: data,
  });
});

app.post("/updateCreateUserProfile", async (req, res) => {
  const body = req.body;
  const userId = body.userId;
  const firstname = body.firstname;
  const lastname = body.lastname;
  helperFunc.checkValidity(body, (err, response) => {
    if (response?.length) {
      return res.status(400).json({
        success: false,
        message: response,
      });
    } else {
      let query2 = "";
      if (!userId) {
        const username = `${firstname}${lastname}${(
          Math.random() * 10000
        ).toFixed()}`;
        const replacements = [
          mysql.escape(username),
          mysql.escape(firstname),
          mysql.escape(lastname),
          mysql.escape(body.email),
          mysql.escape(body.mobile),
          mysql.escape(body.profileImage),
          mysql.escape(body.marital_status),
          mysql.escape(body.language),
          mysql.escape(new Date(body.dob)),
          mysql.escape(body.birth_time),
          mysql.escape(body.gender),
        ];
        query2 = `Insert into user (username,firstname,lastname,email,mobile,profileImage,marital_status,language,dob,birth_time,gender) Values (${replacements}) `;
      } else {
        query2 = `Update user set firstname=${firstname},lastname=${lastname},mobile=${
          body.mobile
        },email=${body.email},profileImage=${
          body.profileImage
        },marital_status=${body.marital_status},language=${
          body.language
        },dob=${new Date(body.dob)},birth_time=${body.birth_time},gender=${
          body.gender
        }`;
      }
      connection.query(query2, async (err, data) => {
        if (err) {
          console.error(err);
        }
        return res.status(200).json({
          success: true,
          message: "success",
        });
      });
    }
  });
});

var helperFunc = {
  checkValidity(body, callback) {
    let message = "";
    const firstname = body.firstname;
    if (!firstname) {
      message = "firstname is required";
    } else if (!body.mobile || !body.email) {
      message = "mobile or email is required";
    } else if (!body.marital_status) {
      message = "marital_status is required";
    } else if (!body.language) {
      message = "language is required";
    } else if (!body.dob) {
      message = "dob is required";
    } else if (!body.birth_time) {
      message = "birth_time is required";
    } else if (body.mobile?.length < 10) {
      message = "Please enter a valid mobile";
    } else if (body.email && body.email.indexOf("@") == -1) {
      message = "Please enter a valid email";
    }
    callback(null, message);
  },
  mapUserDataWithFeed(feedData, cb) {
    async.forEachOf(
      feedData,
      (item, key, callback) => {
        const createdBy = item.createdBy;
        connection.query(
          "SELECT * from user where id = " + mysql.escape(createdBy),
          (err, userInfo) => {
            const userInfoObj = {
              username: userInfo[0].username,
              profileImage: userInfo[0].profileImage,
              userId: userInfo[0].id,
            };
            item["userInfoObj"] = userInfoObj;
            callback(null);
          }
        );
      },
      () => {
        cb(feedData);
      }
    );
  },
};
// for userInfo

app.listen(5000, () => {
  console.log("Server is running at port 5000");
});
