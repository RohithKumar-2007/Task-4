# TaskFlow DB — MongoDB/Mongoose API

TaskFlow DB transitions the TaskFlow API from a volatile in-memory array to a persistent **MongoDB Atlas** cloud database powered by the **Mongoose ODM**. Every task now persists across server restarts, is stored in a secure cloud cluster, and is queried through a strongly-typed schema with built-in validation, performance indexes, text search, pagination, and transactional bulk operations.

## 🚀 Key Features

1. **MongoDB Atlas Integration**: Replaces volatile memory with full cloud persistence.
2. **Robust Validation**: Enforces string bounds (3 to 255 characters), trims whitespace automatically, and provides dual Zod + Mongoose schema validation.
3. **Database Performance Indexing**:
   * `{ text: "text" }` for fast full-text relevance search.
   * `{ completed: 1 }` to speed up task filtering operations.
   * `{ completed: 1, createdAt: -1 }` compound index for sorted page rendering.
4. **Change Streams (Bonus)**: Actively watches collection mutations in real-time, outputting database events to console logs.
5. **Advanced API Querying**: Integrated text query searching (`GET /api/tasks/search?q=X`) and pagination query parameters (`GET /api/tasks?page=1&limit=10`).
6. **MDB Transactions (Bonus)**: Implements multi-document atomic operations on bulk delete calls (`POST /api/tasks/clear-completed`).

---

## 📁 File Structure

```text
taskflow-db/
├── server.js                        # App entry point (MongoDB connect + middlewares)
├── package.json                    # Project dependencies
├── .env                            # Environment configurations (hidden from Git)
├── .gitignore                      # Git ignore patterns
├── README.md                       # Documentation
├── public/                         # Integrated static UI assets (Aero-Neon Glassmorphism)
│   ├── index.html                  # HTML template
│   ├── app.js                      # API client logic with state-restorer
│   ├── styles/                     # Stylesheets (main.css, utilities.css)
│   └── modules/                    # ES6 UI modules (render.js, validation.js)
├── src/
│   ├── db/
│   │   └── connect.js              # Connection pooling & graceful shutdown logic
│   ├── models/
│   │   └── Task.js                 # Mongoose Schema, Model, & Indexes
│   ├── controllers/
│   │   └── taskController.js       # CRUD actions, Text Search, Pagination, & Transactions
│   ├── routes/
│   │   └── taskRoutes.js           # API route declarations & Swagger docs
│   ├── middleware/
│   │   ├── errorHandler.js         # ValidationError & CastError handler
│   │   └── security.js             # Custom security header middleware
│   └── utils/
│       ├── validators.js           # Zod schema validation rules
│       └── swagger.js              # Swagger configuration definition
└── tests/
    └── taskflow.postman_collection.json # 14-test verification collection
```

---

## 🛠️ Installation & Setup

1. **Clone and open project directory**:
   ```bash
   cd taskflow-db
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root folder (already in `.gitignore`):
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/taskflow?retryWrites=true&w=majority
   ```
   *Replace `<username>`, `<password>`, and host details with your MongoDB Atlas Cluster credentials.*

4. **Launch Server locally**:
   ```bash
   # Development mode with hot reload
   npm run dev

   # Production start
   npm start
   ```

---

## 🧪 Testing & Validation

A suite of 14 verification tests has been configured in `tests/taskflow.postman_collection.json`. 
You can import this collection directly into Postman to run automated queries validating:
* All standard CRUD operations.
* Validation failures for fields (missing text, text < 3 characters).
* Parameter queries (pagination metadata returns, relevance score text matching).
* Transaction failures and status code outputs (400, 404, 500).
```
