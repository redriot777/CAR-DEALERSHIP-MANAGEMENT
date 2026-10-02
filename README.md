# Car Dealership Management System

## Description
A beginner-friendly, single-page CRUD application for managing a car dealership's vehicle inventory.
The browser (HTML/CSS/JavaScript + Bootstrap 5) talks to an Express.js REST API, which reads and writes a MySQL database:

```
Frontend (fetch)  →  Express REST API  →  MySQL
```

The page never reloads: after every add, edit or delete, the table and statistics are re-fetched from the database.

## Features
- Add car, view car (modal), edit car, update car, delete car (with confirmation)
- Live search (brand, model, variant, fuel type, status)
- Statistics cards (Total / Available / Reserved / Sold) calculated from database records
- Frontend **and** backend validation with friendly error messages
- Toast notifications for success and errors
- Responsive interface (Bootstrap 5)
- REST API with proper HTTP status codes and parameterized SQL queries

## Technologies
```text
HTML, CSS, JavaScript (vanilla), Bootstrap 5, Node.js, Express.js, MySQL
```
npm packages: `express`, `mysql2`, `cors`, `dotenv`. (Bootstrap is loaded from a CDN, so an internet connection is needed to see the styling.)

## Requirements
1. **Node.js 18 or newer** – download from https://nodejs.org (check with `node -v`).
2. **MySQL 8 (or 5.7+)** – download MySQL Community Server from https://dev.mysql.com/downloads/mysql/ and remember the root password you set during installation. (Check with `mysql --version`.)

## Installation
Open a terminal in the project folder (`car-dealership-crud`) and run:

```bash
npm install
```

## Database Setup
1. Make sure MySQL is running.
2. Run the SQL script (it creates the `car_dealership` database, the `cars` table and 10 sample cars):
   ```bash
   mysql -u root -p < database/car_dealership.sql
   ```
   Enter your MySQL password when asked. (Alternatively, open MySQL Workbench, open `database/car_dealership.sql` and run it.)
   *Running the script again resets the `cars` table to the sample data.*
3. Create your `.env` file by copying the example:
   - macOS / Linux: `cp .env.example .env`
   - Windows (Command Prompt): `copy .env.example .env`
4. Open `.env` and set `DB_PASSWORD` (and `DB_USER` if you don't use `root`):
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=car_dealership
   PORT=5000
   ```

## Running
```bash
npm start
```
You should see `Server running at http://localhost:5000` and `Connected to MySQL database "car_dealership".`
Then open **http://localhost:5000** in your browser. The Express server serves both the API and the frontend, so no separate frontend server is needed.

## API Documentation
Base URL: `http://localhost:5000`

| Method | Endpoint | Description | Success |
|--------|----------|-------------|---------|
| GET | `/api/cars` | List all cars | 200 |
| GET | `/api/cars/:id` | Get one car | 200 |
| POST | `/api/cars` | Create a car | 201 |
| PUT | `/api/cars/:id` | Update a car | 200 |
| DELETE | `/api/cars/:id` | Delete a car | 200 |

Errors: `400` invalid input or ID, `404` car not found, `500` server/database error. Error bodies look like `{ "message": "...", "errors": ["..."] }`.

Example body for POST / PUT:
```json
{
  "brand": "Toyota",
  "model": "Innova",
  "variant": "ZX",
  "manufacturing_year": 2023,
  "fuel_type": "Diesel",
  "transmission": "Automatic",
  "price": 2699000,
  "status": "Available"
}
```
Allowed values – fuel_type: Petrol, Diesel, Electric, Hybrid, CNG · transmission: Manual, Automatic · status: Available, Reserved, Sold, Under Service.

## Project Structure
```text
car-dealership-crud/
├── backend/
│   ├── server.js            # Starts Express, serves the frontend and mounts the API
│   ├── db.js                # MySQL connection pool (reads .env)
│   └── routes/carRoutes.js  # The 5 REST routes + backend validation
├── frontend/
│   ├── index.html           # The single page (header, stats, form, table, modal)
│   ├── style.css            # Small custom styles on top of Bootstrap
│   └── script.js            # fetch() calls, rendering, validation, search, toasts
├── database/car_dealership.sql   # Creates the database, table and sample data
├── .env.example             # Template for your private .env
├── .gitignore               # Keeps node_modules and .env out of Git
├── package.json             # Dependencies and the "npm start" script
└── README.md
```

## Troubleshooting
- **MySQL connection refused (`ECONNREFUSED`)** – MySQL is not running. Start the MySQL service (Windows: *Services → MySQL80 → Start*; macOS: `brew services start mysql`; Linux: `sudo systemctl start mysql`). Also check `DB_HOST` and that MySQL uses the default port 3306.
- **Wrong password (`ER_ACCESS_DENIED_ERROR`)** – fix `DB_USER` / `DB_PASSWORD` in `.env`, then restart with `npm start`.
- **Port already in use (`EADDRINUSE`)** – change `PORT` in `.env` (e.g. `5001`) and open that port in the browser, or stop the other program using port 5000.
- **Database doesn't exist (`ER_BAD_DB_ERROR`) / table doesn't exist (`ER_NO_SUCH_TABLE`)** – run `mysql -u root -p < database/car_dealership.sql`.
- **npm dependency errors** – check `node -v` (18+), delete the `node_modules` folder and run `npm install` again.
- **Page has no styling** – Bootstrap loads from a CDN; check your internet connection.
- **`Cannot GET /`** – open `http://localhost:5000` (not a file path) and confirm the server is running.
- **MySQL 8 "caching_sha2_password" / auth errors** – `mysql2` supports this; if you still see an auth error, double-check the password in `.env`.
