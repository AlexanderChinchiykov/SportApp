# Sports and Martial Arts Community

A web application for sports and martial arts communities to manage clubs, events, and member interactions.

## Features

- User registration and authentication with different roles (student, coach, club owner)
- Club management with detailed profiles and image uploads
- Reviews and comments on club pages
- Dashboard for club owners

## Tech Stack

- **Backend**: FastAPI with PostgreSQL database
- **Frontend**: React.js
- **Authentication**: JWT-based authentication

## Setup Instructions

### Prerequisites

- Python 3.8+
- Node.js and npm
- PostgreSQL

### Backend Setup

1. Clone the repository:
   ```
   git clone <repository-url>
   cd <repository-directory>
   ```

2. Create a virtual environment and activate it:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install Python dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Set up the database:
   - Create a PostgreSQL database
   - Update database connection details in the .env file

5. Create .env file with the following variables:
   ```
   DATABASE_URL=postgresql://username:password@localhost/dbname
   SECRET_KEY=yoursecretkey
   ```

6. Run database migrations:
   ```
   alembic upgrade head
   ```

### Frontend Setup

1. Navigate to the React frontend directory:
   ```
   cd app/frontend-react
   ```

2. Install the dependencies:
   ```
   npm install
   ```

3. Build the React app:
   ```
   npm run build
   ```

### Running the Application

1. Start the FastAPI server:
   ```
   python -m uvicorn app.main:app --reload
   ```

2. For development of the React frontend, you can run:
   ```
   cd app/frontend-react
   npm start
   ```
   
   This will start a development server on port 3000 with hot reloading.

3. Access the application at: http://localhost:8000

## API Documentation

- API documentation is available at: http://localhost:8000/docs
- OpenAPI schema available at: http://localhost:8000/api/v1/openapi.json

## Project Structure

```
.
├── app
│   ├── api              # API endpoints
│   ├── core             # Core configurations
│   ├── db               # Database setup
│   ├── frontend-react   # React frontend
│   ├── models           # Database models
│   ├── schemas          # Pydantic schemas
│   ├── services         # Business logic
│   ├── templates        # HTML templates (legacy)
│   └── utils            # Utility functions
├── alembic              # Database migrations
├── uploads              # Uploaded files
└── tests                # Test suite
```

## License

This project is licensed under the MIT License - see the LICENSE file for details. 