const fs = require("fs");
const path = require("path");

exports.handler = async (event, context) => {
  const filePath = path.join(__dirname, "..", "..", "db.json");
  const raw = fs.readFileSync(filePath);
  const db = JSON.parse(raw);

  const method = event.httpMethod;
  const url = event.path.replace("/api/", ""); // e.g. users/1
  const [collection, id] = url.split("/");

  if (!db[collection]) {
    return {
      statusCode: 404,
      body: JSON.stringify({ error: "Endpoint not found" })
    };
  }

  // GET /collection
  if (method === "GET" && !id) {
    return {
      statusCode: 200,
      body: JSON.stringify(db[collection])
    };
  }

  // GET /collection/:id
  if (method === "GET" && id) {
    const item = db[collection].find(i => i.id == id);
    return {
      statusCode: item ? 200 : 404,
      body: JSON.stringify(item || { error: "Not found" })
    };
  }

  // POST /collection
  if (method === "POST") {
    const data = JSON.parse(event.body);
    data.id = Date.now();
    db[collection].push(data);
    fs.writeFileSync(filePath, JSON.stringify(db, null, 2));
    return {
      statusCode: 201,
      body: JSON.stringify(data)
    };
  }

  // PUT /collection/:id
  if (method === "PUT" && id) {
    const data = JSON.parse(event.body);
    data.id = Number(id);

    const index = db[collection].findIndex(i => i.id == id);
    if (index === -1) {
      return { statusCode: 404, body: JSON.stringify({ error: "Not found" }) };
    }

    db[collection][index] = data;
    fs.writeFileSync(filePath, JSON.stringify(db, null, 2));

    return { statusCode: 200, body: JSON.stringify(data) };
  }

  // DELETE /collection/:id
  if (method === "DELETE" && id) {
    const newList = db[collection].filter(i => i.id != id);
    db[collection] = newList;
    fs.writeFileSync(filePath, JSON.stringify(db, null, 2));

    return { statusCode: 204, body: "" };
  }

  return {
    statusCode: 400,
    body: JSON.stringify({ error: "Invalid request" })
  };
};
