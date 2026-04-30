# 🏦 Loan-Management-System
A robust, multi-role Loan Management System built with the MERN stack (MongoDB, Express, React/Next.js, Node.js). This application handles the entire loan lifecycle—from borrower registration and automated eligibility checks (BRE) to sanctioning, disbursement, and collection tracking.

<br>

# 🚀 Quick Start (Running the App)
**1. Prerequisites**
  - Node.js (v18 or higher)

  - MongoDB Atlas account (or local MongoDB instance)

  - npm or yarn

**2. Backend Setup**

  1. Navigate to the backend directory:
     
          cd backend
  2. Install dependencies:
     
         npm install

3.  Create a `.env` file in the `backend` folder:
    ```env
    PORT=5001
    MONGODB_URI=your_mongodb_connection_string
    JWT_SECRET=your_random_secret_key
    ```
4.  Start the server:
    ```bash
    npm run dev
    ```
    *The server will run on `http://localhost:5001`*

---

### 3. Frontend Setup
1.  Navigate to the frontend directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env.local` file in the `frontend` folder:
    ```env
    NEXT_PUBLIC_API_URL=http://localhost:5001/api
    ```
4.  Start the development server:
    ```bash
    npm run dev
    ```
    *The app will be available at `http://localhost:3000`*

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | Next.js 15+, TypeScript, Tailwind CSS v4, Axios |
| **Backend** | Node.js, Express, TypeScript, JWT (Authentication) |
| **Database** | MongoDB (Mongoose ODM) |
| **Styling** | Modern Tailwind v4 with CSS Variables |

---

## 👥 User Roles & Demo Flow

To evaluate the system, please follow this lifecycle flow:

### Step 1: The Admin (Sales Lead Manager)
*   **Role Setup:** Set user role to admin.
*   **Action:** Log in as Admin.
*   **Purpose:** Monitors the high-level sales pipeline. Can see all incoming leads and the results of the automated BRE (Business Rule Engine) check (PASS/FAIL) to ensure lead quality.

### Step 2: The Borrower (The Customer)
*   **Action:** Go to `/register`, create an account.
*   **Flow:** Fill the 4-step application (Personal info -> BRE Check -> Document Upload -> Loan Selection).
*   **Status:** The loan moves to **"Applied"**.

### Step 3: The Sanction Executive (The Underwriter)
*   **Role Setup:** Manually change a user's `role` to `sanction` in MongoDB.
*   **Action:** Log in as the Sanction Exec.
*   **Flow:** View the applicant's details and salary slip. Click **Approve**.
*   **Status:** The loan moves to **"Sanctioned"**.

### Step 4: The Disbursement Executive (The Payout)
*   **Role Setup:** Change a user's `role` to `disbursement` in MongoDB.
*   **Action:** Review the sanctioned loan and click **Disburse Funds**.
*   **Status:** The loan moves to **"Disbursed"**.

### Step 5: The Collection Executive (The Recovery)
*   **Role Setup:** Change a user's `role` to `collection` in MongoDB.
*   **Action:** Record a partial or full payment using a UTR number.
*   **Status:** The Borrower’s dashboard updates the payment progress bar in real-time.

---

## ✨ Key Features
*   **Role-Based Access Control (RBAC):** Automatic redirection based on user role upon login.
*   **BRE Engine:** Simulated Business Rule Engine to filter applicants based on age and income.
*   **Real-time Progress Tracking:** Borrowers can see exactly where their loan is in the pipeline.
*   **Tailwind v4 UI:** A high-performance, clean interface using the latest CSS-first configuration.
*   **CORS & Security:** Secure cross-origin communication and JWT-protected routes.

---
