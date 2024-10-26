const http = require("http");
const fs = require("fs");

const path = "guestBook.json";

// Helper function to read the guestBook.json file
function readGuestBook(callback) {
  fs.readFile(path, "utf8", (err, data) => {
    if (err) {
      return callback(err, null);
    }
    try {
      const guestBook = JSON.parse(data || "[]"); // Handle empty or corrupted JSON
      callback(null, guestBook);
    } catch (err) {
      callback(new Error("Invalid JSON format in guestBook"), null);
    }
  });
}

// Helper function to write to the guestBook.json file
function writeGuestBook(data, callback) {
  fs.writeFile(path, JSON.stringify(data, null, 2), "utf8", (err) => {
    if (err) {
      return callback(err);
    }
    callback(null);
  });
}

function routing(req, res) {
  const url = req.url;

  // Serve the form page
  if (url === "/form" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.write(`
      <html>
      <head>
        <title>Guestbook Form</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 40px;
            background-color: #f4f4f9;
          }
          h1 {
            text-align: center;
            color: #333;
          }
          form {
            max-width: 400px;
            margin: 0 auto;
            padding: 20px;
            background-color: #fff;
            border-radius: 10px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
          }
          label {
            display: block;
            margin-bottom: 8px;
            font-weight: bold;
          }
          input, select, textarea {
            width: 100%;
            padding: 8px;
            margin-bottom: 20px;
            border: 1px solid #ccc;
            border-radius: 5px;
          }
          input[type="submit"] {
            background-color: #28a745;
            color: white;
            border: none;
            padding: 10px;
            font-size: 16px;
            cursor: pointer;
            border-radius: 5px;
          }
          input[type="submit"]:hover {
            background-color: #218838;
          }
        </style>
      </head>
      <body>
        <h1>Guestbook Form</h1>
        <form action="/add" method="POST">
          <label for="name">Name:</label>
          <input type="text" name="name" id="name" placeholder="Enter your name" required>

          <label for="age">Age:</label>
          <input type="number" name="age" id="age" placeholder="Enter your age" required>

          <label for="gender">Gender:</label>
          <select name="gender" id="gender" required>
            <option value="" disabled selected>Select your gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>

          <label for="comment">Comment:</label>
          <textarea name="comment" id="comment" rows="4" placeholder="Leave a comment" required></textarea>

          <input type="submit" value="Submit">
        </form>
      </body>
      </html>
    `);
    res.end();

  } else if (url === "/add" && req.method === "POST") {
    let body = '';

    // Listen for data chunks
    req.on('data', (chunk) => {
      body += chunk;
    });

    // Once all data is received
    req.on('end', () => {
      const params = new URLSearchParams(body);
      const name = params.get('name');
      const age = params.get('age');
      const gender = params.get('gender');
      const comment = params.get('comment');

      if (!name || !age || !gender || !comment) {
        res.writeHead(400, { "Content-Type": "text/plain" });
        res.end("Bad Request: Missing form data");
        return;
      }

      // Read the existing guestBook file
      readGuestBook((err, guestBook) => {
        if (err) {
          res.writeHead(500, { "Content-Type": "text/plain" });
          res.end("Error reading guestbook data.");
          return;
        }

        // Add the new entry
        guestBook.push({ name, age, gender, comment });

        // Write the updated guestBook back to the file
        writeGuestBook(guestBook, (err) => {
          if (err) {
            res.writeHead(500, { "Content-Type": "text/plain" });
            res.end("Error writing guestbook data.");
            return;
          }
          // Show a success message with a button to view the guestbook
          res.writeHead(200, { "Content-Type": "text/html" });
          res.write(`
            <html>
            <head>
              <title>Submission Successful</title>
              <style>
                body {
                  font-family: Arial, sans-serif;
                  margin: 40px;
                  background-color: #f4f4f9;
                  text-align: center;
                }
                h1 {
                  color: #28a745;
                }
                button {
                  background-color: #28a745;
                  color: white;
                  border: none;
                  padding: 10px 20px;
                  font-size: 16px;
                  cursor: pointer;
                  border-radius: 5px;
                  margin-top: 20px;
                }
                button:hover {
                  background-color: #218838;
                }
              </style>
            </head>
            <body>
              <h1>Successfully updated the guestbook!</h1>
              <p>Thank you for your submission.</p>
              <a href="/read"><button>View Guestbook</button></a>
            </body>
            </html>
          `);
          res.end();
        });
      });
    });

  } else if (url === "/read" && req.method === "GET") {
    // Handle the /read route to display guestBook.json content as JSON
    readGuestBook((err, guestBook) => {
      if (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Could not read guestbook data" }));
        return;
      }

      // Style the /read page similarly to the form page
      res.writeHead(200, { "Content-Type": "text/html" });
      res.write(`
        <html>
        <head>
          <title>Guestbook Entries</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 40px;
              background-color: #f4f4f9;
            }
            h1 {
              text-align: center;
              color: #333;
            }
            .entry {
              max-width: 600px;
              margin: 20px auto;
              padding: 20px;
              background-color: #fff;
              border-radius: 10px;
              box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            }
            .entry h3 {
              margin: 0;
              color: #28a745;
            }
            .entry p {
              margin: 5px 0;
            }
          </style>
        </head>
        <body>
          <h1>Guestbook Entries</h1>
          ${guestBook.map(entry => `
            <div class="entry">
              <h3>${entry.name} (${entry.age} years old)</h3>
              <p><strong>Gender:</strong> ${entry.gender}</p>
              <p><strong>Comment:</strong> ${entry.comment}</p>
            </div>
          `).join('')}
        </body>
        </html>
      `);
      res.end();
    });

  } else {
    // Handle 404 - Page not found
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("No matching page");
  }
}

// Create a server object
http.createServer(routing).listen(3000, () => {
  console.log("Server started at port 3000");
});
