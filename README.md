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

Start the backend
`cd backend`
`python manage.py migrate`
`python manage.py runserver`

Start the Frontend
`cd frontend`
`npm run dev`

## Django Project Creation (one-time)

Create django project
`django-admin startproject backend`
`cd backend`

Create picklejar app
`python manage.py startapp hangouts`

Define database model (`settings.py DATABASES`)

```
import uuid
from django.db import models

class Hangout(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    deadline = models.DateTimeField()
    status = models.CharField(max_length=20, choices=[('idea collection', 'Idea Collection'), ('voting', 'Voting'), ('completed', 'Completed')], default='idea collection')
    created_at = models.DateTimeField(auto_now_add=True)

class Idea(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    hangout = models.ForeignKey(Hangout, on_delete=models.CASCADE, related_name="ideas")
    session_id = models.CharField(max_length=255)  # Anonymous session-based tracking
    content = models.TextField()

class Vote(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    hangout = models.ForeignKey(Hangout, on_delete=models.CASCADE, related_name="votes")
    idea = models.ForeignKey(Idea, on_delete=models.CASCADE, related_name="votes")
    session_id = models.CharField(max_length=255)

```

Configure Django (`backend/settings.py`)
```

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'hangouts',
]

```

Enable CORS for Front-End
`CORS_ALLOW_ALL_ORIGINS = True`

Database Setup (PostgreSQL Recommended)
- Install PostgreSQL and create a database
- Update DATABASES in settings.py

```
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'picklejar',
        'USER': 'your_db_user',
        'PASSWORD': 'your_db_password',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
```

Create API Views (`backend/hangouts/views.py`)
```
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Hangout, Idea, Vote
from .serializers import HangoutSerializer, IdeaSerializer, VoteSerializer

@api_view(['POST'])
def create_hangout(request):
    """Create a new hangout and return its link"""
    title = request.data.get('title')
    deadline = request.data.get('deadline')
    hangout = Hangout.objects.create(title=title, deadline=deadline)
    return Response({"link": f"/hangout/{hangout.id}"})

@api_view(['POST'])
def submit_idea(request, hangout_id):
    """Submit an idea for a hangout"""
    hangout = Hangout.objects.get(id=hangout_id)
    session_id = request.data.get('session_id')
    content = request.data.get('content')
    Idea.objects.create(hangout=hangout, session_id=session_id, content=content)
    return Response({"message": "Idea submitted!"})

@api_view(['POST'])
def submit_vote(request, hangout_id):
    """Submit votes for ideas"""
    hangout = Hangout.objects.get(id=hangout_id)
    session_id = request.data.get('session_id')
    votes = request.data.get('votes')  # List of idea IDs
    for idea_id in votes:
        Vote.objects.create(hangout=hangout, idea_id=idea_id, session_id=session_id)
    return Response({"message": "Votes submitted!"})
```

Setup URLs (`backend/hangouts/urls.py`)
```
from django.urls import path
from .views import create_hangout, submit_idea, submit_vote

urlpatterns = [
    path('create/', create_hangout),
    path('<uuid:hangout_id>/submit_idea/', submit_idea),
    path('<uuid:hangout_id>/submit_vote/', submit_vote),
]
```

Migrate Database and Run the Server
`python manage.py makemigrations`
`python manage.py migrate`
`python manage.py runserver`

## Set Up React Frontend (one-time)

### Initialize the React Frontend

```
cd ..
npx create-vite@latest frontend --template react
cd frontend
npm install
```

Install Dependencies
`npm install axios react-router-dom tailwindcss postcss autoprefixer
npx tailwindcss init -p`

Configure Tailwind (`tailwind.config.js`)
```
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

Update src/index.css
```
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### Create React Components

Setup React Router (`src/main.jsx`)
```
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import Home from "./pages/Home";
import Hangout from "./pages/Hangout";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/hangout/:id" element={<Hangout />} />
    </Routes>
  </BrowserRouter>
);
```

Home Page (`src/pages/Home.jsx`)

```
import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState("");
  const navigate = useNavigate();

  const createHangout = async () => {
    const response = await axios.post("http://127.0.0.1:8000/create/", {
      title,
      deadline,
    });
    navigate(`/hangout/${response.data.link.split("/").pop()}`);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold">Create a PickleJar Hangout</h1>
      <input
        type="text"
        placeholder="Enter hangout title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="border p-2 mt-4"
      />
      <input
        type="datetime-local"
        value={deadline}
        onChange={(e) => setDeadline(e.target.value)}
        className="border p-2 mt-2"
      />
      <button
        onClick={createHangout}
        className="bg-green-500 text-white px-4 py-2 mt-4"
      >
        Create Hangout
      </button>
    </div>
  );
}
```

Hangout Page (`src/pages/Hangout.jsx`)

```
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

export default function Hangout() {
  const { id } = useParams();
  const [ideas, setIdeas] = useState([]);
  const [newIdea, setNewIdea] = useState("");
  const [status, setStatus] = useState("idea collection");

  useEffect(() => {
    axios.get(`http://127.0.0.1:8000/hangout/${id}`).then((res) => {
      setIdeas(res.data.ideas);
      setStatus(res.data.status);
    });
  }, [id]);

  const submitIdea = async () => {
    await axios.post(`http://127.0.0.1:8000/hangout/${id}/submit_idea/`, {
      session_id: localStorage.getItem("session_id") || "anonymous",
      content: newIdea,
    });
    setIdeas([...ideas, { content: newIdea }]);
    setNewIdea("");
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Hangout: {id}</h1>

      {status === "idea collection" ? (
        <>
          <input
            type="text"
            placeholder="Enter an idea"
            value={newIdea}
            onChange={(e) => setNewIdea(e.target.value)}
            className="border p-2 mt-4 w-full"
          />
          <button onClick={submitIdea} className="bg-blue-500 text-white px-4 py-2 mt-2">
            Submit Idea
          </button>
        </>
      ) : (
        <h2 className="text-xl mt-4">Voting has started!</h2>
      )}

      <h2 className="text-xl mt-6">Ideas</h2>
      <ul className="list-disc pl-6">
        {ideas.map((idea, index) => (
          <li key={index}>{idea.content}</li>
        ))}
      </ul>
    </div>
  );
}

```

