var express = require("express");
var app = express();
var mongoose = require("mongoose");
var cors = require("cors");
var Users = require("./models/User");
var Items = require("./models/Item");
app.use(cors());
app.use(express.json());
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

require("dotenv").config();

// swagger configuration
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "ToDo App API",
      version: "1.0.0",
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    servers: [
      {
        url: process.env.URL,
      },
    ],
  },
  apis: ["./index.js"],
};
const swaggerSpec = swaggerJsDoc(options);

// swagger docs
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @swagger
 *  components:
 *      schemas:
 *          User:
 *              type: object
 *              properties:
 *                  firstName:
 *                      type: string
 *                  lastName:
 *                      type: string
 *                  email:
 *                      type: string
 *                  country:
 *                      type: string
 *                  password:
 *                      type: string
 *          Item:
 *              type: object
 *              properties:
 *                  title:
 *                      type: string
 *                  description:
 *                      type: string
 *                  email:
 *                      type: string
 *                  status:
 *                      type: string    
 */

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});


// Middleware
const verifyJWT = (req, res, next) => {
    let token = req.headers["authorization"].split(" ")[1];
    console.log("verifyJWT_FRontend:", token);
  
    if (!token) {
      res.json({ auth: false, message: "You failed to authenticate" });
    } else {
      jwt.verify(token,process.env.JWT_KEY, (err, decoded) => {
        console.log(decoded);
        if (err) {
          res.json({ auth: false, message: "You failed to authenticate1" });
        } else {
          req.userId = decoded.id;
          next();
        }
      });
    }
  };


app.get("/", (req, res) => {
    res.send("Server working fine");
});



/**
 * @swagger
 * /signup:
 *  post:
 *      summary: create a new user
 *      description: create new user with given user details and adds to the database
 *      requestBody:
 *          required: true
 *          content:
 *              application/json:
 *                  schema:
 *                      $ref: '#components/schemas/User'
 *      responses:
 *          200:
 *              description: Success
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: array
 *                          items:
 *                              $ref: '#components/schemas/User'
 *
 */
app.post("/signup", async (req, res) => {
   
    const user = new Users({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        country: req.body.country,
        password: req.body.password
    });

    console.log(user);
    // check if user already exists
    let users =await Users.find({ email: req.body.email })
        if (users.length > 0) {
            res.json({ auth: false, message: "User already exists" });
        }
        else{
          user.save().then(() => {
            console.log("User registered successfully");
        }).catch((err) => {
            console.log(err);
        });
    
    
        res.json({ auth: true, message: "User registered successfully" })
        }

});





/**
 * @swagger
 * /login:
 *  post:
 *      summary: login a user
 *      description: login a user with given user details
 *      requestBody:
 *          required: true
 *          content:
 *              application/json:
 *                schema: 
 *                  type: object
 *                  properties:
 *                    email:
 *                      type: string
 *                    password:
 *                      type: string
 * 
 *      responses:
 *          200:
 *              description: Success
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: array
 *                          items:
 *                              $ref: '#components/schemas/User'
 *
 */
app.post("/login", async (req, res) => {
    let email = req.body.email;
    let password = req.body.password;
    console.log("email:", email);

   let users =  await Users.find({ email: email });

   console.log(users);
      if (users.length > 0) {
        // compare password
        bcrypt.compare(password, users[0].password, function (err, result) {
          if (result) {
            // create token
            let token = jwt.sign({ email: users[0].email },process.env.JWT_KEY, {
              expiresIn: "1h",
            });
  
            console.log("User token:", token);
            res.json({ auth: true, token: token, users: users });
          } else {
            res.json({ auth: false, token: null, users: null });
          }
        });
  
       
      } else {
        res.json({ auth: false, token: null, users: null });
      }
  
  });






/**
 * @swagger
 * /additem:
 *  post:
 *      summary: create a new item
 *      description: create new item with given item details and adds to the database
 *      requestBody:
 *          required: true
 *          content:
 *              application/json:
 *                  schema:
 *                      $ref: '#components/schemas/Item'
 *      responses:
 *          200:
 *              description: Success
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: array
 *                          items:
 *                              $ref: '#components/schemas/Item'
 *
 */
app.post("/additem",verifyJWT,async (req,res)=>{
    let title = req.body.title;
    let description = req.body.description;
    let email = req.body.email;
    const item = new Items({
        title:title,
        description:description,
        email:email
    });

    await item.save().then(()=>{
        console.log("Item added successfully");
    }).catch((err)=>{
        console.log(err);
    });

    let itemslist = await Items.find({email:email});
    res.json({auth:true,message:"Item added successfully",itemslist:itemslist});
})



