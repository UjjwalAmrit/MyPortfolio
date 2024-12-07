const express = require("express");
const mysql = require("mysql2");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();
const PORT = 8080;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "../public"))); // Serve static files
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// MySQL connection
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "U@mr!t54321",
});

// Connect and setup database
db.connect((err) => {
    if (err) {
        console.error("Error connecting to MySQL:", err);
        return;
    }
    console.log("Connected to MySQL!");

    // Create database and table
    db.query("CREATE DATABASE IF NOT EXISTS feedback_db", (err) => {
        if (err) {
            console.error("Error creating database:", err);
            return;
        }
        db.changeUser({ database: "feedback_db" }, (err) => {
            if (err) {
                console.error("Error switching database:", err);
                return;
            }
            console.log("Switched to feedback_db database!");

            const createTableQuery = `
                CREATE TABLE IF NOT EXISTS feedback (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    username VARCHAR(255) NOT NULL,
                    description TEXT NOT NULL,
                    email VARCHAR(255) NOT NULL,
                    message_type ENUM('contact', 'feedback') NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`;

            db.query(createTableQuery, (err) => {
                if (err) {
                    console.error("Error creating table:", err);
                } else {
                    console.log("Table 'feedback' ready!");
                }
            });
        });
    });
});

// Handle contact form submission
app.post("/contact", (req, res) => {
    const { username, email, message } = req.body;

    // Check if the email already exists in the feedback table
    const checkEmailQuery = "SELECT * FROM feedback WHERE email = ?";

    db.query(checkEmailQuery, [email], (err, result) => {
        if (err) {
            console.error("Error checking email:", err);
            return res.status(500).send("An error occurred while checking the email.");
        }

        if (result.length > 0) {
            // Update the existing record
            const updateQuery = `
                UPDATE feedback 
                SET description = ?, message_type = 'contact'
                WHERE email = ?
            `;
            db.query(updateQuery, [message, email], (err) => {
                if (err) {
                    console.error("Error updating feedback:", err);
                    return res.status(500).send("An error occurred while saving the contact message.");
                } else {
                    console.log("Contact message updated successfully!");
                    return res.redirect("/");
                }
            });
        } else {
            // Insert a new record
            const insertQuery = "INSERT INTO feedback (username, description, email, message_type) VALUES (?, ?, ?, 'contact')";

            db.query(insertQuery, [username, message, email], (err) => {
                if (err) {
                    console.error("Error inserting contact message:", err);
                    return res.status(500).send("An error occurred while saving the contact message.");
                } else {
                    console.log("Contact message saved successfully!");
                    return res.redirect("/");
                }
            });
        }
    });
});

// Home page route
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../public/index.html"));
});

// Feedback form route
app.get("/feedback", (req, res) => {
    res.render("feedback");
});

// Handle feedback form submission
app.post("/feedback", (req, res) => {
    const { username, description } = req.body;
    const insertQuery = "INSERT INTO feedback (username, description) VALUES (?, ?)";

    db.query(insertQuery, [username, description], (err) => {
        if (err) {
            console.error("Error inserting feedback:", err);
            res.status(500).send("An error occurred while saving feedback.");
        } else {
            console.log("Feedback saved successfully!");
            res.redirect("/");
        }
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
