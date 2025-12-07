# PickleJar - Group Hangouts made Easy
PickleJar is a simple, fun, and hassle-free app that helps groups decide on activities when no one can make up their mind. With no login required, users can create a hangout, submit ideas, vote, and see the final decision—all through a shareable link.

## Getting started

Clone GitHub repository

`git clone git clone https://github.com/joshshiman/picklejar.git`

Navigate to project folder

`cd picklejar`

Initialize virtual environment

`python -m venv venv`

Activate virtual environment

`source venv/bin/activate`

Install dependencies

`pip install -r requirements.txt`

## Running the Project

Navigate to backend

`cd backend`

To update the database when you make model changes

`python manage.py makemigrations`
`python manage.py migrate`

Start the Backend

`python manage.py runserver`

Start the Frontend

`cd frontend`

`npm run dev`