/**
 * @swagger
 * /getitems:
 *  get:
 *      summary: get all items
 *      description: get all items of a user with given email
 *      parameters:
 *          - in: query
 *            name: email
 *            required: true
 *            description: email of the user
 *            schema:
 *              type: string
 *              example: "charan@gmail.com"
 *      responses:
 *          200:
 *              description: Success
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: array
 *                          items:
 *                              $ref: '#components/schemas/Item'
 *
 */      
app.get("/getitems",verifyJWT,async (req,res)=>{
  let email = req.query.email;
  let itemslist = await Items.find({email:email});

  res.json({ auth: true, itemslist: itemslist });

});





/**
 * @swagger
 * /deleteitem:
 *  post:
 *     summary: delete an item
 *     description: delete an item with given item id and deletes from the database
 *     requestBody:
 *         description: Enter MongoDB id of the item to be delete
 *         required: true
 *         content:
 *            application/json:
 *              schema:
 *                name: item-mongodb-id
 *                type: string
 * 
 *     responses:
 *         200:
 *            description: Success
 *            content:
 *                application/json:
 *                    schema:
 *                      type: array
 *                      items:
 *                        $ref: '#components/schemas/Item'
 * 
 */
app.post("/deleteitem",verifyJWT,(req,res)=>{

  let itemid = req.body.itemid;
  console.log(itemid)
  Items.deleteOne({_id:itemid}).then(()=>{
    console.log("Item deleted successfully");
  }).catch((err)=>{
    console.log(err);
  });

  res.json({auth:true,message:"Item deleted successfully"});

});





/**
 * @swagger
 * /updateitem:
 *  post:
 *     summary: update an item
 *     description: update an item with given item id and updates in the database
 *     requestBody:
 *        description: Enter MongoDB id, New title, New Description of the item to be updated
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *          
 * 
 * 
 *     responses:
 *         200:
 *            description: Success
 *            content:
 *                application/json:
 *                    schema:
 *                      type: array
 *                      items:
 *                        $ref: '#components/schemas/Item'
 * 
 */
app.post("/updateitem",verifyJWT,async (req,res)=>{
  let itemid = req.body.itemid;
  let title = req.body.title;
  let description = req.body.description;

  await Items.updateOne({_id:itemid},{
    title:title,
    description:description
  }).then(()=>{
    console.log("Item updated successfully");
  }).catch((err)=>{
    console.log(err);
  });

  await Items.find({}).then((itemslist)=>{
    res.json({auth:true,message:"Item updated successfully",itemslist:itemslist});
  }).catch((err)=>{
    console.log(err);
    res.json({auth:false,message:"Item not updated",itemslist:itemslist});
  });

});





/**
 * @swagger
 * /updatestatus:
 *  post:
 *     summary: update an item status completed/not completed
 *     description: update an item with given item id and updates its status in the database
 *     requestBody:
 *        description: Enter MongoDB id of the item to be updated
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *          
 * 
 * 
 *     responses:
 *         200:
 *            description: Success
 *            content:
 *                application/json:
 *                    schema:
 *                      type: array
 *                      items:
 *                        $ref: '#components/schemas/Item'
 * 
 */
app.post("/updatestatus",async (req,res)=>{
  let itemid = req.body.itemid;
  console.log(itemid);
  await Items.updateOne({_id:itemid},{
    status:"completed"
  }).then(()=>{
    console.log("Item status updated successfully");
  }).catch((err)=>{
    console.log(err);
  });

  await Items.find({}).then((itemslist)=>{
    res.json({auth:true,message:"Item status updated successfully",itemslist:itemslist});
  }).catch((err)=>{
    console.log(err);
  });

}
);





/**
 * @swagger
 * /updateprofile:
 *  post:
 *     summary: update a user profile
 *     description: updates user profile and updates in the database
 *     requestBody:
 *        description: Enter firstName,lastName,email,country 
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *          
 * 
 * 
 *     responses:
 *         200:
 *            description: Success
 *            content:
 *                application/json:
 *                    schema:
 *                      type: array
 *                      items:
 *                        $ref: '#components/schemas/User'
 * 
 */
app.post("/updateprofile",async (req,res)=>{

  let firstName = req.body.firstName;
  let lastName = req.body.lastName;
  let country = req.body.country;
  let email = req.body.email;

  await Users.updateOne({email:email},{
    firstName:firstName,
    lastName:lastName,
    country:country
  }).then(()=>{
    console.log("Profile updated successfully");
  }).catch((err)=>{
    console.log(err);
  });

  let users = await Users.find({email:email});
  res.json({auth:true,message:"Profile updated successfully",users:users});
  
});



app.listen(process.env.port, () => {
    console.log("Server running on port 3001");
    }
);
