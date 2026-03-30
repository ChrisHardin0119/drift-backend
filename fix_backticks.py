import sys
with open(r'C:\Users\Chris\drift-backend\src\routes\seed.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix 1: services INSERT - add backticks around SQL
content = content.replace(
    "await db.query(\n          INSERT INTO services",
    "await db.query(\n          `INSERT INTO services"
)
content = content.replace(
    "RETURNING id, name,\n",
    "RETURNING id, name`,\n"
)

# Fix 2: console.warn template literal
content = content.replace(
    "console.warn(Service not found",
    "console.warn(`Service not found"
)
content = content.replace(
    "${change.service});",
    "${change.service}`);",
    1
)

# Fix 3: changes INSERT - add backticks
content = content.replace(
    "await db.query(\n          INSERT INTO changes",
    "await db.query(\n          `INSERT INTO changes"
)
content = content.replace(
    "VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9),",
    "VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,",
)

# Fix 4: console.error template literal
content = content.replace(
    "console.error(Error inserting change ${change.id}:,",
    "console.error(`Error inserting change ${change.id}:`,",
)

with open(r'C:\Users\Chris\drift-backend\src\routes\seed.js', 'w', encoding='utf-8', newline='\n') as f:
    f.write(content)
print("DONE")
