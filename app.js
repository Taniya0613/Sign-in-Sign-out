const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const fs = require('fs');
const querystring = require('querystring');

const app = express();
const PORT = 3000;
const FILE_PATH = 'employeedetails.txt';
const DELIMITER = '|';

// Middleware to parse form data
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// Registration route
app.post('/register', (req, res) => {
    const { name, email, password } = req.body;

    // Password validation
    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;

    if (!passwordRegex.test(password)) {
        return res.status(400).send(`<script>alert("Password must be 8 characters long, contain alphabets, numbers, and a special character."); window.history.back();</script>`);
    }

    // Read existing data
    fs.readFile('data.json', (err, data) => {
        if (err) throw err;
        const users = JSON.parse(data);

        // Check if email already exists
        if (users.some(user => user.email === email)) {
            return res.status(400).send(`<script>alert("Email already exists!"); window.history.back();</script>`);
        }

        // Add new user
        users.push({ name, email, password });

        // Write updated data back to the file
        fs.writeFile('data.json', JSON.stringify(users, null, 2), err => {
            if (err) throw err;

            // Redirect to login page with success message
            res.send(`<script>alert("Registration successful! Please login."); window.location.href = 'login36.html';</script>`);
        });
    });
});

// Login route
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    // Read existing data
    fs.readFile('data.json', (err, data) => {
        if (err) throw err;
        const users = JSON.parse(data);

        // Check if user exists and password matches
        const user = users.find(user => user.email === email && user.password === password);

        if (user) {
            // Redirect to home page with success message
            res.send(`<script>alert("Login successful!"); window.location.href = 'home.html';</script>`);
        } else {
            // Invalid credentials
            res.status(401).send(`<script>alert("Invalid email or password!"); window.history.back();</script>`);
        }
    });
});

// Route to view employee details
app.get('/employee', (req, res) => {
    fs.readFile(path.join(__dirname, 'employee.html'), 'utf8', (err, html) => {
        if (err) throw err;
        res.send(html);
    });
});

// Route to handle form submissions for employee details
app.post('/submit', (req, res) => {
    const { name, email, department, salary } = req.body;
    const newLine = `${name}${DELIMITER}${email}${DELIMITER}${department}${DELIMITER}${salary}\n`;

    fs.appendFile(FILE_PATH, newLine, err => {
        if (err) return res.status(500).send('Error writing data file');
        res.send('<script>alert("Form data saved successfully"); window.location.href = "/employee";</script>');
    });
});

// Route to view stored employee data
app.get('/data', (req, res) => {
    fs.readFile(FILE_PATH, 'utf8', (err, data) => {
        if (err && err.code !== 'ENOENT') return res.status(500).send('Error reading data file');

        let rows = (data || '').trim().split('\n').map((line, i) => {
            const [name, email, department, salary] = line.split(DELIMITER);
            return `
                <tr>
                    <td>${name}</td>
                    <td>${email}</td>
                    <td>${department}</td>
                    <td>${salary}</td>
                    <td><a href="/update?id=${i}">Update</a></td>
                    <td><a href="/delete?id=${i}">Delete</a></td>
                </tr>
            `;
        }).join('');

        res.send(`
            <html><body>
            <h1>Stored Data</h1>
            <table>
                <tr><th>Name</th><th>Email</th><th>Department</th><th>Salary</th><th>Update</th><th>Delete</th></tr>
                ${rows}
            </table>
            <br><a href="/employee">Back to Form</a>
            </body></html>
        `);
    });
});

// Route to update employee data
app.get('/update', (req, res) => {
    const id = querystring.parse(req.url.split('?')[1]).id;
    fs.readFile(FILE_PATH, 'utf8', (err, data) => {
        if (err && err.code !== 'ENOENT') return res.status(500).send('Error reading data file');

        const [name, email, department, salary] = (data || '').trim().split('\n')[Number(id)].split(DELIMITER);
        res.send(`
            <html><body>
            <h1>Update Form</h1>
            <form action="/submit-update?id=${id}" method="POST">
                <label>Name: <input type="text" name="name" value="${name}" required></label><br><br>
                <label>Email: <input type="email" name="email" value="${email}" required></label><br><br>
                <label>Department: <input type="text" name="department" value="${department}" required></label><br><br>
                <label>Salary: <input type="number" name="salary" value="${salary}" required></label><br><br>
                <button type="submit">Update</button>
            </form>
            </body></html>
        `);
    });
});

// Route to handle updates
app.post('/submit-update', (req, res) => {
    const id = querystring.parse(req.url.split('?')[1]).id;
    const { name, email, department, salary } = req.body;
    const newLine = `${name}${DELIMITER}${email}${department}${DELIMITER}${salary}\n`;

    fs.readFile(FILE_PATH, 'utf8', (err, data) => {
        if (err && err.code !== 'ENOENT') return res.status(500).send('Error reading data file');

        let lines = (data || '').trim().split('\n');
        lines[Number(id)] = newLine.trim();

        fs.writeFile(FILE_PATH, lines.join('\n') + '\n', 'utf8', err => {
            if (err) return res.status(500).send('Error writing data file');
            res.send('<script>alert("Data updated successfully"); window.location.href = "/data";</script>');
        });
    });
});

// Route to delete employee data
app.get('/delete', (req, res) => {
    const id = querystring.parse(req.url.split('?')[1]).id;

    fs.readFile(FILE_PATH, 'utf8', (err, data) => {
        if (err && err.code !== 'ENOENT') return res.status(500).send('Error reading data file');

        let lines = (data || '').trim().split('\n');
        lines.splice(Number(id), 1);

        fs.writeFile(FILE_PATH, lines.join('\n') + '\n', 'utf8', err => {
            if (err) return res.status(500).send('Error writing data file');
            res.send('<script>alert("Data deleted successfully"); window.location.href = "/data";</script>');
        });
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
