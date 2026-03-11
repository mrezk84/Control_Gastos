# Control_Gastos
A modern, responsive expense tracking web application with an interactive dashboard, user authentication, and a clean UI.

## Features
- **Dashboard**: Visualise expenses with interactive charts and quick summaries.
- **Authentication**: Secure login/registration with JWT and OAuth (Google).
- **Expense Management**: Add, edit, and categorize your expenses.
- **Responsive Design**: Works perfectly on desktop and mobile.

## Tech Stack
- Frontend: React.js, Chart.js, Vanilla CSS
- Backend: Python, Flask, SQLAlchemy, SQLite
- Authentication: JWT, Google OAuth

## Setup Instructions

### Backend
1. Go to the `backend` directory.
2. Create a virtual environment: `python3 -m venv .venv`
3. Activate it: `source .venv/bin/activate`
4. Install dependencies: `pip install -r requirements.txt`
5. Create a `.env` file with your secret keys (JWT_SECRET_KEY, GOOGLE_CLIENT_ID, etc.)
6. Run the app: `python app/main.py`

### Frontend
1. Go to the `frontend` directory.
2. Install dependencies: `npm install`
3. Start the dev server: `npm start`
